'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminGuard } from '@/components/auth/route-guard'
import { NavMenu } from '@/components/navigation/nav-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Plus, 
  Coins,
  Edit,
  Trash2,
  DollarSign
} from 'lucide-react'
import type { 
  PortfolioWithHoldings, 
  PortfolioHolding,
  AddHoldingRequest,
  UpdateHoldingRequest 
} from '@/types/portfolio'

interface PortfolioResponse {
  portfolio: PortfolioWithHoldings
}


export default function PortfolioHoldingsPage() {
  const params = useParams()
  const router = useRouter()
  const portfolioId = params.id as string
  
  const [portfolio, setPortfolio] = useState<PortfolioWithHoldings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [newHolding, setNewHolding] = useState<AddHoldingRequest>({
    symbol: '',
    amount: 0
  })
  
  const [editAmount, setEditAmount] = useState(0)
  
  const { toast } = useToast()

  const loadPortfolio = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/portfolios/${portfolioId}`)
      if (!response.ok) {
        throw new Error('Failed to load portfolio')
      }
      const data: PortfolioResponse = await response.json()
      setPortfolio(data.portfolio)
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast({
        title: 'Error',
        description: 'Failed to load portfolio',
        variant: 'destructive'
      })
      router.push('/admin/portfolios')
    } finally {
      setLoading(false)
    }
  }, [portfolioId, toast, router])

  useEffect(() => {
    loadPortfolio()
  }, [portfolioId, loadPortfolio])

  const addHolding = async () => {
    if (!newHolding.symbol.trim() || newHolding.amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid symbol and amount',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/portfolios/${portfolioId}/holdings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newHolding)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add holding')
      }

      toast({
        title: 'Success',
        description: 'Holding added successfully'
      })

      setNewHolding({ symbol: '', amount: 0 })
      setShowAddForm(false)
      loadPortfolio()
    } catch (error) {
      console.error('Error adding holding:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add holding',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const updateHolding = async (holding: PortfolioHolding) => {
    if (editAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Amount must be greater than 0',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/portfolios/${portfolioId}/holdings/${holding.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: editAmount } as UpdateHoldingRequest)
      })

      if (!response.ok) {
        throw new Error('Failed to update holding')
      }

      toast({
        title: 'Success',
        description: 'Holding updated successfully'
      })

      setEditingHolding(null)
      loadPortfolio()
    } catch (error) {
      console.error('Error updating holding:', error)
      toast({
        title: 'Error',
        description: 'Failed to update holding',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const removeHolding = async (holding: PortfolioHolding) => {
    if (!confirm(`Are you sure you want to remove ${holding.symbol} from this portfolio?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/portfolios/${portfolioId}/holdings/${holding.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove holding')
      }

      toast({
        title: 'Success',
        description: 'Holding removed successfully'
      })

      loadPortfolio()
    } catch (error) {
      console.error('Error removing holding:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove holding',
        variant: 'destructive'
      })
    }
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 8
    }).format(amount)
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-eqtech-dark flex">
          <NavMenu />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-eqtech-gray-medium rounded w-64"></div>
                <div className="h-32 bg-eqtech-gray-medium rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </AdminGuard>
    )
  }

  if (!portfolio) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-eqtech-dark flex">
          <NavMenu />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2 text-eqtech-light font-montserrat">Portfolio not found</h3>
                  <Button onClick={() => router.push('/admin/portfolios')} className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Portfolios
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-eqtech-dark flex">
        <NavMenu />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/portfolios')}
                  className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Portfolios
                </Button>
                <div>
                  <h1 className="text-4xl font-bold text-eqtech-light font-montserrat flex items-center gap-3">
                    <Coins className="h-8 w-8 text-eqtech-gold" />
                    {portfolio.name} - Holdings
                  </h1>
                  <p className="text-eqtech-gold mt-2 font-roboto-flex text-lg">
                    Manage cryptocurrency holdings in this portfolio
                  </p>
                </div>
              </div>
              
              <Button onClick={() => setShowAddForm(true)} className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Add Holding
              </Button>
            </div>

            {/* Add Holding Form */}
            {showAddForm && (
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardHeader>
                  <CardTitle className="text-eqtech-light font-montserrat">Add New Holding</CardTitle>
                  <CardDescription className="text-eqtech-gray-light font-roboto-flex">
                    Add a cryptocurrency holding to this portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="symbol" className="text-eqtech-gold font-roboto-flex">Symbol</Label>
                    <Input
                      id="symbol"
                      value={newHolding.symbol}
                      onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., BTC, ETH, ADA..."
                      className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount" className="text-eqtech-gold font-roboto-flex">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      min="0"
                      value={newHolding.amount || ''}
                      onChange={(e) => setNewHolding({ ...newHolding, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00000000"
                      className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button onClick={addHolding} disabled={submitting} className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">
                      {submitting ? 'Adding...' : 'Add Holding'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      disabled={submitting}
                      className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Holdings List */}
            <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-eqtech-light font-montserrat">
                  <Coins className="h-5 w-5 text-eqtech-gold" />
                  Holdings ({portfolio.holdings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {portfolio.holdings.length > 0 ? (
                  <div className="space-y-4">
                    {portfolio.holdings.map((holding) => (
                      <div key={holding.id} className="flex items-center justify-between p-4 border border-eqtech-gray-medium rounded-lg bg-eqtech-dark">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-eqtech-gold/20 rounded-full">
                            <DollarSign className="h-5 w-5 text-eqtech-gold" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg text-eqtech-light font-montserrat">{holding.symbol}</p>
                              <Badge variant="outline" className="border-eqtech-gold text-eqtech-gold">
                                {formatNumber(holding.amount)} coins
                              </Badge>
                            </div>
                            <p className="text-sm text-eqtech-gray-light font-roboto-flex">
                              Added {new Date(holding.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingHolding(holding)
                              setEditAmount(holding.amount)
                            }}
                            className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeHolding(holding)}
                            className="border-red-600 text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Edit Holding Modal */}
                    {editingHolding && (
                      <div className="fixed inset-0 bg-eqtech-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md bg-eqtech-gray-dark border-eqtech-gray-medium">
                          <CardHeader>
                            <CardTitle className="text-eqtech-light font-montserrat">Edit {editingHolding.symbol} Holding</CardTitle>
                            <CardDescription className="text-eqtech-gray-light font-roboto-flex">
                              Update the amount of {editingHolding.symbol} in this portfolio
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="editAmount" className="text-eqtech-gold font-roboto-flex">Amount</Label>
                              <Input
                                id="editAmount"
                                type="number"
                                step="any"
                                min="0"
                                value={editAmount || ''}
                                onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                                placeholder="0.00000000"
                                className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <Button 
                                onClick={() => updateHolding(editingHolding)} 
                                disabled={submitting}
                                className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium"
                              >
                                {submitting ? 'Updating...' : 'Update'}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setEditingHolding(null)}
                                disabled={submitting}
                                className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat"
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Coins className="h-16 w-16 mx-auto text-eqtech-gray-light mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-eqtech-light font-montserrat">No holdings yet</h3>
                    <p className="text-eqtech-gray-light font-roboto-flex mb-4">
                      Add cryptocurrency holdings to this portfolio
                    </p>
                    <Button onClick={() => setShowAddForm(true)} className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Holding
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}