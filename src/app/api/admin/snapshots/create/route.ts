import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/utils'
import { createServerRoleService } from '@/lib/roles/service'
import { snapshotService } from '@/lib/portfolio/snapshot-service'
import { CreateSnapshotRequest } from '@/types/snapshots'

/**
 * POST /api/admin/snapshots/create - Create snapshots manually
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const roleService = createServerRoleService()
    const userIsAdmin = await roleService.isAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json() as CreateSnapshotRequest & { createAll?: boolean }

    let result
    
    if (body.createAll) {
      // Create snapshots for all portfolios that need them
      result = await snapshotService.createAllSnapshots()
    } else if (body.portfolioId) {
      // Create snapshot for specific portfolio
      result = await snapshotService.createSnapshot(body)
    } else {
      return NextResponse.json(
        { success: false, error: 'Either portfolioId or createAll=true is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error creating snapshots:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/snapshots/create - Get portfolios that need snapshots
 */
export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const roleService = createServerRoleService()
    const userIsAdmin = await roleService.isAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const portfolios = await snapshotService.getPortfoliosNeedingSnapshots()

    return NextResponse.json({
      success: true,
      data: portfolios
    })
  } catch (error) {
    console.error('Error getting portfolios needing snapshots:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}