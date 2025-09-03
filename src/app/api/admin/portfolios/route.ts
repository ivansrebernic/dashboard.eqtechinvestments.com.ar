import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbPortfolioService } from '@/lib/portfolio/db-service'
import { CreatePortfolioData } from '@/types/portfolio'

/**
 * GET /api/admin/portfolios - Get all portfolios
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin permissions using existing RLS policies
    // The RLS policy will handle admin check via is_admin() function
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

/**
 * POST /api/admin/portfolios - Create new portfolio
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description }: CreatePortfolioData = body

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      )
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description must be a string' },
        { status: 400 }
      )
    }

    // Create portfolio (RLS policy will handle admin check)
    const portfolio = await dbPortfolioService.createPortfolio(
      { name: name.trim(), description: description?.trim() },
      user.id
    )

    return NextResponse.json({
      success: true,
      data: portfolio
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating portfolio:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create portfolio' 
      },
      { status: 500 }
    )
  }
}