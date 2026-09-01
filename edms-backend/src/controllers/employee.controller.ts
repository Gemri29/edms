import { Request, Response } from 'express'
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  archiveEmployee,
  restoreEmployee,
  deleteEmployee,
} from '../services/employee.service'
import { AuthenticatedRequest, PaginatedResponse } from '../types'
import { EmployeeQuery } from '../lib/schemas'

// --- GET /api/employees ---------------------------------------------------

export async function getEmployees(req: Request, res: Response): Promise<void> {
  try {
    const validatedQuery = (req as Request & { validatedQuery?: EmployeeQuery }).validatedQuery ?? req.query
    const result = await listEmployees(validatedQuery as EmployeeQuery)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
}

// --- GET /api/employees/:id ------------------------------------------------

export async function getEmployeeById(req: Request, res: Response): Promise<void> {
  try {
    const employee = await getEmployee(req.params.id as string)
    res.json({ success: true, data: employee })
  } catch (err) {
    const status = (err as Error).message === 'Employee not found' ? 404 : 500
    res.status(status).json({ success: false, error: (err as Error).message })
  }
}

// --- POST /api/employees ---------------------------------------------------
// req.body has already been validated AND transformed (DD/MM/YYYY strings ->
// Date objects, salary strings -> numbers) by the validate(createEmployeeSchema)
// middleware in employee.routes.ts before this handler ever runs. Don't
// re-parse it here -- that middleware already returns per-field errors as
// `details` on a 422 if validation fails.

export async function createEmployeeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user
    const employee = await createEmployee(req.body, user.sub)
    res.status(201).json({ success: true, data: employee })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg.includes('already in use') ? 409 : 500
    res.status(status).json({ success: false, error: msg })
  }
}

// --- PUT /api/employees/:id -------------------------------------------------
// Same as above -- req.body already validated/transformed by validate(updateEmployeeSchema).

export async function updateEmployeeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user
    const employee = await updateEmployee(req.params.id as string, req.body, user.sub)
    res.json({ success: true, data: employee })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg === 'Employee not found' ? 404 : 400
    res.status(status).json({ success: false, error: msg })
  }
}

// --- PATCH /api/employees/:id/archive ---------------------------------------

export async function archiveEmployeeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user
    const employee = await archiveEmployee(req.params.id as string, user.sub)
    res.json({ success: true, data: employee })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg === 'Employee not found' ? 404 : 400
    res.status(status).json({ success: false, error: msg })
  }
}

// --- PATCH /api/employees/:id/restore ---------------------------------------

export async function restoreEmployeeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user
    const employee = await restoreEmployee(req.params.id as string, user.sub)
    res.json({ success: true, data: employee })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg === 'Employee not found' ? 404 : 400
    res.status(status).json({ success: false, error: msg })
  }
}

// --- DELETE /api/employees/:id -----------------------------------------------

export async function deleteEmployeeHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user
    await deleteEmployee(req.params.id as string, user.sub)
    res.json({ success: true, message: 'Employee record permanently deleted.' })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg === 'Employee not found' ? 404 : 500
    res.status(status).json({ success: false, error: msg })
  }
}

// --- GET /api/employees/:id/audit ---------------------------------------------

export async function getEmployeeAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const employee = await getEmployee(req.params.id as string)
    res.json({ success: true, data: (employee as any).auditLogs ?? [] })
  } catch (err) {
    const status = (err as Error).message === 'Employee not found' ? 404 : 500
    res.status(status).json({ success: false, error: (err as Error).message })
  }
}