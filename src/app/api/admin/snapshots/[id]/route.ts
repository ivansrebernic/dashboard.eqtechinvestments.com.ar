import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/utils'
import { createServerRoleService } from '@/lib/roles/service'
import { snapshotService } from '@/lib/portfolio/snapshot-service'
import { UpdateSnapshotConfigRequest } from '@/types/snapshots'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * PUT /api/admin/snapshots/[id] - Update a snapshot configuration
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params
    const body = await request.json() as UpdateSnapshotConfigRequest

    const configuration = await snapshotService.updateSnapshotConfiguration(id, body)

    return NextResponse.json({
      success: true,
      data: configuration
    })
  } catch (error) {
    console.error('Error updating snapshot configuration:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/snapshots/[id] - Delete a snapshot configuration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    await snapshotService.deleteSnapshotConfiguration(id)

    return NextResponse.json({
      success: true,
      message: 'Snapshot configuration deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting snapshot configuration:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}