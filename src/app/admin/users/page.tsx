'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/auth/route-guard'
import { NavMenu } from '@/components/navigation/nav-menu'
import { UserManagementTable } from '@/components/admin/user-management-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminFunctions } from '@/lib/roles/hooks'
import { Users, Search, RefreshCw } from 'lucide-react'
import type { UserWithRole } from '@/types/auth'

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { getAllUsers, error } = useAdminFunctions()

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const usersData = await getAllUsers()
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [getAllUsers])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const handleUserRoleChange = async () => {
    // Reload users after role change
    await loadUsers()
  }

  const totalUsers = users.length
  const adminUsers = users.filter(user => user.role === 'admin').length
  const basicUsers = users.filter(user => user.role === 'basic').length

  return (
    <AdminGuard>
      <div className="min-h-screen bg-eqtech-dark flex">
        <NavMenu />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-eqtech-light font-montserrat">User Management</h1>
                <p className="text-eqtech-gold mt-2 font-roboto-flex text-lg">
                  Manage user accounts and role assignments
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={loadUsers}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">Total Users</p>
                      <p className="text-2xl font-bold text-eqtech-light font-montserrat">{totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-eqtech-gold" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">Admin Users</p>
                      <p className="text-2xl font-bold text-eqtech-gold font-montserrat">{adminUsers}</p>
                    </div>
                    <div className="w-8 h-8 bg-eqtech-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-eqtech-gold font-bold text-sm">A</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">Basic Users</p>
                      <p className="text-2xl font-bold text-eqtech-light font-montserrat">{basicUsers}</p>
                    </div>
                    <div className="w-8 h-8 bg-eqtech-gray-medium rounded-full flex items-center justify-center">
                      <span className="text-eqtech-light font-bold text-sm">B</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
              <CardHeader>
                <CardTitle className="text-eqtech-light font-montserrat">Search Users</CardTitle>
                <CardDescription className="text-eqtech-gray-light font-roboto-flex">
                  Search by email, username, or role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-eqtech-gold" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light font-roboto-flex"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
              <CardHeader>
                <CardTitle className="text-eqtech-light font-montserrat">Users ({filteredUsers.length})</CardTitle>
                <CardDescription className="text-eqtech-gray-light font-roboto-flex">
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
                    <p className="text-red-400 text-sm font-roboto-flex">{error}</p>
                  </div>
                )}
                
                <UserManagementTable 
                  users={filteredUsers}
                  loading={isLoading}
                  onRoleChange={handleUserRoleChange}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}