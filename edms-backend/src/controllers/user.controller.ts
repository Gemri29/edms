import { Request, Response } from 'express'
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
} from '../services/user.service'
import { AuthenticatedRequest } from '../types'

// ─── GET /api/users ───────────────────────────────────────────────────────────

export async function getUsersHandler(req: Request, res: Response): Promise<void> {
  try {
    const users = await listUsers()
    res.json({ success: true, data: users })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
}

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

export async function getUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = await getUser(typeof req.params.id === 'string' ? req.params.id : '')
    res.json({ success: true, data: user })
  } catch (err) {
    const status = (err as Error).message === 'User not found' ? 404 : 500
    res.status(status).json({ success: false, error: (err as Error).message })
  }
}

// ─── POST /api/users ──────────────────────────────────────────────────────────

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const caller = (req as AuthenticatedRequest).user
    const user = await createUser(req.body, caller.sub)
    res.status(201).json({ success: true, data: user })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg.includes('already exists') ? 409 : 500
    res.status(status).json({ success: false, error: msg })
  }
}

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const caller = (req as AuthenticatedRequest).user
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const user = await updateUser(userId, req.body, caller.sub)
    res.json({ success: true, data: user })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg === 'User not found' ? 404 : 400
    res.status(status).json({ success: false, error: msg })
  }
}

// ─── PATCH /api/users/:id/deactivate ─────────────────────────────────────────

export async function deactivateUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const caller = (req as AuthenticatedRequest).user
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const user = await deactivateUser(userId, caller.sub)
    res.json({ success: true, data: user })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg === 'User not found' ? 404 : 400
    res.status(status).json({ success: false, error: msg })
  }
}
