'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Copy, Eye, EyeOff, CheckCircle, AlertCircle, Mail, UserPlus } from 'lucide-react'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

interface CreatedUserResult {
  success: boolean
  user: {
    id: string
    email: string
  }
  tempPassword?: string
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          email: email.trim(),
          sendEmail
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setCreatedUser(data)
      setEmail('')
      
      // Auto-show password if not sending email
      if (!sendEmail && data.tempPassword) {
        setShowPassword(true)
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPassword = async () => {
    if (createdUser?.tempPassword) {
      await navigator.clipboard.writeText(createdUser.tempPassword)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setEmail('')
    setSendEmail(false)
    setError('')
    setCreatedUser(null)
    setShowPassword(false)
    setPasswordCopied(false)
    onClose()
    
    if (createdUser) {
      onUserCreated()
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-eqtech-surface border-eqtech-gold/20 text-eqtech-light max-w-md">
        <DialogHeader>
          <DialogTitle className="text-eqtech-light font-montserrat flex items-center gap-2">
            {createdUser ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-400" />
                User Created Successfully
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-eqtech-gold" />
                Create New User
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-eqtech-gray-light font-roboto-flex">
            {createdUser ? (
              'User account has been created. Share the login credentials below.'
            ) : (
              'Create a new user account with an auto-generated secure password.'
            )}
          </DialogDescription>
        </DialogHeader>

        {createdUser ? (
          // Success state - show credentials
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Account Created</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-eqtech-gray-light">Email</Label>
                  <div className="mt-1 p-2 bg-eqtech-dark rounded border font-mono text-sm">
                    {createdUser.user.email}
                  </div>
                </div>

                {createdUser.tempPassword && (
                  <div>
                    <Label className="text-xs text-eqtech-gray-light">Temporary Password</Label>
                    <div className="mt-1 flex gap-2">
                      <div className="flex-1 p-2 bg-eqtech-dark rounded border font-mono text-sm">
                        {showPassword ? createdUser.tempPassword : '••••••••••••••'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-dark"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPassword}
                        className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-dark"
                      >
                        {passwordCopied ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {createdUser.tempPassword && (
              <Alert className="border-amber-800/30 bg-amber-900/20">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200 text-sm">
                  The user will be prompted to change this password on their first login.
                  Make sure to share these credentials securely.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          // Creation form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-eqtech-light font-roboto-flex">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1 bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                disabled={loading}
                className="border-eqtech-gray-medium data-[state=checked]:bg-eqtech-gold data-[state=checked]:border-eqtech-gold"
              />
              <Label 
                htmlFor="send-email" 
                className="text-sm text-eqtech-gray-light font-roboto-flex flex items-center gap-2 cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                Send credentials via email (Coming soon)
              </Label>
            </div>

            {error && (
              <Alert className="border-red-800/30 bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-dark"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !email || !isValidEmail(email)}
                className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-gold/90 font-montserrat"
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {createdUser && (
          <DialogFooter>
            <Button
              onClick={handleClose}
              className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-gold/90 font-montserrat"
            >
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}