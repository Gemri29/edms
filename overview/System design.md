**

SYSTEM DESIGN DOCUMENT

Employee Document Management System

EDMS — System Design v1.0 (aligned to PRD v1.2)

Version 1.0 | August 2026 | Confidential

Companion document to PRD.md. This document describes how the requirements in the PRD are implemented: architecture, data model, security model, and key flows.

# 1. Architecture Overview

EDMS is a single-page React application backed entirely by **Supabase** — no standalone application server is written for v1.0. Business logic that must not run in the browser (sending email, calling the OCR provider, privileged user creation, the scheduled expiration check) runs in **Supabase Edge Functions**. Everything else (reads/writes on employees, reads on audit_log) goes straight from the browser to Postgres through the Supabase client SDK, governed entirely by **Row-Level Security (RLS)**.

```
┌─────────────────────────────┐
│  Browser (React + Vite)     │
│  - React Router v6          │
│  - TanStack Query           │
│  - Zustand (auth/session)   │
│  - shadcn/ui + Tailwind     │
└──────────────┬───────────────┘
               │ HTTPS, Supabase JS client (anon key)
               ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Project                                            │
│                                                               │
│  ┌───────────────┐   ┌────────────────────────────────────┐ │
│  │ Supabase Auth │   │ Postgres (RLS enforced on every table)│
│  │ (email/pass)  │   │  employees | profiles | audit_log    │ │
│  └───────────────┘   │  notification_log                    │ │
│                       │  trigger: employees -> audit_log     │ │
│                       └────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Edge Functions (Deno, service-role key, server only)    │ │
│  │  employee-autofill   check-expirations   create-user    │ │
│  └───────────────┬─────────────────────┬───────────────────┘ │
│                  │                     │                     │
│  ┌───────────────▼──┐   ┌──────────────▼─────┐   ┌─────────┐│
│  │ Storage (transient)│  │ pg_cron (daily)     │   │         ││
│  │ ID upload scratch  │  │ triggers check-exp   │   │         ││
│  └────────────────────┘  └─────────────────────┘   │         ││
└──────────────────────────────────────┬──────────────┘         │
                                        │                        │
                        ┌───────────────▼────────┐  ┌───────────▼──────┐
                        │ Resend (email)          │  │ OCR/Doc-AI vendor │
                        └─────────────────────────┘  └───────────────────┘
```

**Why this shape:** the PRD's feature set (role-gated CRUD, scheduled notifications, file-triggered auto-fill, immutable audit logging) maps cleanly onto Supabase primitives — Auth, RLS, Edge Functions, Storage, pg_cron — without needing a separately hosted API server to build, deploy, and secure. The trade-off, noted where relevant below, is that authorization correctness now depends on RLS policies being right, since the browser talks to Postgres directly.

# 2. Data Model

## 2.1 Entity-Relationship Summary

```
auth.users (Supabase-managed)
     │ 1:1
     ▼
profiles ──────────────┐
  id (FK -> auth.users) │ role: admin | super_admin
  full_name             │ status: active | deactivated
  role                  │
  status                │
                         │
employees                │
  id                     │
  employee_number (uniq) │
  ...personal fields...  │
  status: active|archived│
  created_by ─────────────┘ (FK -> profiles.id)
  updated_by ─────────────┘ (FK -> profiles.id)

audit_log
  id, employee_id (FK), actor_id (FK -> profiles.id)
  action (insert|update|archive), field, old_value, new_value, at

notification_log
  id, employee_id (FK), document_type, expiration_date
  sent_at, recipient, resend_message_id
```

## 2.2 Table Definitions (illustrative SQL)

```sql
-- profiles: one row per app user, mirrors auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'super_admin')),
  status text not null default 'active' check (status in ('active', 'deactivated')),
  created_at timestamptz not null default now()
);

-- employees: core record
create table employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique,
  designation text not null,
  last_name text not null,
  first_name text not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  birthdate date not null,
  mobile_no text not null,
  email text not null,
  passport_no text,
  passport_expiration date,
  lc_no text,
  lc_expiration date,
  eid_no text,
  eid_expiration date,
  uid_no text,
  file_no text,
  visa_expiration date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

create index on employees (status);
create index on employees (last_name);
create index on employees (passport_expiration);
create index on employees (lc_expiration);
create index on employees (eid_expiration);
create index on employees (visa_expiration);

-- audit_log: append-only, field-level
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  actor_id uuid not null references profiles(id),
  action text not null check (action in ('insert', 'update', 'archive')),
  field text,          -- null for insert/archive; set per changed field on update
  old_value text,
  new_value text,
  at timestamptz not null default now()
);

-- notification_log: dedupe + visibility for sent expiration emails
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  document_type text not null check (document_type in ('passport', 'lc', 'eid', 'visa')),
  expiration_date date not null,
  sent_at timestamptz not null default now(),
  recipient text not null,
  resend_message_id text
);
```

## 2.3 Audit Trigger (server-enforced, not app-enforced)

A Postgres trigger — not application code — writes to `audit_log` on every insert/update/delete against `employees`, so no write path (including a direct Supabase client call) can bypass logging, per PRD 5.4.

```sql
create or replace function log_employee_change() returns trigger as $$
declare
  col text;
  old_val text;
  new_val text;
begin
  if (tg_op = 'INSERT') then
    insert into audit_log (employee_id, actor_id, action)
    values (new.id, auth.uid(), 'insert');
    return new;
  elsif (tg_op = 'UPDATE') then
    if new.status = 'archived' and old.status = 'active' then
      insert into audit_log (employee_id, actor_id, action)
      values (new.id, auth.uid(), 'archive');
    end if;
    -- field-by-field diff (illustrative; generated via hstore comparison in practice)
    for col in select unnest(array['designation','last_name','first_name','gender',
      'birthdate','mobile_no','email','passport_no','passport_expiration','lc_no',
      'lc_expiration','eid_no','eid_expiration','uid_no','file_no','visa_expiration'])
    loop
      execute format('select ($1).%I::text, ($2).%I::text', col, col)
        into old_val, new_val using old, new;
      if old_val is distinct from new_val then
        insert into audit_log (employee_id, actor_id, action, field, old_value, new_value)
        values (new.id, auth.uid(), 'update', col, old_val, new_val);
      end if;
    end loop;
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger employees_audit
after insert or update on employees
for each row execute function log_employee_change();
```

# 3. Authorization Model (Row-Level Security)

Every table has RLS enabled; the browser's Supabase client carries the logged-in user's JWT, and Postgres evaluates these policies on every query — this is the actual enforcement point, not just the React UI.

```sql
alter table employees enable row level security;
alter table profiles enable row level security;
alter table audit_log enable row level security;
alter table notification_log enable row level security;

-- Helper: current user's role
create or replace function current_role_is(target text) returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target and status = 'active'
  );
$$ language sql security definer stable;

-- employees: any active admin/super_admin can read & write
create policy employees_select on employees for select
  using (current_role_is('admin') or current_role_is('super_admin'));
create policy employees_insert on employees for insert
  with check (current_role_is('admin') or current_role_is('super_admin'));
create policy employees_update on employees for update
  using (current_role_is('admin') or current_role_is('super_admin'));
-- no delete policy: archiving is an UPDATE (status='archived'), true DELETE is blocked entirely

-- profiles / user management: Super Admin only
create policy profiles_select on profiles for select
  using (current_role_is('super_admin') or id = auth.uid());
create policy profiles_write on profiles for insert with check (current_role_is('super_admin'));
create policy profiles_update on profiles for update using (current_role_is('super_admin'));

-- audit_log: Admins see their own actions, Super Admins see all
create policy audit_select on audit_log for select
  using (current_role_is('super_admin') or actor_id = auth.uid());
-- no insert/update/delete policy for regular roles — only the SECURITY DEFINER trigger writes here

-- notification_log: Super Admin visibility only
create policy notif_select on notification_log for select
  using (current_role_is('super_admin'));
```

This directly implements PRD Section 3 (role matrix) and 5.4 (audit visibility) at the data layer, so a bug in the frontend can't silently expose data across roles.

# 4. Frontend Structure

## 4.1 Routes (maps to PRD 3.1)

|Route|Component|Roles|
|---|---|---|
|`/login`|LoginPage|Public|
|`/dashboard`|DashboardPage|Admin, Super Admin|
|`/employees/:id`|EmployeeRecordPage|Admin, Super Admin|
|`/employees/new`|EmployeeRecordPage (create mode)|Admin, Super Admin|
|`/accounts`|AccountManagementPage|Super Admin only (route-guarded + RLS-backed)|

A route guard checks the Zustand-held session/role before rendering `/accounts`; this is a UX convenience only — the real boundary is the `profiles_*` RLS policies in Section 3, so even a guard bypass can't read/write user data as a non-Super-Admin.

## 4.2 DashboardPage layout (PRD 5.2.2)

```
┌─────────────────────────────────────────────┐
│ [ Search box ]   [ Filter ▾ ]   [ A-Z ↕ ]     │
├─────────────────────────────────────────────┤
│ ● John Smith — Sr. Engineer — EMP-0231        │  ← light-red bg (expiring)
│   Passport exp: 2026-11-02                    │
├─────────────────────────────────────────────┤
│   Aisha Al-Rashid — HR Lead — EMP-0110         │
│   Visa exp: 2027-05-14                        │
├─────────────────────────────────────────────┤
│   ... (paginated, 25/page) ...                │
└─────────────────────────────────────────────┘
```

- Query: TanStack Query fetches `employees` filtered `status='active'` (plus "Show Archived" toggle for `status='archived'`), computed client-side or via a view for "nearest expiration within 6 months" to drive the row highlight class.
- Recommend a Postgres view `employees_with_alert_flag` that pre-computes `is_expiring` server-side, so the highlight logic isn't duplicated in the frontend and stays correct if PRD's 6-month window ever changes:

```sql
create view employees_with_alert_flag as
select *,
  (status = 'active' and (
    passport_expiration <= current_date + interval '6 months' or
    lc_expiration <= current_date + interval '6 months' or
    eid_expiration <= current_date + interval '6 months' or
    visa_expiration <= current_date + interval '6 months'
  )) as is_expiring
from employees;
```

## 4.3 EmployeeRecordPage (PRD 5.2.3, 5.4, 5.5)

- Form (react-hook-form + Zod) for all Section-4 fields.
- "Upload ID to auto-fill" control → calls `employee-autofill` Edge Function → populates form fields as **editable suggestions** (never auto-saved).
- "History" tab/panel reads `audit_log` for this employee (respecting the RLS scoping in 3).

# 5. Key Flows

## 5.1 Login

1. React calls `supabase.auth.signInWithPassword()`.
2. Supabase Auth validates credentials, returns a session (JWT + refresh token), stored via the Supabase client's session persistence.
3. Zustand store reads the user's `profiles.role` (single row select, RLS-permitted for self) to drive route guarding.

## 5.2 Create/Edit Employee

1. Admin submits the form → Zod validation client-side → `supabase.from('employees').insert(...)` or `.update(...)`.
2. RLS policy `employees_insert`/`employees_update` checks role.
3. Postgres trigger `employees_audit` fires, writing one or more `audit_log` rows (Section 2.3) — this happens regardless of which client path made the write.
4. TanStack Query invalidates the dashboard list query.

## 5.3 ID Auto-fill (PRD 5.5)

1. Admin selects a file in the EmployeeRecordPage upload control.
2. Browser calls `employee-autofill` Edge Function, sending the file over HTTPS (never touches the browser's persistent storage).
3. Edge Function: validates file type/size → malware-scans → uploads to a **temporary** Storage path → calls the OCR provider → parses response into field suggestions → **deletes the Storage object** → returns JSON suggestions to the client.
4. Admin reviews/edits suggestions in the form; nothing is persisted until they hit Save (flow 5.2).
5. No document bytes are ever written to Postgres, logs, or permanent Storage — satisfying the no-retention decision in PRD 5.5/10.1.

## 5.4 Expiration Notification Job (PRD 5.3)

1. `pg_cron` triggers `check-expirations` Edge Function daily (e.g. 06:00 Gulf Standard Time).
2. Function queries `employees_with_alert_flag` for `is_expiring = true and status = 'active'`.
3. For each matching document, checks `notification_log` for a send within the last 30 days for that `(employee_id, document_type)` pair — skips if found (dedupe/cooldown).
4. Calls Resend to email Super Admins (+ optionally the record's `created_by`/`updated_by`).
5. Writes a `notification_log` row per email sent.

## 5.5 Account Creation (Super Admin only)

1. Super Admin submits new-user form on AccountManagementPage.
2. Browser calls `create-user` Edge Function (cannot be done with the anon key/client alone, since creating an `auth.users` row requires the Supabase service-role key).
3. Edge Function verifies caller is `super_admin` (double-checked server-side, not just trusted from the client), creates the `auth.users` row via the Supabase Admin API, then inserts the matching `profiles` row.

# 6. Security Design Summary

Maps directly to PRD Section 8.5; called out here as it lands on specific components:

- **RLS on every table** is the primary authorization boundary (Section 3) — frontend route guards are UX only.
- **Service-role key never reaches the browser** — confined to Edge Functions (`employee-autofill`, `check-expirations`, `create-user`).
- **No persistent storage of uploaded ID documents** — Storage object is scratch space, deleted synchronously after OCR, with a Storage lifecycle rule as a backstop against orphaned files.
- **Audit log is trigger-enforced**, not app-enforced, so it can't be bypassed by a direct table write.
- **Transport**: TLS everywhere (Supabase-managed); **at rest**: Supabase-managed Postgres/Storage encryption.
- **Secrets** (Resend API key, OCR provider key, service-role key) live only in Edge Function environment variables, never in frontend bundle or source control.

# 7. Open Implementation Decisions

- Prisma vs. Supabase CLI migrations for schema management (Phase 1 decision, PRD 6.3).
- Exact OCR/document-AI vendor selection for UAE ID formats (Phase 4, PRD 6.2).
- Notification recipient configurability (fixed to Super Admins vs. a configurable list) — default per PRD 5.3 is all Super Admins.