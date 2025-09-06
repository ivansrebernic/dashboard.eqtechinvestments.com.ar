'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Play,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react'

export function SnapshotManagement() {
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    error?: string
    type?: string
    data?: {
      portfoliosProcessed?: number
      snapshotsCreated?: number
      executionTime?: number
      errors?: string[]
    } | Array<{
      portfolioId: string
      portfolioName: string
      intervalHours: number
    }>
  } | null>(null)

  const createAllSnapshots = async () => {
    setIsCreatingSnapshot(true)
    try {
      const response = await fetch('/api/admin/snapshots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ createAll: true })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data || typeof data.success !== 'boolean') {
        throw new Error('Invalid response format from server')
      }

      setLastResult(data)
      
      if (data.success) {
        console.log('Snapshots created successfully:', data.data)
      } else {
        console.error('Failed to create snapshots:', data.error)
      }
    } catch (error) {
      console.error('Error creating snapshots:', error)
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      })
    } finally {
      setIsCreatingSnapshot(false)
    }
  }

  const checkPortfoliosNeedingSnapshots = async () => {
    try {
      const response = await fetch('/api/admin/snapshots/create')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data || typeof data.success !== 'boolean') {
        throw new Error('Invalid response format from server')
      }
      
      if (data.success) {
        console.log('Portfolios needing snapshots:', data.data)
        setLastResult({
          success: true,
          type: 'check',
          data: data.data
        })
      } else {
        console.error('Failed to check portfolios:', data.error)
        setLastResult(data)
      }
    } catch (error) {
      console.error('Error checking portfolios:', error)
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-eqtech-light mb-2">Portfolio Snapshot Management</h2>
        <p className="text-eqtech-gray-light">
          Create and manage portfolio performance snapshots for historical tracking.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 border-eqtech-gray-medium/20">
          <CardHeader>
            <CardTitle className="text-eqtech-light flex items-center space-x-2">
              <Camera className="w-5 h-5 text-eqtech-gold" />
              <span>Create Snapshots</span>
            </CardTitle>
            <CardDescription className="text-eqtech-gray-light">
              Create performance snapshots for all portfolios that need them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={createAllSnapshots}
              disabled={isCreatingSnapshot}
              className="w-full bg-gradient-to-r from-eqtech-gold to-eqtech-gold-light hover:from-eqtech-gold/90 hover:to-eqtech-gold-light/90 text-eqtech-dark font-semibold"
            >
              {isCreatingSnapshot ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Snapshots...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Create All Snapshots
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 border-eqtech-gray-medium/20">
          <CardHeader>
            <CardTitle className="text-eqtech-light flex items-center space-x-2">
              <Clock className="w-5 h-5 text-eqtech-gold" />
              <span>Check Status</span>
            </CardTitle>
            <CardDescription className="text-eqtech-gray-light">
              Check which portfolios need snapshots based on configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={checkPortfoliosNeedingSnapshots}
              variant="outline"
              className="w-full border-eqtech-gold/30 text-eqtech-light hover:bg-eqtech-gold/10"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Check Portfolios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {lastResult && (
        <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 border-eqtech-gray-medium/20">
          <CardHeader>
            <CardTitle className="text-eqtech-light flex items-center space-x-2">
              {lastResult.success ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span>Last Operation Result</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Badge 
                variant={lastResult.success ? "default" : "destructive"}
                className={lastResult.success ? "bg-green-500/20 text-green-400" : ""}
              >
                {lastResult.success ? 'Success' : 'Failed'}
              </Badge>
              
              {lastResult.success && lastResult.data && (
                <div className="bg-eqtech-surface-elevated/40 rounded-lg p-4 space-y-2">
                  {lastResult.type === 'check' ? (
                    <div>
                      <h4 className="font-medium text-eqtech-light mb-2">Portfolios Needing Snapshots:</h4>
                      {Array.isArray(lastResult.data) && lastResult.data.length === 0 ? (
                        <p className="text-eqtech-gray-light text-sm">No portfolios need snapshots at this time.</p>
                      ) : (
                        <ul className="space-y-1">
                          {Array.isArray(lastResult.data) && lastResult.data.map((portfolio: {
                            portfolioId: string
                            portfolioName: string
                            intervalHours: number
                          }) => (
                            <li key={portfolio.portfolioId} className="text-sm text-eqtech-light">
                              <span className="font-medium">{portfolio.portfolioName}</span>
                              <span className="text-eqtech-gray-light ml-2">
                                (Every {portfolio.intervalHours}h)
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-eqtech-light">Portfolios Processed</div>
                        <div className="text-eqtech-gold">
                          {typeof lastResult.data === 'object' && 'portfoliosProcessed' in lastResult.data 
                            ? lastResult.data.portfoliosProcessed 
                            : 'N/A'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-eqtech-light">Snapshots Created</div>
                        <div className="text-eqtech-gold">
                          {typeof lastResult.data === 'object' && 'snapshotsCreated' in lastResult.data 
                            ? lastResult.data.snapshotsCreated 
                            : 'N/A'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-eqtech-light">Execution Time</div>
                        <div className="text-eqtech-gold">
                          {typeof lastResult.data === 'object' && 'executionTime' in lastResult.data 
                            ? `${lastResult.data.executionTime}ms`
                            : 'N/A'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-eqtech-light">Errors</div>
                        <div className={
                          typeof lastResult.data === 'object' && 'errors' in lastResult.data && Array.isArray(lastResult.data.errors) && lastResult.data.errors.length > 0 
                            ? "text-red-400" 
                            : "text-green-400"
                        }>
                          {typeof lastResult.data === 'object' && 'errors' in lastResult.data && Array.isArray(lastResult.data.errors)
                            ? lastResult.data.errors.length || 0
                            : 0
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {lastResult.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm font-medium">Error:</p>
                  <p className="text-red-300 text-sm">{lastResult.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 border-eqtech-gray-medium/20">
        <CardHeader>
          <CardTitle className="text-eqtech-light flex items-center space-x-2">
            <Settings className="w-5 h-5 text-eqtech-gold" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-eqtech-gray-light space-y-2">
          <p>
            <strong className="text-eqtech-light">Database Tables:</strong> 
            Portfolio snapshots and configurations created via migration 013
          </p>
          <p>
            <strong className="text-eqtech-light">Edge Function:</strong> 
            Supabase function &apos;portfolio-snapshot&apos; handles calculations
          </p>
          <p>
            <strong className="text-eqtech-light">Weighted Returns:</strong> 
            Calculated as Σ(Portfolio Weight × Token Return Percentage)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}