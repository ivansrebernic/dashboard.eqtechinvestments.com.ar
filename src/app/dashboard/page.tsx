import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUser } from '@/lib/auth/utils'
import { logout } from '@/lib/auth/actions'
import { GlobalStats } from '@/components/crypto/global-stats'
import { CryptoList } from '@/components/crypto/crypto-list'

export default async function DashboardPage() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Crypto Dashboard</h1>
          <form action={logout}>
            <Button variant="outline">Logout</Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>
                Track cryptocurrency markets and manage your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>User:</strong> {user?.email}</p>
                {user?.user_metadata?.username && (
                  <p><strong>Username:</strong> {user.user_metadata.username}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Access real-time cryptocurrency data and market insights
                </p>
              </div>
            </CardContent>
          </Card>

          <GlobalStats />
        </div>

        <CryptoList initialLimit={12} />
      </div>
    </div>
  )
}