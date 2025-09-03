import { NextResponse } from 'next/server'
import { serverCryptoService } from '@/lib/coinmarketcap/server-services'

export async function GET() {
  try {
    const globalMetrics = await serverCryptoService.getGlobalMetrics()

    return NextResponse.json({
      success: true,
      data: globalMetrics
    })
  } catch (error) {
    console.error('Error in /api/crypto/global:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch global metrics' 
      },
      { status: 500 }
    )
  }
}