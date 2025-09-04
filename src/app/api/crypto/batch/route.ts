import { NextRequest, NextResponse } from 'next/server'
import { serverCryptoService } from '@/lib/coinmarketcap/server-services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.symbols || !Array.isArray(body.symbols)) {
      return NextResponse.json(
        { error: 'symbols array is required in request body' },
        { status: 400 }
      )
    }

    if (body.symbols.length === 0) {
      return NextResponse.json({
        success: true,
        data: {}
      })
    }

    if (body.symbols.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 symbols allowed per batch request' },
        { status: 400 }
      )
    }

    // Validate symbols are strings
    const invalidSymbols = body.symbols.filter((symbol: unknown) => 
      typeof symbol !== 'string' || symbol.trim().length === 0
    )
    
    if (invalidSymbols.length > 0) {
      return NextResponse.json(
        { error: 'All symbols must be non-empty strings' },
        { status: 400 }
      )
    }

    const cryptoMap = await serverCryptoService.getCryptocurrenciesBySymbols(body.symbols)
    
    // Convert Map to Object for JSON response
    const result: Record<string, unknown> = {}
    for (const [symbol, crypto] of cryptoMap.entries()) {
      result[symbol] = crypto
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        requestedCount: body.symbols.length,
        foundCount: Array.from(cryptoMap.values()).filter(crypto => crypto !== null).length,
        cached: true // We'll always return from cache or fresh data seamlessly
      }
    })
  } catch (error) {
    console.error('Error in /api/crypto/batch:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch batch cryptocurrency data' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'POST method required. Send symbols array in request body.' 
    },
    { status: 405 }
  )
}