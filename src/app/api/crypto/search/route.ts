import { NextRequest, NextResponse } from 'next/server'
import { serverCryptoService } from '@/lib/coinmarketcap/server-services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required and must not be empty' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      )
    }

    const results = await serverCryptoService.searchCryptocurrencies(query.trim(), limit)

    return NextResponse.json({
      success: true,
      data: results,
      query: query.trim(),
      count: results.length
    })
  } catch (error) {
    console.error('Error in /api/crypto/search:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search cryptocurrencies' 
      },
      { status: 500 }
    )
  }
}