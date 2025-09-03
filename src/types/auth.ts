export interface User {
  id: string
  email: string
  user_metadata?: {
    username?: string
    [key: string]: any
  }
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