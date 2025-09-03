import { NextRequest, NextResponse } from 'next/server'
import { createServerRoleService } from '@/lib/roles/service'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/users - Get all users with roles
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create server role service within request context
    const serverRoleService = createServerRoleService()

    // Check if user is admin
    const isAdmin = await serverRoleService.isAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get all users with roles
    const users = await serverRoleService.getAllUsersWithRoles()
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create or update user role
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create server role service within request context
    const serverRoleService = createServerRoleService()

    // Check if user is admin
    const isAdmin = await serverRoleService.isAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['basic', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Assign role
    const result = await serverRoleService.assignRole({
      userId,
      role,
      assignedBy: user.id
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to assign role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}