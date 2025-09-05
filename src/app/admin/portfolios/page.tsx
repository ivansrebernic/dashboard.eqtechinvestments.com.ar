'use client'

import { AdminGuard } from '@/components/auth/route-guard'
import { NavMenu } from '@/components/navigation/nav-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CryptoSearch } from '@/components/portfolio/crypto-search'
import { apiPortfolioService } from '@/lib/portfolio/public-api-service'
import { Portfolio, PortfolioPerformance, CreatePortfolioData, AddHoldingData } from '@/types/portfolio'
import { formatters } from '@/lib/coinmarketcap/services'
import { Trash2, Plus, Wallet, TrendingUp } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import type { CryptoCurrency } from '@/types/crypto'

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createData, setCreateData] = useState<CreatePortfolioData>({ name: '', description: '' })
  const [showAddHolding, setShowAddHolding] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null)
  const [holdingAmount, setHoldingAmount] = useState<number>(0)


  const loadPortfolios = useCallback(async () => {
    try {
      const data = await apiPortfolioService.getPortfolios()
      setPortfolios(data)
    } catch (error) {
      console.error('Error loading portfolios:', error)
      // You might want to add toast/error notification here
    }
  }, [])

  const loadPerformance = useCallback(async (portfolio: Portfolio) => {
    setLoading(true)
    try {
      const perf = await apiPortfolioService.calculatePerformance(portfolio)
      setPerformance(perf)
    } catch (error) {
      console.error('Error loading performance:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load portfolios on component mount
  useEffect(() => {
    loadPortfolios()
  }, [loadPortfolios])

  // Load performance when portfolio is selected
  useEffect(() => {
    if (selectedPortfolio) {
      loadPerformance(selectedPortfolio)
    }
  }, [selectedPortfolio, loadPerformance])

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createData.name.trim()) return

    try {
      await apiPortfolioService.createPortfolio(createData)
      setCreateData({ name: '', description: '' })
      setShowCreateForm(false)
      await loadPortfolios()
    } catch (error) {
      console.error('Error creating portfolio:', error)
      // You might want to add toast/error notification here
    }
  }

  const handleDeletePortfolio = async (id: string) => {
    if (confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await apiPortfolioService.deletePortfolio(id)
        if (selectedPortfolio?.id === id) {
          setSelectedPortfolio(null)
          setPerformance(null)
        }
        await loadPortfolios()
      } catch (error) {
        console.error('Error deleting portfolio:', error)
        // You might want to add toast/error notification here
      }
    }
  }

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPortfolio || !selectedCrypto || holdingAmount <= 0) return

    const holdingData: AddHoldingData = {
      symbol: selectedCrypto.symbol,
      amount: holdingAmount
    }

    try {
      const updatedPortfolio = await apiPortfolioService.addHolding(selectedPortfolio.id, holdingData)
      setSelectedCrypto(null)
      setHoldingAmount(0)
      setShowAddHolding(false)
      
      // Update local state with the returned portfolio
      setSelectedPortfolio(updatedPortfolio)
      await loadPortfolios()
    } catch (error) {
      console.error('Error adding holding:', error)
      // You might want to add toast/error notification here
    }
  }

  const handleCryptoSelect = (crypto: CryptoCurrency) => {
    setSelectedCrypto(crypto)
  }

  const handleRemoveHolding = async (holdingId: string) => {
    if (!selectedPortfolio) return
    
    try {
      const updatedPortfolio = await apiPortfolioService.removeHolding(selectedPortfolio.id, holdingId)
      
      // Update local state with the returned portfolio
      setSelectedPortfolio(updatedPortfolio)
      await loadPortfolios()
    } catch (error) {
      console.error('Error removing holding:', error)
      // You might want to add toast/error notification here
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-eqtech-dark flex">
        <NavMenu />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-eqtech-light font-montserrat">Portfolio Management</h1>
                <p className="text-eqtech-gold mt-2 font-roboto-flex text-lg">
                  Create and manage cryptocurrency portfolios
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Portfolio List */}
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-eqtech-light font-montserrat">
                    <span className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-eqtech-gold" />
                      Portfolios
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateForm(!showCreateForm)}
                      className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Portfolio
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Create Portfolio Form */}
                  {showCreateForm && (
                    <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                      <CardContent className="p-4 text-eqtech-light">
                        <form onSubmit={handleCreatePortfolio} className="space-y-4">
                          <div>
                            <Label htmlFor="name" className="text-eqtech-gold font-roboto-flex">Portfolio Name</Label>
                            <Input
                              id="name"
                              value={createData.name}
                              onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="My Portfolio"
                              required
                              className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description" className="text-eqtech-gold font-roboto-flex">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              value={createData.description || ''}
                              onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Portfolio description"
                              rows={3}
                              className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">Create</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateForm(false)} className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Portfolio List */}
                  {portfolios.length === 0 ? (
                    <p className="text-eqtech-gray-light text-center py-8 font-roboto-flex">
                      No portfolios yet. Create your first portfolio to get started.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {portfolios.map((portfolio) => (
                        <Card 
                          key={portfolio.id}
                          className={`cursor-pointer transition-colors bg-eqtech-dark border-eqtech-gray-medium hover:border-eqtech-gold ${
                            selectedPortfolio?.id === portfolio.id ? 'bg-eqtech-gray-medium border-eqtech-gold' : ''
                          }`}
                          onClick={() => setSelectedPortfolio(portfolio)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-eqtech-light font-montserrat">{portfolio.name}</h3>
                                {portfolio.description && (
                                  <p className="text-sm text-eqtech-gray-light font-roboto-flex">{portfolio.description}</p>
                                )}
                                <p className="text-xs text-eqtech-gray-light mt-1 font-roboto-flex">
                                  {portfolio.holdings.length} holdings • Created {new Date(portfolio.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeletePortfolio(portfolio.id)
                                }}
                                className="text-eqtech-gray-light hover:text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Details */}
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-eqtech-light font-montserrat">
                    <TrendingUp className="h-5 w-5 text-eqtech-gold" />
                    {selectedPortfolio ? selectedPortfolio.name : 'Portfolio Details'}
                  </CardTitle>
                  {selectedPortfolio && (
                    <CardDescription className="text-eqtech-gray-light font-roboto-flex">
                      {selectedPortfolio.description || 'No description'}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedPortfolio ? (
                    <p className="text-eqtech-gray-light text-center py-8 font-roboto-flex">
                      Select a portfolio to view details and performance
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {/* Performance Summary */}
                      {loading ? (
                        <div className="text-center py-4">
                          <p className="text-eqtech-gray-light font-roboto-flex">Loading performance data...</p>
                        </div>
                      ) : performance && performance.holdings.length > 0 ? (
                        <Card className="bg-eqtech-dark border-eqtech-gold">
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm text-eqtech-gold font-roboto-flex font-serif-text">Total Portfolio Value</p>
                              <p className="text-3xl font-bold text-eqtech-gold font-dm-serif">
                                {formatters.currency(performance.totalValue)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <p className="text-eqtech-gray-light text-center font-roboto-flex">
                          Add holdings to see performance data
                        </p>
                      )}

                      {/* Add Holding Form */}
                      {showAddHolding && (
                        <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                          <CardContent className="p-4 text-eqtech-light">
                            <form onSubmit={handleAddHolding} className="space-y-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-eqtech-gold font-roboto-flex">Select Cryptocurrency</Label>
                                  <CryptoSearch
                                    onSelect={handleCryptoSelect}
                                    placeholder="Search for cryptocurrency..."
                                  />
                                  {selectedCrypto && (
                                    <p className="text-xs text-eqtech-gray-light font-roboto-flex mt-1">
                                      Selected: {selectedCrypto.name} ({selectedCrypto.symbol}) - {formatters.currency(selectedCrypto.quote.USD.price)}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <Label htmlFor="amount" className="text-eqtech-gold font-roboto-flex">Amount</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={holdingAmount || ''}
                                    onChange={(e) => setHoldingAmount(parseFloat(e.target.value) || 0)}
                                    placeholder="0.1"
                                    className="bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                                    required
                                    disabled={!selectedCrypto}
                                  />
                                  {selectedCrypto && holdingAmount > 0 && (
                                    <p className="text-xs text-eqtech-gray-light font-roboto-flex mt-1">
                                      Estimated value: {formatters.currency(holdingAmount * selectedCrypto.quote.USD.price)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={!selectedCrypto || holdingAmount <= 0} className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">
                                  Add Holding
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setShowAddHolding(false)
                                    setSelectedCrypto(null)
                                    setHoldingAmount(0)
                                  }}
                                  className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      {/* Holdings List */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-eqtech-light font-montserrat">Holdings</h4>
                          <Button 
                            size="sm" 
                            onClick={() => setShowAddHolding(!showAddHolding)}
                            disabled={showAddHolding}
                            className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Holding
                          </Button>
                        </div>

                        {selectedPortfolio.holdings.length === 0 ? (
                          <p className="text-eqtech-gray-light font-roboto-flex text-center py-4">
                            No holdings yet. Add some cryptocurrencies to track performance.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {selectedPortfolio.holdings.map((holding) => {
                              const holdingPerf = performance?.holdings.find(h => h.symbol === holding.symbol)
                              return (
                                <Card key={holding.id} className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-semibold text-eqtech-light font-montserrat">{holding.symbol}</h5>
                                        <p className="text-sm text-eqtech-gray-light font-roboto-flex">
                                          Amount: {formatters.number(holding.amount)}
                                        </p>
                                        {holdingPerf && (
                                          <div className="mt-2 space-y-1">
                                            <p className="text-sm text-eqtech-light font-roboto-flex">
                                              Price: {formatters.currency(holdingPerf.currentPrice)}
                                            </p>
                                            <p className="text-sm font-semibold text-green-400 font-roboto-flex">
                                              Value: {formatters.currency(holdingPerf.totalValue)}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveHolding(holding.id)}
                                        className="text-eqtech-gray-light hover:text-red-400 hover:bg-red-900/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}