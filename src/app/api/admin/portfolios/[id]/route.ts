import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbPortfolioService } from '@/lib/portfolio/db-service'
import { CreatePortfolioData } from '@/types/portfolio'

/**
 * GET /api/admin/portfolios/[id] - Get portfolio by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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


    // Validate ID format (basic UUID check)
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    // Get portfolio (RLS policy will handle admin check)
    const portfolio = await dbPortfolioService.getPortfolioById(id)

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: portfolio
    })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio' 
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/portfolios/[id] - Update portfolio
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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


    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description }: Partial<CreatePortfolioData> = body

    // Validate input
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Portfolio name cannot be empty' },
          { status: 400 }
        )
      }
    }

    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description must be a string' },
        { status: 400 }
      )
    }

    // Update portfolio (RLS policy will handle admin check)
    const portfolio = await dbPortfolioService.updatePortfolio(id, {
      name: name?.trim(),
      description: description?.trim()
    })

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: portfolio
    })
  } catch (error) {
    console.error('Error updating portfolio:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update portfolio' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/portfolios/[id] - Delete portfolio
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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


    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    // Delete portfolio (RLS policy will handle admin check)
    const success = await dbPortfolioService.deletePortfolio(id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete portfolio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete portfolio' 
      },
      { status: 500 }
    )
  }
}