'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleBadge, RoleIndicator } from '@/components/roles/role-badge'
import { useAdminFunctions } from '@/lib/roles/hooks'
import { Save, Loader2 } from 'lucide-react'
import type { UserWithRole, UserRole } from '@/types/auth'
import { ROLE_INFO } from '@/lib/roles/permissions'

interface UserManagementTableProps {
  users: UserWithRole[]
  loading?: boolean
  onRoleChange?: () => Promise<void>
}

export function UserManagementTable({ users, loading, onRoleChange }: UserManagementTableProps) {
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, UserRole>>({})
  const { assignRole, loading: assignLoading, error } = useAdminFunctions()

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setPendingRoleChanges(prev => ({
      ...prev,
      [userId]: newRole
    }))
  }

  const handleSaveRole = async (userId: string) => {
    const newRole = pendingRoleChanges[userId]
    if (!newRole) return

    try {
      await assignRole(userId, newRole)
      
      // Clear pending change
      setPendingRoleChanges(prev => {
        const updated = { ...prev }
        delete updated[userId]
        return updated
      })
      
      setEditingUser(null)
      
      // Notify parent to refresh data
      if (onRoleChange) {
        await onRoleChange()
      }
    } catch (err) {
      console.error('Failed to assign role:', err)
    }
  }

  const handleCancelEdit = (userId: string) => {
    setPendingRoleChanges(prev => {
      const updated = { ...prev }
      delete updated[userId]
      return updated
    })
    setEditingUser(null)
  }

  const hasPendingChange = (userId: string, currentRole: UserRole) => {
    return pendingRoleChanges[userId] && pendingRoleChanges[userId] !== currentRole
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border border-eqtech-gray-medium rounded-lg bg-eqtech-dark">
            <div className="animate-pulse flex space-x-4 flex-1">
              <div className="rounded-full bg-eqtech-gray-medium h-10 w-10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-eqtech-gray-medium rounded w-1/3"></div>
                <div className="h-3 bg-eqtech-gray-medium rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-eqtech-gray-medium rounded w-16"></div>
              <div className="h-8 bg-eqtech-gray-medium rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-eqtech-gray-light font-roboto-flex">No users found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
          <p className="text-red-400 text-sm font-roboto-flex">{error}</p>
        </div>
      )}
      
      <div className="rounded-md border border-eqtech-gray-medium bg-eqtech-gray-dark">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-eqtech-gray-medium">
              <TableHead className="text-eqtech-gold font-montserrat font-medium">User</TableHead>
              <TableHead className="text-eqtech-gold font-montserrat font-medium">Email</TableHead>
              <TableHead className="text-eqtech-gold font-montserrat font-medium">Current Role</TableHead>
              <TableHead className="text-eqtech-gold font-montserrat font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isEditing = editingUser === user.id
              const pendingRole = pendingRoleChanges[user.id]
              const hasChanges = hasPendingChange(user.id, user.role)
              
              return (
                <TableRow key={user.id} className={`border-b border-eqtech-gray-medium ${hasChanges ? 'bg-amber-500/10' : 'hover:bg-eqtech-dark'}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-eqtech-gray-medium rounded-full flex items-center justify-center">
                        <RoleIndicator role={user.role} size="sm" />
                      </div>
                      <div>
                        <div className="font-medium text-eqtech-light font-montserrat">
                          {user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown'}
                        </div>
                        <div className="text-xs text-eqtech-gray-light font-roboto-flex">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-eqtech-light font-roboto-flex">{user.email}</div>
                      {user.roleData?.created_at ? (
                        <div className="text-xs text-eqtech-gray-light font-roboto-flex">
                          Role set: {new Date(user.roleData.created_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-xs text-eqtech-gray-light font-roboto-flex italic">
                          Default role (not explicitly set)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      <RoleBadge role={user.role} />
                      {hasChanges && (
                        <div className="text-xs text-amber-400 font-roboto-flex">
                          → Will change to: <span className="font-medium capitalize">{pendingRole}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Select
                            value={pendingRole || user.role}
                            onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32 bg-eqtech-dark border-eqtech-gray-medium text-eqtech-light">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                              {Object.entries(ROLE_INFO).map(([role, info]) => (
                                <SelectItem key={role} value={role} className="text-eqtech-light hover:bg-eqtech-dark focus:bg-eqtech-dark">
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize">{info.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="sm"
                            onClick={() => handleSaveRole(user.id)}
                            disabled={assignLoading || !pendingRole || pendingRole === user.role}
                            className="bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium"
                          >
                            {assignLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleCancelEdit(user.id)}
                            disabled={assignLoading}
                            className="bg-eqtech-gray-dark border border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setEditingUser(user.id)}
                          disabled={assignLoading}
                          className="bg-eqtech-gray-dark border border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat"
                        >
                          Edit Role
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-eqtech-gray-light font-roboto-flex">
        <p>• Click &quot;Edit Role&quot; to change a user&apos;s role</p>
        <p>• Changes are highlighted and must be saved</p>
        <p>• Only administrators can modify user roles</p>
      </div>
    </div>
  )
}