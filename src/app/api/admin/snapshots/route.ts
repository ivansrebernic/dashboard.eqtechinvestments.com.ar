import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/utils'
import { createServerRoleService } from '@/lib/roles/service'
import { snapshotService } from '@/lib/portfolio/snapshot-service'
import { CreateSnapshotConfigRequest } from '@/types/snapshots'

/**
 * GET /api/admin/snapshots - Get all snapshot configurations
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

    const configurations = await snapshotService.getSnapshotConfigurations()

    return NextResponse.json({
      success: true,
      data: configurations
    })
  } catch (error) {
    console.error('Error getting snapshot configurations:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/snapshots - Create a new snapshot configuration
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

    const body = await request.json() as CreateSnapshotConfigRequest

    // Validate required fields
    if (!body.intervalHours || body.intervalHours <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid interval hours required' },
        { status: 400 }
      )
    }

    const configuration = await snapshotService.createSnapshotConfiguration(body)

    return NextResponse.json({
      success: true,
      data: configuration
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating snapshot configuration:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}