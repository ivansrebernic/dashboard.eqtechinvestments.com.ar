'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { validatePasswordStrength } from '@/lib/auth/password-utils'
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle, SkipForward, Lock } from 'lucide-react'

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onPasswordChanged: () => void
  allowSkip?: boolean
}

export function PasswordChangeModal({ 
  isOpen, 
  onClose, 
  onPasswordChanged,
  allowSkip = true 
}: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  // Calculate password strength
  const passwordStrength = newPassword ? validatePasswordStrength(newPassword) : null

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (passwordStrength && passwordStrength.score < 40) {
      setError('Please choose a stronger password')
      return
    }

    setLoading(true)
    
    try {
      // Update password in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      // Mark password as changed and complete first login
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: dbError } = await supabase.rpc('mark_password_changed', {
          user_uuid: user.id
        })
        
        if (dbError) {
          console.error('Failed to mark password as changed:', dbError)
        }

        const { error: firstLoginError } = await supabase.rpc('complete_first_login', {
          user_uuid: user.id
        })
        
        if (firstLoginError) {
          console.error('Failed to complete first login:', firstLoginError)
        }
      }

      onPasswordChanged()
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    
    try {
      // Just mark first login as complete without changing password
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: firstLoginError } = await supabase.rpc('complete_first_login', {
          user_uuid: user.id
        })
        
        if (firstLoginError) {
          console.error('Failed to complete first login:', firstLoginError)
        }
      }
      
      onClose()
      
    } catch (err: unknown) {
      console.error('Failed to skip password change:', err)
      // Still close the modal even if DB update fails
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-eqtech-surface border-eqtech-gold/20 text-eqtech-light max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-eqtech-light font-montserrat flex items-center gap-2">
            <Shield className="h-5 w-5 text-eqtech-gold" />
            Welcome to EQTech Investments
          </DialogTitle>
          <DialogDescription className="text-eqtech-gray-light font-roboto-flex">
            For your security, we recommend changing your temporary password to something personal and secure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="new-password" className="text-eqtech-light font-roboto-flex">
              New Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="pr-10 bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                disabled={loading}
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-eqtech-gray-light hover:text-eqtech-light"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Password strength indicator */}
            {newPassword && passwordStrength && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-eqtech-gray-light">Password strength:</span>
                  <span className={`font-medium ${
                    passwordStrength.level === 'weak' ? 'text-red-400' :
                    passwordStrength.level === 'fair' ? 'text-orange-400' :
                    passwordStrength.level === 'good' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {passwordStrength.level.replace('-', ' ')}
                  </span>
                </div>
                <Progress 
                  value={passwordStrength.score} 
                  className="h-2 bg-eqtech-gray-dark"
                />
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-eqtech-gray-light space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-eqtech-gray-light rounded-full flex-shrink-0" />
                        {feedback}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="confirm-password" className="text-eqtech-light font-roboto-flex">
              Confirm New Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="pr-10 bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                disabled={loading}
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-eqtech-gray-light hover:text-eqtech-light"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Password match indicator */}
            {confirmPassword && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-red-400" />
                    <span className="text-red-400">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {error && (
            <Alert className="border-red-800/30 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || (passwordStrength?.score || 0) < 40}
              className="flex-1 bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-gold/90 font-montserrat"
            >
              {loading ? (
                'Updating Password...'
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
            
            {allowSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 border-eqtech-gray-medium text-eqtech-gray-light hover:bg-eqtech-gray-dark font-roboto-flex"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip for Now
              </Button>
            )}
          </div>
        </form>

        <Alert className="border-amber-800/30 bg-amber-900/20 mt-4">
          <Shield className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200 text-sm">
            You can change your password anytime from your account settings.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  )
}