import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbPortfolioService } from '@/lib/portfolio/db-service'

/**
 * GET /api/portfolios - Get all portfolios for authenticated users (read-only access)
 * This endpoint allows basic users to view portfolios without admin privileges
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication - users must be logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch portfolios - this will respect RLS policies
    // Basic users can view portfolios but not modify them
    const portfolios = await dbPortfolioService.getAllPortfolios()

    return NextResponse.json({
      success: true,
      data: portfolios
    })
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch portfolios' 
      },
      { status: 500 }
    )
  }
}