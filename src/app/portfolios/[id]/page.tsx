import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/utils'
import { logout } from '@/lib/auth/actions'
import { NavMenu } from '@/components/navigation/nav-menu'
import { PortfolioDetailView } from '@/components/portfolio/portfolio-detail-view'
import { FirstLoginWrapper } from '@/components/auth/first-login-wrapper'
import { ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  await getUser()
  const { id } = await params

  return (
    <FirstLoginWrapper>
      <div className="min-h-screen bg-gradient-to-br from-eqtech-dark via-eqtech-darker to-eqtech-dark md:flex relative">
        {/* Premium background effects */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--eqtech-gold)_0%,_transparent_50%)] opacity-[0.03] pointer-events-none"></div>
        <div className="fixed inset-0 bg-[conic-gradient(from_45deg_at_80%_20%,_transparent_0deg,_var(--eqtech-gold)_90deg,_transparent_180deg)] opacity-[0.02] pointer-events-none"></div>
        
        <NavMenu />
        
        <main className="flex-1 relative min-w-0 overflow-auto">
          {/* Premium Header Bar */}
          <div className="flex justify-between items-center p-6 border-b border-eqtech-gold/10 backdrop-blur-xl bg-eqtech-surface/20">
            <Link
              href="/"
              className="flex items-center space-x-3 text-eqtech-gold-light hover:text-eqtech-gold transition-colors duration-300 group"
            >
              <div className="p-2 bg-eqtech-surface/60 rounded-xl border border-eqtech-gold/20 group-hover:bg-eqtech-gold/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium">Back to Overview</span>
            </Link>
            
            <div className="flex items-center space-x-4">            
              {/* Logout button with premium styling */}
              <form action={logout}>
                <Button 
                  variant="outline" 
                  className="group bg-eqtech-surface/80 backdrop-blur-sm border-eqtech-gold/30 text-eqtech-light hover:bg-gradient-to-r hover:from-eqtech-gold/20 hover:to-eqtech-gold-light/15 hover:border-eqtech-gold/50 hover:text-eqtech-gold-light font-montserrat transition-all duration-300 px-6 py-3 rounded-xl shadow-lg hover:shadow-eqtech-gold/10"
                >
                  <div className="flex items-center space-x-2">
                    <span>Logout</span>
                    <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Button>
              </form>
            </div>
          </div>
          
          <PortfolioDetailView portfolioId={id} />
        </main>
      </div>
    </FirstLoginWrapper>
  )
}