import { NextRequest, NextResponse } from 'next/server'
import { createServerRoleService } from '@/lib/roles/service'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/users - Get all users with roles
export async function GET() {
  console.log('🔍 [API] GET /api/admin/users - Starting request')
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ [API] Auth check failed:', { authError: authError?.message, hasUser: !!user })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ [API] User authenticated:', { userId: user.id, email: user.email })

    // Create server role service within request context
    const serverRoleService = createServerRoleService()

    // Check if user is admin
    console.log('🔍 [API] Checking if user is admin...')
    const isAdmin = await serverRoleService.isAdmin(user.id)
    console.log('🔍 [API] Admin check result:', { isAdmin, userId: user.id })
    
    if (!isAdmin) {
      console.log('❌ [API] User is not admin, denying access')
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get all users with roles
    console.log('🔍 [API] Fetching all users with roles...')
    const users = await serverRoleService.getAllUsersWithRoles()
    console.log('✅ [API] Users fetched successfully:', { userCount: users.length })
    
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
  console.log('🔍 [API] POST /api/admin/users - Starting role assignment request')
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ [API] POST Auth check failed:', { authError: authError?.message, hasUser: !!user })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ [API] POST User authenticated:', { userId: user.id, email: user.email })

    // Create server role service within request context
    const serverRoleService = createServerRoleService()

    // Check if user is admin
    console.log('🔍 [API] POST Checking if user is admin...')
    const isAdmin = await serverRoleService.isAdmin(user.id)
    console.log('🔍 [API] POST Admin check result:', { isAdmin, userId: user.id })
    
    if (!isAdmin) {
      console.log('❌ [API] POST User is not admin, denying access')
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { userId, role } = await request.json()
    console.log('🔍 [API] POST Role assignment request:', { userId, role, requestedBy: user.id })

    if (!userId || !role) {
      console.log('❌ [API] POST Missing required fields:', { userId: !!userId, role: !!role })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['basic', 'admin'].includes(role)) {
      console.log('❌ [API] POST Invalid role:', { role })
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Assign role
    console.log('🔍 [API] POST Attempting role assignment...')
    const result = await serverRoleService.assignRole({
      userId,
      role,
      assignedBy: user.id
    })

    console.log('🔍 [API] POST Role assignment result:', { success: result.success, error: result.error })

    if (!result.success) {
      console.log('❌ [API] POST Role assignment failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to assign role' },
        { status: 500 }
      )
    }

    console.log('✅ [API] POST Role assigned successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}