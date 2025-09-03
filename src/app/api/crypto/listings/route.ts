import { NextRequest, NextResponse } from 'next/server'
import { serverCryptoService } from '@/lib/coinmarketcap/server-services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 200' },
        { status: 400 }
      )
    }

    const cryptocurrencies = await serverCryptoService.getTopCryptocurrencies(limit)

    return NextResponse.json({
      success: true,
      data: cryptocurrencies,
      count: cryptocurrencies.length
    })
  } catch (error) {
    console.error('Error in /api/crypto/listings:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch cryptocurrency listings' 
      },
      { status: 500 }
    )
  }
}