'use client'

import { AdminGuard } from '@/components/auth/route-guard'
import { NavMenu } from '@/components/navigation/nav-menu'
import { Button } from '@/components/ui/button'
import { useUserRole } from '@/lib/roles/hooks'
import { RoleBadge } from '@/components/roles/role-badge'
import { SnapshotManagement } from '@/components/admin/snapshot-management'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminSnapshotsPage() {
  const { role } = useUserRole()

  return (
    <AdminGuard>
      <div className="min-h-screen bg-eqtech-dark flex">
        <NavMenu />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button
                  asChild
                  variant="outline"
                  className="border-eqtech-gold/30 text-eqtech-light hover:bg-eqtech-gold/10"
                >
                  <Link href="/admin">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Admin
                  </Link>
                </Button>
                <div>
                  <h1 className="text-4xl font-bold text-eqtech-light font-montserrat">
                    Snapshot Management
                  </h1>
                  <p className="text-eqtech-gold mt-2 font-roboto-flex text-lg">
                    Configure and manage portfolio performance snapshots
                  </p>
                </div>
              </div>
              {role && <RoleBadge role={role} />}
            </div>

            {/* Snapshot Management Component */}
            <SnapshotManagement />
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}