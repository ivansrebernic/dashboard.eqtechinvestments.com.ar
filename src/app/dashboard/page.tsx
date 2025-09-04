import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/utils'
import { logout } from '@/lib/auth/actions'
import { GlobalStats } from '@/components/crypto/global-stats'
import { CryptoList } from '@/components/crypto/crypto-list'
import { NavMenu } from '@/components/navigation/nav-menu'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-eqtech-dark flex">
      <NavMenu />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-eqtech-light font-montserrat">Crypto Dashboard</h1>
            <form action={logout}>
              <Button variant="outline" className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat">Logout</Button>
            </form>
          </div>

          <DashboardContent user={user} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlobalStats />
          </div>

          <CryptoList initialLimit={12} />
        </div>
      </main>
    </div>
  )
}