'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RoleErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

function RoleErrorFallback({ error, resetErrorBoundary }: RoleErrorFallbackProps) {
  const router = useRouter()

  const handleGoHome = () => {
    router.push('/')
  }

  const isPermissionError = error.message.includes('permission') || 
                           error.message.includes('unauthorized') ||
                           error.message.includes('access')

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl font-bold">
            {isPermissionError ? 'Access Error' : 'Role System Error'}
          </CardTitle>
          <CardDescription>
            {isPermissionError 
              ? 'There was a problem with your permissions.'
              : 'Something went wrong with the role system.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono text-muted-foreground break-words">
              {error.message}
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={resetErrorBoundary} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            If this persists, please contact an administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface RoleErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface RoleErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<RoleErrorFallbackProps>
}

export class RoleErrorBoundary extends React.Component<RoleErrorBoundaryProps, RoleErrorBoundaryState> {
  constructor(props: RoleErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): RoleErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Role system error:', error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || RoleErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

// Higher-order component version
export function withRoleErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<RoleErrorFallbackProps>
) {
  return function ComponentWithErrorBoundary(props: P) {
    return (
      <RoleErrorBoundary fallback={fallback}>
        <Component {...props} />
      </RoleErrorBoundary>
    )
  }
}