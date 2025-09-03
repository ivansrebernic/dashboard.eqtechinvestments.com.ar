'use client';

import { Badge } from '@/components/ui/badge';
import { Shield, User, ShieldCheck } from 'lucide-react';
import type { UserRole } from '@/types/auth';
import { ROLE_INFO } from '@/lib/roles/permissions';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function RoleBadge({ role, showIcon = true, className, variant }: RoleBadgeProps) {
  const roleInfo = ROLE_INFO[role];
  
  const getIcon = () => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-3 w-3" />;
      case 'basic':
        return <User className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };


  const getRoleColorClasses = () => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    }
  };

  return (
    <Badge 
      variant={variant || 'outline'}
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        !variant && getRoleColorClasses(),
        className
      )}
    >
      {showIcon && getIcon()}
      <span className="capitalize">{roleInfo.label}</span>
    </Badge>
  );
}

// Role indicator for user avatars or cards
export function RoleIndicator({ role, size = 'sm' }: { role: UserRole, size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const colorClasses = {
    admin: 'text-red-600 dark:text-red-400',
    basic: 'text-blue-600 dark:text-blue-400'
  };

  const getIcon = () => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className={cn(sizeClasses[size], colorClasses[role])} />;
      case 'basic':
        return <User className={cn(sizeClasses[size], colorClasses[role])} />;
      default:
        return <Shield className={cn(sizeClasses[size], 'text-gray-600 dark:text-gray-400')} />;
    }
  };

  return (
    <div className="inline-flex items-center" title={`Role: ${ROLE_INFO[role].label}`}>
      {getIcon()}
    </div>
  );
}

// Compact role display for lists
export function CompactRoleBadge({ role }: { role: UserRole }) {
  const roleInfo = ROLE_INFO[role];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      role === 'admin' 
        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
    )}>
      {roleInfo.label}
    </span>
  );
}