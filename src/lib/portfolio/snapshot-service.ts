import { 
  SnapshotConfiguration, 
  PortfolioPerformanceSnapshot, 
  DbSnapshotConfiguration,
  DbPortfolioPerformanceSnapshot,
  CreateSnapshotConfigRequest,
  UpdateSnapshotConfigRequest,
  CreateSnapshotRequest,
  PortfolioNeedingSnapshot,
  GetSnapshotsResponse,
  GetHistoricalPerformanceResponse,
  SnapshotExecutionResult
} from '@/types/snapshots'
import { createClient } from '@/lib/supabase/server'

/**
 * Service for managing portfolio performance snapshots
 */
export class SnapshotService {
  /**
   * Transform database snapshot configuration to client format
   */
  private transformSnapshotConfig(dbConfig: DbSnapshotConfiguration): SnapshotConfiguration {
    return {
      id: dbConfig.id,
      portfolioId: dbConfig.portfolio_id,
      intervalHours: dbConfig.interval_hours,
      enabled: dbConfig.enabled,
      lastRunAt: dbConfig.last_run_at,
      createdAt: dbConfig.created_at,
      updatedAt: dbConfig.updated_at
    }
  }

  /**
   * Transform database snapshot to client format
   */
  private transformSnapshot(dbSnapshot: DbPortfolioPerformanceSnapshot): PortfolioPerformanceSnapshot {
    return {
      id: dbSnapshot.id,
      portfolioId: dbSnapshot.portfolio_id,
      calculatedAt: dbSnapshot.calculated_at,
      weightedReturnPercentage: Number(dbSnapshot.weighted_return_percentage),
      totalChange24h: dbSnapshot.total_change_24h ? Number(dbSnapshot.total_change_24h) : undefined,
      assetCount: dbSnapshot.asset_count,
      topPerformerSymbol: dbSnapshot.top_performer_symbol,
      topPerformerChange: dbSnapshot.top_performer_change ? Number(dbSnapshot.top_performer_change) : undefined,
      worstPerformerSymbol: dbSnapshot.worst_performer_symbol,
      worstPerformerChange: dbSnapshot.worst_performer_change ? Number(dbSnapshot.worst_performer_change) : undefined,
      snapshotData: dbSnapshot.snapshot_data,
      createdAt: dbSnapshot.created_at
    }
  }

  /**
   * Get all snapshot configurations
   */
  async getSnapshotConfigurations(): Promise<SnapshotConfiguration[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('snapshot_configurations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get snapshot configurations: ${error.message}`)
    }
    
    return (data || []).map(this.transformSnapshotConfig)
  }

  /**
   * Get snapshot configuration for a specific portfolio
   */
  async getPortfolioSnapshotConfig(portfolioId: string): Promise<SnapshotConfiguration[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('snapshot_configurations')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('interval_hours')
    
    if (error) {
      throw new Error(`Failed to get portfolio snapshot configurations: ${error.message}`)
    }
    
    return (data || []).map(this.transformSnapshotConfig)
  }

  /**
   * Create a new snapshot configuration
   */
  async createSnapshotConfiguration(config: CreateSnapshotConfigRequest): Promise<SnapshotConfiguration> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('snapshot_configurations')
      .insert({
        portfolio_id: config.portfolioId,
        interval_hours: config.intervalHours,
        enabled: config.enabled ?? true
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create snapshot configuration: ${error.message}`)
    }
    
    return this.transformSnapshotConfig(data)
  }

  /**
   * Update an existing snapshot configuration
   */
  async updateSnapshotConfiguration(
    configId: string, 
    updates: UpdateSnapshotConfigRequest
  ): Promise<SnapshotConfiguration> {
    const supabase = await createClient()
    
    const updateData: Partial<DbSnapshotConfiguration> = {}
    
    if (updates.intervalHours !== undefined) {
      updateData.interval_hours = updates.intervalHours
    }
    if (updates.enabled !== undefined) {
      updateData.enabled = updates.enabled
    }
    
    const { data, error } = await supabase
      .from('snapshot_configurations')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update snapshot configuration: ${error.message}`)
    }
    
    return this.transformSnapshotConfig(data)
  }

  /**
   * Delete a snapshot configuration
   */
  async deleteSnapshotConfiguration(configId: string): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('snapshot_configurations')
      .delete()
      .eq('id', configId)
    
    if (error) {
      throw new Error(`Failed to delete snapshot configuration: ${error.message}`)
    }
  }

  /**
   * Get portfolios that need snapshots
   */
  async getPortfoliosNeedingSnapshots(): Promise<PortfolioNeedingSnapshot[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .rpc('get_portfolios_needing_snapshots')
    
    if (error) {
      throw new Error(`Failed to get portfolios needing snapshots: ${error.message}`)
    }
    
    interface DbPortfolioNeedingSnapshot {
      portfolio_id: string
      portfolio_name: string
      interval_hours: number
      last_run_at: string | null
      next_run_due: string | null
    }
    
    return (data || []).map((row: DbPortfolioNeedingSnapshot) => ({
      portfolioId: row.portfolio_id,
      portfolioName: row.portfolio_name,
      intervalHours: row.interval_hours,
      lastRunAt: row.last_run_at,
      nextRunDue: row.next_run_due
    }))
  }

  /**
   * Get snapshots for a portfolio
   */
  async getPortfolioSnapshots(
    portfolioId: string, 
    limit = 50, 
    offset = 0
  ): Promise<GetSnapshotsResponse> {
    const supabase = await createClient()
    
    const { data, error, count } = await supabase
      .from('portfolio_performance_snapshots')
      .select('*', { count: 'exact' })
      .eq('portfolio_id', portfolioId)
      .order('calculated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      throw new Error(`Failed to get portfolio snapshots: ${error.message}`)
    }
    
    return {
      snapshots: (data || []).map(this.transformSnapshot),
      totalCount: count || 0
    }
  }

  /**
   * Get historical performance for a portfolio within a date range
   */
  async getHistoricalPerformance(
    portfolioId: string,
    fromDate: string,
    toDate: string
  ): Promise<GetHistoricalPerformanceResponse> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('portfolio_performance_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .gte('calculated_at', fromDate)
      .lte('calculated_at', toDate)
      .order('calculated_at', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to get historical performance: ${error.message}`)
    }
    
    return {
      snapshots: (data || []).map(this.transformSnapshot),
      portfolioId,
      dateRange: {
        from: fromDate,
        to: toDate
      }
    }
  }

  /**
   * Create a snapshot manually (calls Edge Function)
   */
  async createSnapshot(request: CreateSnapshotRequest): Promise<SnapshotExecutionResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }
    
    const functionUrl = `${supabaseUrl}/functions/v1/portfolio-snapshot`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        portfolioId: request.portfolioId,
        forceRecalculation: request.forceRecalculation || false
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create snapshot: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`Snapshot creation failed: ${result.error || 'Unknown error'}`)
    }
    
    return result
  }

  /**
   * Create snapshots for all portfolios with holdings (calls universal Edge Function)
   */
  async createAllSnapshots(): Promise<SnapshotExecutionResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }
    
    const functionUrl = `${supabaseUrl}/functions/v1/create-all-snapshots`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({})
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create snapshots: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.success && result.snapshotsCreated === 0) {
      throw new Error(`Snapshot creation failed: ${result.error || 'Unknown error'}`)
    }
    
    return result
  }

  /**
   * Get the latest snapshot for a portfolio
   */
  async getLatestSnapshot(portfolioId: string): Promise<PortfolioPerformanceSnapshot | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('portfolio_performance_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null
      }
      throw new Error(`Failed to get latest snapshot: ${error.message}`)
    }
    
    return this.transformSnapshot(data)
  }

  /**
   * Delete old snapshots (cleanup utility)
   */
  async deleteOldSnapshots(portfolioId: string, keepDays = 90): Promise<number> {
    const supabase = await createClient()
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - keepDays)
    
    const { data, error } = await supabase
      .from('portfolio_performance_snapshots')
      .delete()
      .eq('portfolio_id', portfolioId)
      .lt('calculated_at', cutoffDate.toISOString())
      .select('id')
    
    if (error) {
      throw new Error(`Failed to delete old snapshots: ${error.message}`)
    }
    
    return data?.length || 0
  }
}

// Export singleton instance
export const snapshotService = new SnapshotService()