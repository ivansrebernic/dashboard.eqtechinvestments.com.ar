'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, Home, ArrowLeft } from 'lucide-react'
import { useUserRole } from '@/lib/roles/hooks'

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role, loading } = useUserRole()
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    setRedirectTo(searchParams?.get('redirectTo') || null)
  }, [searchParams])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eqtech-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-eqtech-gold"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-eqtech-dark p-4">
      <Card className="w-full max-w-md bg-eqtech-gray-dark border-eqtech-gray-medium">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-eqtech-light font-montserrat">Access Denied</CardTitle>
          <CardDescription className="text-eqtech-gray-light font-roboto-flex">
            You don&apos;t have permission to access this resource.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {redirectTo && (
            <div className="p-3 bg-eqtech-dark rounded-lg border border-eqtech-gray-medium">
              <p className="text-sm text-eqtech-gray-light font-roboto-flex">
                Attempted to access: <code className="bg-eqtech-gray-dark px-1 rounded text-eqtech-gold">{redirectTo}</code>
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm text-eqtech-gray-light font-roboto-flex">
              Your current role: <span className="font-medium capitalize text-eqtech-gold">{role || 'Unknown'}</span>
            </p>
            <p className="text-xs text-eqtech-gray-light font-roboto-flex">
              If you believe this is an error, please contact an administrator.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleGoToDashboard} className="w-full bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          
          <div className="flex space-x-2 w-full">
            <Button onClick={handleGoBack} variant="outline" className="flex-1 border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button onClick={handleGoHome} variant="outline" className="flex-1 border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-eqtech-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-eqtech-gold"></div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}