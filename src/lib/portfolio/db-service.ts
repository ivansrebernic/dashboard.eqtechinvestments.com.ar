import { createClient } from '@/lib/supabase/server'
import { 
  Portfolio, 
  PortfolioHolding, 
  CreatePortfolioData, 
  AddHoldingData,
  DbPortfolio,
  DbPortfolioHolding
} from '@/types/portfolio'

export class DatabasePortfolioService {
  /**
   * Transform database portfolio to UI format
   */
  private transformPortfolio(dbPortfolio: DbPortfolio, holdings: DbPortfolioHolding[] = []): Portfolio {
    return {
      id: dbPortfolio.id,
      name: dbPortfolio.name,
      description: dbPortfolio.description,
      createdAt: dbPortfolio.created_at,
      updatedAt: dbPortfolio.updated_at,
      createdBy: dbPortfolio.created_by,
      holdings: holdings.map(this.transformHolding)
    }
  }

  /**
   * Transform database holding to UI format
   */
  private transformHolding(dbHolding: DbPortfolioHolding): PortfolioHolding {
    return {
      id: dbHolding.id,
      symbol: dbHolding.symbol,
      amount: Number(dbHolding.amount),
      addedAt: dbHolding.created_at,
      updatedAt: dbHolding.updated_at
    }
  }

  /**
   * Get all portfolios with their holdings
   */
  async getAllPortfolios(): Promise<Portfolio[]> {
    const supabase = await createClient()

    const { data: portfoliosData, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false })

    if (portfoliosError) {
      throw new Error(`Failed to fetch portfolios: ${portfoliosError.message}`)
    }

    if (!portfoliosData || portfoliosData.length === 0) {
      return []
    }

    // Get holdings for all portfolios
    const portfolioIds = portfoliosData.map(p => p.id)
    const { data: holdingsData, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .in('portfolio_id', portfolioIds)
      .order('created_at', { ascending: true })

    if (holdingsError) {
      throw new Error(`Failed to fetch holdings: ${holdingsError.message}`)
    }

    // Group holdings by portfolio_id
    const holdingsMap = new Map<string, DbPortfolioHolding[]>()
    holdingsData?.forEach(holding => {
      if (!holdingsMap.has(holding.portfolio_id)) {
        holdingsMap.set(holding.portfolio_id, [])
      }
      holdingsMap.get(holding.portfolio_id)!.push(holding)
    })

    return portfoliosData.map(portfolio => 
      this.transformPortfolio(portfolio, holdingsMap.get(portfolio.id) || [])
    )
  }

  /**
   * Get portfolio by ID with holdings
   */
  async getPortfolioById(id: string): Promise<Portfolio | null> {
    const supabase = await createClient()

    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .single()

    if (portfolioError) {
      if (portfolioError.code === 'PGRST116') {
        return null // Portfolio not found
      }
      throw new Error(`Failed to fetch portfolio: ${portfolioError.message}`)
    }

    // Get holdings for this portfolio
    const { data: holdingsData, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('portfolio_id', id)
      .order('created_at', { ascending: true })

    if (holdingsError) {
      throw new Error(`Failed to fetch holdings: ${holdingsError.message}`)
    }

    return this.transformPortfolio(portfolioData, holdingsData || [])
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(data: CreatePortfolioData, userId: string): Promise<Portfolio> {
    const supabase = await createClient()

    const { data: portfolioData, error } = await supabase
      .from('portfolios')
      .insert({
        name: data.name,
        description: data.description,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create portfolio: ${error.message}`)
    }

    return this.transformPortfolio(portfolioData, [])
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(id: string, data: Partial<CreatePortfolioData>): Promise<Portfolio | null> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portfolios')
      .update({
        name: data.name,
        description: data.description
      })
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Portfolio not found
      }
      throw new Error(`Failed to update portfolio: ${error.message}`)
    }

    // Get updated portfolio with holdings
    return this.getPortfolioById(id)
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(id: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete portfolio: ${error.message}`)
    }

    return true
  }

  /**
   * Add holding to portfolio
   */
  async addHolding(portfolioId: string, holdingData: AddHoldingData): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portfolio_holdings')
      .insert({
        portfolio_id: portfolioId,
        symbol: holdingData.symbol.toUpperCase(),
        amount: holdingData.amount
      })

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - update existing holding
        return this.updateHoldingBySymbol(portfolioId, holdingData.symbol, holdingData.amount)
      }
      throw new Error(`Failed to add holding: ${error.message}`)
    }

    return true
  }

  /**
   * Update holding amount by symbol
   */
  private async updateHoldingBySymbol(portfolioId: string, symbol: string, amount: number): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portfolio_holdings')
      .update({ amount })
      .eq('portfolio_id', portfolioId)
      .eq('symbol', symbol.toUpperCase())

    if (error) {
      throw new Error(`Failed to update holding: ${error.message}`)
    }

    return true
  }

  /**
   * Update holding amount by ID
   */
  async updateHolding(portfolioId: string, holdingId: string, amount: number): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portfolio_holdings')
      .update({ amount })
      .eq('id', holdingId)
      .eq('portfolio_id', portfolioId)

    if (error) {
      throw new Error(`Failed to update holding: ${error.message}`)
    }

    return true
  }

  /**
   * Remove holding from portfolio
   */
  async removeHolding(portfolioId: string, holdingId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('id', holdingId)
      .eq('portfolio_id', portfolioId)

    if (error) {
      throw new Error(`Failed to remove holding: ${error.message}`)
    }

    return true
  }
}

// Singleton instance for server-side use
export const dbPortfolioService = new DatabasePortfolioService()