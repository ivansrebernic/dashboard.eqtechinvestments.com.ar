import { NextRequest, NextResponse } from 'next/server'
import { createServerRoleService } from '@/lib/roles/service'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateFriendlyPassword } from '@/lib/auth/password-utils'

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

// POST /api/admin/users - Create new user or update user role
export async function POST(request: NextRequest) {
  console.log('🔍 [API] POST /api/admin/users - Starting request')
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

    const body = await request.json()
    const { action, email, userId, role, sendEmail = false } = body

    // Handle user creation
    if (action === 'create') {
      console.log('🔍 [API] POST User creation request:', { email, sendEmail, requestedBy: user.id })

      if (!email) {
        console.log('❌ [API] POST Missing email for user creation')
        return NextResponse.json(
          { error: 'Email is required for user creation' },
          { status: 400 }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        console.log('❌ [API] POST Invalid email format:', { email })
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      try {
        // Create Supabase Admin client
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        // Generate secure temporary password
        const tempPassword = generateFriendlyPassword()
        console.log('🔍 [API] POST Generated temporary password for user')

        // Create user with admin API
        console.log('🔍 [API] POST Creating user with Supabase Admin API...')
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            first_login: true,
            created_by_admin: true,
            created_by: user.id
          }
        })

        if (createError) {
          console.log('❌ [API] POST User creation failed:', createError.message)
          if (createError.message.includes('already registered')) {
            return NextResponse.json(
              { error: 'A user with this email already exists' },
              { status: 409 }
            )
          }
          throw createError
        }

        console.log('✅ [API] POST User created successfully:', { userId: newUser.user.id, email })

        // TODO: Implement email sending if sendEmail is true
        // For now, we'll return the password for manual sharing
        
        return NextResponse.json({
          success: true,
          user: {
            id: newUser.user.id,
            email: newUser.user.email
          },
          // Only return password if not sending email
          ...(sendEmail ? {} : { tempPassword })
        })

      } catch (error: unknown) {
        console.error('❌ [API] POST Error creating user:', error)
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to create user' },
          { status: 500 }
        )
      }
    }

    // Handle role assignment (existing functionality)
    if (action === 'assign-role') {
      console.log('🔍 [API] POST Role assignment request:', { userId, role, requestedBy: user.id })

      if (!userId || !role) {
        console.log('❌ [API] POST Missing required fields for role assignment:', { userId: !!userId, role: !!role })
        return NextResponse.json(
          { error: 'Missing required fields for role assignment' },
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
    }

    // If no valid action provided
    console.log('❌ [API] POST Invalid or missing action:', { action })
    return NextResponse.json(
      { error: 'Invalid action. Use "create" or "assign-role"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in admin users POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}