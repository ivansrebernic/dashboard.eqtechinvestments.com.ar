import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/utils'
import { logout } from '@/lib/auth/actions'
import { NavMenu } from '@/components/navigation/nav-menu'
import { PortfolioDashboard } from '@/components/dashboard/portfolio-dashboard'
import { LogOut } from 'lucide-react'

export default async function HomePage() {
  await getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-eqtech-dark via-eqtech-darker to-eqtech-dark flex relative overflow-hidden">
      {/* Premium background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--eqtech-gold)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[conic-gradient(from_45deg_at_80%_20%,_transparent_0deg,_var(--eqtech-copper)_90deg,_transparent_180deg)] opacity-[0.02] pointer-events-none"></div>
      
      <NavMenu />
      
      <main className="flex-1 relative">
        {/* Premium Header Bar */}
        <div className="flex justify-end p-6 border-b border-eqtech-gold/10 backdrop-blur-xl bg-eqtech-surface/20">
          <div className="flex items-center space-x-4">
            {/* Live indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-eqtech-surface/60 rounded-xl border border-eqtech-gold/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-eqtech-gray-light font-roboto-flex uppercase tracking-wider">Live</span>
            </div>
            
            {/* Logout button with premium styling */}
            <form action={logout}>
              <Button 
                variant="outline" 
                className="group bg-eqtech-surface/80 backdrop-blur-sm border-eqtech-gold/30 text-eqtech-light hover:bg-gradient-to-r hover:from-eqtech-gold/20 hover:to-eqtech-copper/15 hover:border-eqtech-gold/50 hover:text-eqtech-gold-light font-montserrat transition-all duration-300 px-6 py-3 rounded-xl shadow-lg hover:shadow-eqtech-gold/10"
              >
                <div className="flex items-center space-x-2">
                  <span>Logout</span>
                  <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </Button>
            </form>
          </div>
        </div>
        
        <PortfolioDashboard />
      </main>
    </div>
  )
}
