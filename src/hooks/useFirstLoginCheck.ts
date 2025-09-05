'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface FirstLoginState {
  isFirstLogin: boolean
  loading: boolean
  error: string | null
}

export function useFirstLoginCheck() {
  const [state, setState] = useState<FirstLoginState>({
    isFirstLogin: false,
    loading: true,
    error: null
  })

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function checkFirstLogin() {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          throw userError
        }

        if (!user) {
          if (mounted) {
            setState({
              isFirstLogin: false,
              loading: false,
              error: null
            })
          }
          return
        }

        // Check if user needs first login prompt
        const { data: needsPrompt, error: checkError } = await supabase.rpc(
          'needs_first_login_prompt',
          { user_uuid: user.id }
        )

        if (checkError) {
          throw checkError
        }

        if (mounted) {
          setState({
            isFirstLogin: needsPrompt || false,
            loading: false,
            error: null
          })
        }

      } catch (error: unknown) {
        console.error('Error checking first login status:', error)
        if (mounted) {
          setState({
            isFirstLogin: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to check first login status'
          })
        }
      }
    }

    checkFirstLogin()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Recheck when user signs in
        checkFirstLogin()
      } else if (event === 'SIGNED_OUT') {
        // Reset state when user signs out
        if (mounted) {
          setState({
            isFirstLogin: false,
            loading: false,
            error: null
          })
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return state
}

// Hook specifically for refreshing first login status after password change
export function useRefreshFirstLogin() {
  const supabase = createClient()

  return async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data: needsPrompt, error } = await supabase.rpc(
        'needs_first_login_prompt',
        { user_uuid: user.id }
      )

      if (error) {
        console.error('Error refreshing first login status:', error)
        return false
      }

      return needsPrompt || false

    } catch (error) {
      console.error('Error refreshing first login status:', error)
      return false
    }
  }
}

// Hook for manually marking first login as complete
export function useCompleteFirstLogin() {
  const supabase = createClient()

  return async (userId?: string) => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

      if (!targetUserId) {
        throw new Error('No user ID available')
      }

      const { error } = await supabase.rpc('complete_first_login', {
        user_uuid: targetUserId
      })

      if (error) {
        throw error
      }

      return { success: true, error: null }

    } catch (error: unknown) {
      console.error('Error completing first login:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete first login' 
      }
    }
  }
}