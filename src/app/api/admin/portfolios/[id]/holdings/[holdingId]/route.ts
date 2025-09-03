import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbPortfolioService } from '@/lib/portfolio/db-service'

/**
 * PUT /api/admin/portfolios/[id]/holdings/[holdingId] - Update holding amount
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; holdingId: string }> }
) {
  const { id, holdingId } = await params
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


    // Validate IDs
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    if (!holdingId || typeof holdingId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid holding ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { amount } = body

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Update holding (RLS policy will handle admin check)
    const success = await dbPortfolioService.updateHolding(id, holdingId, amount)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update holding' },
        { status: 500 }
      )
    }

    // Get updated portfolio to return
    const updatedPortfolio = await dbPortfolioService.getPortfolioById(id)

    return NextResponse.json({
      success: true,
      data: updatedPortfolio
    })
  } catch (error) {
    console.error('Error updating holding:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update holding' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/portfolios/[id]/holdings/[holdingId] - Remove holding
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; holdingId: string }> }
) {
  const { id, holdingId } = await params
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


    // Validate IDs
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    if (!holdingId || typeof holdingId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid holding ID' },
        { status: 400 }
      )
    }

    // Remove holding (RLS policy will handle admin check)
    const success = await dbPortfolioService.removeHolding(id, holdingId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove holding' },
        { status: 500 }
      )
    }

    // Get updated portfolio to return
    const updatedPortfolio = await dbPortfolioService.getPortfolioById(id)

    return NextResponse.json({
      success: true,
      data: updatedPortfolio
    })
  } catch (error) {
    console.error('Error removing holding:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove holding' 
      },
      { status: 500 }
    )
  }
}