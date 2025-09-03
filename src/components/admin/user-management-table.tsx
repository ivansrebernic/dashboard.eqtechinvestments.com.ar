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
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="animate-pulse flex space-x-4 flex-1">
              <div className="rounded-full bg-muted h-10 w-10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isEditing = editingUser === user.id
              const pendingRole = pendingRoleChanges[user.id]
              const hasChanges = hasPendingChange(user.id, user.role)
              
              return (
                <TableRow key={user.id} className={hasChanges ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <RoleIndicator role={user.role} size="sm" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div>{user.email}</div>
                      {user.roleData?.created_at ? (
                        <div className="text-xs text-muted-foreground">
                          Role set: {new Date(user.roleData.created_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          Default role (not explicitly set)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      <RoleBadge role={user.role} />
                      {hasChanges && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
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
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_INFO).map(([role, info]) => (
                                <SelectItem key={role} value={role}>
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
                          >
                            {assignLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEdit(user.id)}
                            disabled={assignLoading}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(user.id)}
                          disabled={assignLoading}
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
      
      <div className="text-sm text-muted-foreground">
        <p>• Click &quot;Edit Role&quot; to change a user&apos;s role</p>
        <p>• Changes are highlighted and must be saved</p>
        <p>• Only administrators can modify user roles</p>
      </div>
    </div>
  )
}