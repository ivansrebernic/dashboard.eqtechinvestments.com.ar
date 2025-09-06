import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/utils'
import { snapshotService } from '@/lib/portfolio/snapshot-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/portfolios/[id]/snapshots - Get snapshots for a portfolio
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    await getUser()
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const response = await snapshotService.getPortfolioSnapshots(id, limit, offset)

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error getting portfolio snapshots:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}