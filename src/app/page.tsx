import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/utils'
import { logout } from '@/lib/auth/actions'
import { NavMenu } from '@/components/navigation/nav-menu'
import { PortfolioDashboard } from '@/components/dashboard/portfolio-dashboard'

export default async function HomePage() {
  await getUser()

  return (
    <div className="min-h-screen bg-eqtech-dark flex">
      <NavMenu />
      
      <main className="flex-1">
        <div className="flex justify-end p-4 border-b border-eqtech-gray-medium">
          <form action={logout}>
            <Button variant="outline" className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat">
              Logout
            </Button>
          </form>
        </div>
        
        <PortfolioDashboard />
      </main>
    </div>
  )
}
