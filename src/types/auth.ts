export type UserRole = 'basic' | 'admin'

export interface UserRoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
  updated_at: string
  created_by?: string
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    username?: string
    [key: string]: unknown
  }
  role?: UserRole
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RoleAssignment {
  userId: string
  role: UserRole
  assignedBy?: string
}

export interface UserWithRole extends User {
  role: UserRole
  roleData?: UserRoleData
}