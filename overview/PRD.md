# Product Requirements Document

# EDMS — Employee Document Management System

Version 1.3 | August 2026 | Internal

## Changelog

- v1.0: Initial EDMS requirements for employee CRUD, document tracking, expiry monitoring, and admin workflows.
- v1.1: Added dashboard UX, alerting logic, audit logging, and OCR-assisted data entry.
- v1.2: Updated architecture and requirements to reflect the current implementation stack.
- v1.3: Corrected the project architecture to the current codebase: React + Vite frontend, Express + Prisma backend, PostgreSQL database, JWT cookie auth, and role-based access controls.

## 1. Product Overview

EDMS is an internal employee document management system designed for HR and administrative users to centrally maintain employee records, monitor critical document expiry dates, and ensure role-based access to sensitive employee data.

The current implementation is built around a two-part application:

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript + Prisma ORM + PostgreSQL

The system allows authorized users to create, edit, archive, and review employee records, while also surfacing document expiry states for proactive follow-up.

## 2. Goals

### Primary goals

- Centralize employee records in a secure internal application.
- Reduce document expiry risk for passports, labor cards, Emirates IDs, and visas.
- Keep data access restricted to authorized roles.
- Provide immutable audit history for employee changes.
- Support OCR-assisted form prefill for document extraction.
- Keep the system lightweight, maintainable, and easy to run locally.

### Success criteria

- Admins can manage employee records without using spreadsheets or manual folders.
- Super Admins can manage user accounts and employee records.
- Expiring or expired documents are visible in the dashboard and notification UI.
- Employee edits are logged and traceable.
- Sensitive employee access is controlled by authenticated sessions and role checks.

## 3. Users and Roles

### 3.1 Role model

| Role | Permissions |
| --- | --- |
| ADMIN | Manage employee records, view employee detail pages, use OCR-assisted entry, view relevant audit history |
| SUPER_ADMIN | Full access to employee management plus user management, account visibility, and higher-level admin controls |

### 3.2 Role behavior

- Admins can work with employee records but cannot manage application users.
- Super Admins can manage both employee data and user accounts.
- Authenticated sessions are required for all protected routes.
- Role checks are enforced on the backend middleware layer and UI route guards.

## 4. Functional Requirements

### 4.1 Authentication and session management

- Users authenticate using email and password.
- The backend validates credentials and issues a JWT.
- The JWT is stored in an HTTP-only cookie for browser-based access.
- Explicit logout revokes the token by storing it in a blocklist table.
- Session expiry is handled by the backend middleware.

### 4.2 User management

- Super Admins can create users.
- Users include fields such as name, email, role, active status, and password policy flags.
- Password changes can be enforced via a must-change-password flow.
- Inactive users are not treated as valid authenticated users for protected operations.

### 4.3 Employee management

- Users can create new employee records.
- Records include personal data, contact details, document numbers, expiry dates, and status.
- Users can update employee details.
- Employees can be archived instead of permanently deleted.
- Archived records remain accessible for reporting and historical reference.

### 4.4 Dashboard and list views

- Dashboard shows employee cards or rows with key information.
- Search supports employee names, employee number, and designation.
- Users can filter by status, gender, designation, and expiry window.
- The app supports sorting by common employee fields.
- Rows are highlighted to indicate expired or expiring document windows.

### 4.5 Document expiry tracking

- System tracks expiry date fields for:
  - passport expiry
  - labor card expiry
  - Emirates ID expiry
  - visa expiry
- The app exposes a dedicated expiry/staleness filter.
- Expired or soon-to-expire records are shown in alerts and dashboard summaries.

### 4.6 Notification handling

- The app supports expiration-aware notifications.
- Notification logic is tied to employee expiry windows.
- Notification records are written to a database log to prevent duplicate alerts.
- Emails are sent through a background outbound integration (currently via a mail provider abstraction).

### 4.7 Audit logging

- Every create, update, archive, restore, and delete action is logged.
- Each audit record stores actor identity, entity details, timestamp, and the before/after values.
- Audit history is available to support traceability and data governance.

### 4.8 OCR-assisted entry

- Users may upload ID or passport files to prefill values.
- OCR is handled on the backend.
- Extracted data is surfaced as editable suggestions before saving.
- Files are not retained permanently for the primary workflow.

## 5. Data Model

The current implementation uses Prisma and PostgreSQL. The primary models are:

- User
- TokenBlocklist
- Employee
- AuditLog
- NotificationLog

### 5.1 User model

Key fields:

- id
- email
- passwordHash
- fullName
- role
- isActive
- mustChangePw
- lastLoginAt
- createdAt
- updatedAt

### 5.2 Employee model

Key fields:

- id
- employeeNumber
- designation
- lastName
- firstName
- gender
- birthdate
- mobileNo
- email
- passportNo
- passportExpiry
- laborCardNo
- laborCardExpiry
- eidNo
- eidExpiry
- uidNo
- fileNo
- visaExpiry
- status
- createdAt
- updatedAt
- archivedAt
- createdById
- updatedById

### 5.3 Audit log model

Stores:

- entityType
- entityId
- action
- changedById
- changedAt
- previousValue
- newValue

This supports field-level review and compliance visibility.

### 5.4 Notification log model

Used to prevent duplicate alerts by a unique employee + document-field combination.

## 6. Architecture

### 6.1 Frontend stack

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Tailwind CSS
- shadcn-inspired component conventions

### 6.2 Backend stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT auth via secure HTTP-only cookies
- Middleware for authentication and validation

### 6.3 Current implementation flow

```text
Browser (React app)
    │
    ├── Authenticated requests to Express API
    │
    └── Protected dashboard / employee pages
            │
            ▼
Express API (routes + controllers + services)
            │
            ├── validates requests
            ├── enforces auth middleware
            ├── reads/writes PostgreSQL via Prisma
            ├── handles employee CRUD
            ├── logs audit entries
            └── processes OCR / notification flows
```

This differs from the earlier Supabase-only design: the active codebase uses a custom Express backend rather than a Supabase backend.

## 7. Security Model

### 7.1 Authentication

- Users authenticate through server-side login logic.
- JWTs are stored in HTTP-only cookies.
- Protected routes require a valid session.
- Tokens can be revoked via blocklist storage.

### 7.2 Authorization

- Admin and Super Admin roles are enforced through middleware and route guards.
- Sensitive endpoints are restricted to Super Admins where required.
- Account creation and user management are not exposed to regular admins.

### 7.3 Data handling

- Employee document and personal data are treated as sensitive internal records.
- Prisma + Postgres is used as the persistence layer.
- Audit data is retained for traceability.
- Input validation is enforced with Zod schemas.

## 8. Project Structure

```text
EDMS/
├─ edms-backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  ├─ src/
│  │  ├─ controllers/
│  │  │  ├─ auth.controller.ts
│  │  │  └─ employee.controller.ts
│  │  ├─ lib/
│  │  │  ├─ prisma.ts
│  │  │  ├─ schemas.ts
│  │  │  ├─ seed.ts
│  │  │  └─ utils.ts
│  │  ├─ middleware/
│  │  │  └─ auth.ts
│  │  ├─ routes/
│  │  │  ├─ auth.routes.ts
│  │  │  └─ employee.routes.ts
│  │  ├─ services/
│  │  │  ├─ auth.service.ts
│  │  │  ├─ employee.service.ts
│  │  │  ├─ notification.service.ts
│  │  │  ├─ ocr.service.ts
│  │  │  └─ user.service.ts
│  │  ├─ types/
│  │  │  └─ index.ts
│  │  └─ index.ts
│  ├─ .env
│  ├─ .env.example
│  ├─ .gitignore
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ tsconfig.json
│  └─ cookies.txt
│
├─ edms-frontend/
│  ├─ src/
│  │  ├─ api/
│  │  │  ├─ auth.ts
│  │  │  ├─ employees.ts
│  │  │  ├─ ocr.ts
│  │  │  └─ users.ts
│  │  ├─ components/
│  │  │  ├─ auth/
│  │  │  ├─ employee/
│  │  │  └─ layout/
│  │  ├─ hooks/
│  │  │  └─ useEmployees.ts
│  │  ├─ lib/
│  │  │  ├─ axios.ts
│  │  │  └─ utils.ts
│  │  ├─ pages/
│  │  │  ├─ AccountsPage.tsx
│  │  │  ├─ ArchivePage.tsx
│  │  │  ├─ DashboardPage.tsx
│  │  │  ├─ EmployeeRecordPage.tsx
│  │  │  └─ LoginPage.tsx
│  │  ├─ store/
│  │  │  └─ auth.store.ts
│  │  ├─ types/
│  │  │  └─ index.ts
│  │  ├─ App.tsx
│  │  ├─ main.tsx
│  │  ├─ index.css
│  │  └─ App.css
│  ├─ public/
│  │  ├─ favicon.svg
│  │  └─ icons.svg
│  ├─ .env
│  ├─ .gitignore
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ tsconfig.json
│  ├─ tsconfig.app.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
│
├─ overview/
│  ├─ PRD.md
│  └─ System design.md
│
├─ package.json
├─ package-lock.json
└─ node_modules/
```

## 9. API Surface Overview

### Backend API patterns

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/users`
- `/api/employees`
- `/api/employees/:id`
- `/api/employees/:id/audit`
- `/api/employees/:id/archive`
- `/api/employees/:id/restore`
- `/api/ocr/extract`

### API conventions

- JSON responses are wrapped in a success flag and data payload.
- Errors return a structured payload with `success: false` and an error message.
- Protected routes require valid auth cookies.

## 10. Release Notes / Current Status

The current project is in active implementation and includes:

- secure auth flow with JWT cookie sessions
- Prisma + PostgreSQL persistence
- employee CRUD and archive flows
- dashboard search/filter/sort
- document expiry tracking
- audit logging
- notification data model
- OCR-assisted employee record entry
- role-specific route guards

Planned or future improvements may include:

- scheduled automated background expiry jobs
- richer notification delivery workflows
- stronger file retention/security controls for OCR uploads
- broader reporting and analytics
- optional multi-tenant support

## 11. Notes for Future Maintenance

- Keep Prisma schema and backend types aligned.
- Keep UI route access checks in sync with backend authorization rules.
- Preserve audit logging for all write operations.
- Treat employee document and personal data as regulated internal records.
- Validate all date inputs before creating or updating an employee.

This PRD reflects the current implementation status of the EDMS project and should be used as the baseline for future feature work and onboarding.
