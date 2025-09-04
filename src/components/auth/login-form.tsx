'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/lib/auth/actions'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login({ username, password })
      
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-eqtech-gray-dark border-eqtech-gray-medium">
      <CardHeader>
        <CardTitle className="text-eqtech-light font-montserrat text-2xl text-center">EQTech Investments</CardTitle>
        <CardDescription className="text-eqtech-gold font-roboto-flex text-center">
          Enter your credentials to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-eqtech-gold font-roboto-flex">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-eqtech-gold font-roboto-flex">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md border border-red-800/30 font-roboto-flex">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}