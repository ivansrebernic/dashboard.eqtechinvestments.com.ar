import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbPortfolioService } from '@/lib/portfolio/db-service'
import { AddHoldingData } from '@/types/portfolio'

/**
 * POST /api/admin/portfolios/[id]/holdings - Add holding to portfolio
 */
export async function POST(
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

    // Validate portfolio ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid portfolio ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { symbol, amount }: AddHoldingData = body

    // Validate input
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      )
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Add holding (RLS policy will handle admin check)
    const success = await dbPortfolioService.addHolding(id, {
      symbol: symbol.trim().toUpperCase(),
      amount
    })

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to add holding' },
        { status: 500 }
      )
    }

    // Get updated portfolio to return
    const updatedPortfolio = await dbPortfolioService.getPortfolioById(id)

    return NextResponse.json({
      success: true,
      data: updatedPortfolio
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding holding:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add holding' 
      },
      { status: 500 }
    )
  }
}