import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/constants';
import { RolePermissions, UserRole } from '@/types';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermission?: keyof RolePermissions;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}

/**
 * RoleGuard Component
 * 
 * Protects routes based on user role and permissions.
 * Usage:
 *   <RoleGuard requiredPermission="canCreateCustomer">
 *     <CustomerForm />
 *   </RoleGuard>
 * 
 *   <RoleGuard allowedRoles={['branch_manager', 'loan_officer']}>
 *     <LoanDetails />
 *   </RoleGuard>
 */
export function RoleGuard({ 
  children, 
  requiredPermission, 
  allowedRoles,
  fallbackPath = '/access-denied'
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const permissions = ROLE_PERMISSIONS[user.role];

  // Check specific permission
  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

/**
 * useRolePermissions Hook
 * 
 * Returns the current user's permissions for conditional rendering.
 * Usage:
 *   const { canCreateCustomer, canApproveLoan } = useRolePermissions();
 */
export function useRolePermissions(): RolePermissions | null {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return ROLE_PERMISSIONS[user.role] || null;
}

/**
 * PermissionGate Component
 * 
 * Conditionally renders children based on permission.
 * Unlike RoleGuard, this doesn't redirect - it just hides content.
 * Usage:
 *   <PermissionGate permission="canApproveLoan">
 *     <ApproveButton />
 *   </PermissionGate>
 */
interface PermissionGateProps {
  children: ReactNode;
  permission: keyof RolePermissions;
  fallback?: ReactNode;
}

export function PermissionGate({ children, permission, fallback = null }: PermissionGateProps) {
  const permissions = useRolePermissions();

  if (!permissions || !permissions[permission]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * RoleGate Component
 * 
 * Conditionally renders children based on user role.
 * Usage:
 *   <RoleGate roles={['branch_manager']}>
 *     <BranchAnalytics />
 *   </RoleGate>
 */
interface RoleGateProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGate({ children, roles, fallback = null }: RoleGateProps) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
