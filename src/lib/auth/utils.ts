import { createClient } from '@/lib/supabase/server'
import { User } from '@/types/auth'

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata
    }
  } catch {
    return null
  }
}

export async function getSession() {
  const supabase = await createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return error ? null : session
  } catch {
    return null
  }
}