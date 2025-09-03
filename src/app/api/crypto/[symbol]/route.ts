import { NextRequest, NextResponse } from 'next/server'
import { serverCryptoService } from '@/lib/coinmarketcap/server-services'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  try {

    if (!symbol || symbol.trim().length < 1) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const cryptocurrency = await serverCryptoService.getCryptocurrencyBySymbol(symbol.trim())

    if (!cryptocurrency) {
      return NextResponse.json(
        { error: `Cryptocurrency with symbol "${symbol}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cryptocurrency
    })
  } catch (error) {
    console.error(`Error in /api/crypto/${symbol}:`, error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch cryptocurrency data' 
      },
      { status: 500 }
    )
  }
}