'use client'

import { useFirstLoginCheck } from '@/hooks/useFirstLoginCheck'
import { PasswordChangeModal } from '@/components/auth/password-change-modal'
import { useState } from 'react'

interface FirstLoginWrapperProps {
  children: React.ReactNode
}

export function FirstLoginWrapper({ children }: FirstLoginWrapperProps) {
  const { isFirstLogin, loading, error } = useFirstLoginCheck()
  const [showPasswordModal, setShowPasswordModal] = useState(true)

  if (loading) {
    // Return children immediately while checking - don't block the UI
    return <>{children}</>
  }

  if (error) {
    console.error('First login check error:', error)
    // On error, just show children without modal
    return <>{children}</>
  }

  return (
    <>
      {children}
      
      <PasswordChangeModal
        isOpen={isFirstLogin && showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChanged={() => {
          setShowPasswordModal(false)
          // Optionally refresh the page or show success message
          window.location.reload()
        }}
        allowSkip={true}
      />
    </>
  )
}