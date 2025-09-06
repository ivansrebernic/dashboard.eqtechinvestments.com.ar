import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/utils'
import { snapshotService } from '@/lib/portfolio/snapshot-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/portfolios/[id]/performance/historical - Get historical performance data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    await getUser()
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    
    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'Both from and to dates are required (ISO format)' },
        { status: 400 }
      )
    }

    // Validate date formats
    const fromTimestamp = new Date(fromDate)
    const toTimestamp = new Date(toDate)
    
    if (isNaN(fromTimestamp.getTime()) || isNaN(toTimestamp.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' },
        { status: 400 }
      )
    }
    
    if (fromTimestamp >= toTimestamp) {
      return NextResponse.json(
        { success: false, error: 'From date must be earlier than to date' },
        { status: 400 }
      )
    }

    const response = await snapshotService.getHistoricalPerformance(id, fromDate, toDate)

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error getting historical performance:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}