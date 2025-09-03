import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUser } from '@/lib/auth/utils'
import { logout } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <form action={logout}>
            <Button variant="outline">Logout</Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You are successfully authenticated and can access protected content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              {user?.user_metadata?.username && (
                <p><strong>Username:</strong> {user.user_metadata.username}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protected Content</CardTitle>
            <CardDescription>
              This page is only accessible to authenticated users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This is your protected dashboard. Only authenticated users can see this content.
              The middleware automatically redirects unauthenticated users to the login page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}