import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isPublicRoute, getRequiredRole, canAccessRoute } from './src/lib/roles/permissions'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes (except auth)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth'))
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user }, error } = await supabase.auth.getUser()

  // If route is public, allow access
  if (isPublicRoute(pathname)) {
    return response
  }

  // If user is not authenticated, redirect to login
  if (!user || error) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Get required role for this route
  const requiredRole = getRequiredRole(pathname)
  
  // If no specific role required, allow access
  if (!requiredRole) {
    return response
  }

  // Get user's role from database
  try {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError) {
      console.error('Error fetching user role:', roleError)
      // Default to basic role if error fetching
      const userRole = 'basic'
      
      if (!canAccessRoute(userRole, pathname)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      
      return response
    }

    const userRole = roleData?.role || 'basic'

    // Check if user has permission to access this route
    if (!canAccessRoute(userRole, pathname)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Add user role to request headers for use in components
    response.headers.set('x-user-role', userRole)
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to unauthorized page for protected routes
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}