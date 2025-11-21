import { usePermissions } from '@/contexts/PermissionContext';

export const useSuperAdmin = () => {
  const { hasPermission, role } = usePermissions();
  
  // Check if user has wildcard permissions (super admin)
  const isSuperAdmin = hasPermission('*') || role === 'super_admin';
  
  return { isSuperAdmin };
};