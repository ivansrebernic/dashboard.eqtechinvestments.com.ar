'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginCredentials } from '@/types/auth'

export async function login(credentials: LoginCredentials) {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.username, // Using username as email for simplicity
      password: credentials.password,
    })

    if (error) {
      return {
        error: 'Invalid username or password'
      }
    }

    // Success - redirect will happen in the component
    return {
      success: true
    }
  } catch {
    return {
      error: 'An error occurred during login'
    }
  }
}

export async function logout() {
  const supabase = createClient()

  try {
    await supabase.auth.signOut()
  } catch {
    // Handle error silently for logout
  }

  redirect('/login')
}