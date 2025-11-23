'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/components/AdminLayout';
import { rbacService } from '@/lib/rbac';
import { useToast } from '@/contexts/ToastContext';
import { Role } from '@/types/rbac';
import { PermissionCategory } from '@/components/PermissionCategory';
import { PermissionBreadcrumb } from '@/components/PermissionBreadcrumb';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';

interface Permission {
  key: string;
  label: string;
  description: string;
  scopes?: string[];
}

interface PermissionStructure {
  [category: string]: Permission[];
}

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = hasPermission('*');
  
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<PermissionStructure>({});
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('overview');
  
  const roleId = params?.id as string;
  
  const fetchRoleData = useCallback(async () => {
    const id = params?.id as string;
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch all roles and find the specific one
      const allRoles = await rbacService.getRoles(true); // Include system roles
      const roleData = allRoles.find(r => r._id === id);
      
      if (!roleData) {
        throw new Error('Role not found');
      }
      
      setRole(roleData);
      setRolePermissions(roleData.permissions || []);
      
      // Fetch available permissions for this role's level
      const availablePermissions = await rbacService.getAvailablePermissionsForRole(roleData.level);
      setPermissions(availablePermissions);
      
    } catch (error) {
      console.error('Error fetching role data:', error);
      toast.error('Failed to load role', 'Unable to fetch role details');
      router.push('/roles');
    } finally {
      setLoading(false);
    }
  }, [params?.id, router, toast]);

  useEffect(() => {
    fetchRoleData();
  }, [fetchRoleData]);
  
  if (!roleId) {
    router.push('/roles');
    return null;
  }
  
  // Permission categories with hierarchy requirements matching backend
  const permissionCategories = [
    {
      id: 'system',
      name: 'System Administration',
      description: 'Core system configuration and maintenance',
      level: 'super_admin',
      requiredHierarchyLevel: -1  // Super admin only
    },
    {
      id: 'unions',
      name: 'Union Management',
      description: 'Union-level administration and oversight',
      level: 'union',
      requiredHierarchyLevel: 0  // Union level only
    },
    {
      id: 'conferences', 
      name: 'Conference Management',
      description: 'Conference-level administration and coordination',
      level: 'union',  // Union can manage conferences
      requiredHierarchyLevel: 0  // Union level and above
    },
    {
      id: 'churches',
      name: 'Church Management', 
      description: 'Church-level administration and coordination',
      level: 'union',  // Union can manage churches
      requiredHierarchyLevel: 0  // Union level and above
    },
    {
      id: 'users',
      name: 'User Management',
      description: 'User accounts and assignments',
      level: 'conference',
      requiredHierarchyLevel: 1  // Conference level and above
    },
    {
      id: 'roles',
      name: 'Roles & Permissions',
      description: 'Role definitions and access control',
      level: 'conference',
      requiredHierarchyLevel: 1  // Conference level and above
    },
    {
      id: 'teams',
      name: 'Team Management',
      description: 'Team creation and coordination',
      level: 'church',
      requiredHierarchyLevel: 2  // Church level and above (all levels)
    },
    {
      id: 'services',
      name: 'Community Services',
      description: 'Core ACS service management',
      level: 'church',
      requiredHierarchyLevel: 2  // Church level and above (all levels)
    },
    {
      id: 'stories',
      name: 'Success Stories',
      description: 'Testimonials and story management',
      level: 'church',
      requiredHierarchyLevel: 2  // Church level and above (all levels)
    },
    {
      id: 'dashboard',
      name: 'Analytics & Reports',
      description: 'Dashboard access and reporting',
      level: 'church',
      requiredHierarchyLevel: 2  // Church level and above (all levels)
    },
    {
      id: 'media',
      name: 'Media & File Management',
      description: 'Media library and file upload management',
      level: 'church',
      requiredHierarchyLevel: 2  // Church level and above (all levels)
    }
  ];

  const getRoleHierarchyLevel = (level: string): number => {
    switch (level) {
      case 'union': return 0;      // Highest level
      case 'conference': return 1; // Middle level  
      case 'church': return 2;     // Lowest level
      default: return 2;           // Default to most restrictive
    }
  };

  const roleHasPermission = (permission: string): boolean => {
    // Check for wildcard
    if (rolePermissions.includes('*') || rolePermissions.includes('all')) {
      return true;
    }
    
    // Check exact match
    if (rolePermissions.includes(permission)) {
      return true;
    }
    
    // Check resource wildcard (e.g., 'users.*' matches 'users.create')
    const [resource] = permission.split('.');
    if (rolePermissions.includes(`${resource}.*`)) {
      return true;
    }
    
    return false;
  };

  const togglePermission = async (permission: string) => {
    if (role?.isSystem && !isSuperAdmin) return;
    if (!role) return;
    
    const isCurrentlyEnabled = rolePermissions.includes(permission);
    const action = isCurrentlyEnabled ? 'removed' : 'added';
    
    // Optimistically update UI
    const newPermissions = isCurrentlyEnabled
      ? rolePermissions.filter(p => p !== permission)
      : [...rolePermissions, permission];
    
    setRolePermissions(newPermissions);
    
    // Add to saving state
    setSavingPermissions(prev => new Set(prev).add(permission));
    
    try {
      await rbacService.updateRole(role._id, {
        ...role,
        permissions: newPermissions
      });
      
      setRole(prev => prev ? { ...prev, permissions: newPermissions } : null);
      
      toast.success(
        `Permission ${action}`,
        `${permission} has been ${action} ${isCurrentlyEnabled ? 'from' : 'to'} ${role.displayName}`
      );
      
    } catch (error) {
      console.error('Error saving permission:', error);
      
      // Revert optimistic update on error
      setRolePermissions(rolePermissions);
      
      toast.error(
        'Failed to update permission',
        `Could not ${action.slice(0, -2)} ${permission}`
      );
    } finally {
      setSavingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(permission);
        return newSet;
      });
    }
  };

  const toggleCategoryPermissions = async (category: string, enable: boolean) => {
    if (role?.isSystem && !isSuperAdmin) return;
    if (!role) return;
    
    const categoryPermissions = permissions[category]?.map(p => p.key) || [];
    const action = enable ? 'enabled' : 'disabled';
    
    // Optimistically update UI
    let newPermissions;
    if (enable) {
      // Add all permissions for this category
      newPermissions = [...new Set([...rolePermissions, ...categoryPermissions])];
    } else {
      // Remove all permissions for this category
      newPermissions = rolePermissions.filter(p => !categoryPermissions.includes(p));
    }
    
    setRolePermissions(newPermissions);
    
    // Add all category permissions to saving state
    setSavingPermissions(prev => {
      const newSet = new Set(prev);
      categoryPermissions.forEach(perm => newSet.add(perm));
      return newSet;
    });
    
    try {
      await rbacService.updateRole(role._id, {
        ...role,
        permissions: newPermissions
      });
      
      setRole(prev => prev ? { ...prev, permissions: newPermissions } : null);
      
      toast.success(
        `Category ${action}`,
        `All ${category} permissions have been ${action} for ${role.displayName}`
      );
      
    } catch (error) {
      console.error('Error saving category permissions:', error);
      
      // Revert optimistic update on error
      setRolePermissions(rolePermissions);
      
      toast.error(
        'Failed to update permissions',
        `Could not ${enable ? 'enable' : 'disable'} ${category} permissions`
      );
    } finally {
      setSavingPermissions(prev => {
        const newSet = new Set(prev);
        categoryPermissions.forEach(perm => newSet.delete(perm));
        return newSet;
      });
    }
  };


  const resetToDefaults = async () => {
    if (!role?.isSystem || !isSuperAdmin) return;
    
    try {
      setResetting(true);
      
      const resetRole = await rbacService.resetSystemRole(role._id);
      
      setRole(resetRole);
      setRolePermissions(resetRole.permissions || []);
      
      toast.success('Role reset to defaults', 'System role has been restored to its original configuration');
      
    } catch (error) {
      console.error('Error resetting role to defaults:', error);
      toast.error('Failed to reset role', 'An unexpected error occurred');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading role permissions...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Role not found</p>
      </div>
    );
  }

  // Filter categories based on role hierarchy level and available permissions
  const visibleCategories = permissionCategories.filter(category => {
    // Must have permissions available from backend
    const hasPermissions = permissions[category.id] && permissions[category.id].length > 0;
    
    // Special handling for system permissions - only super admin can see them
    if (category.id === 'system' && !isSuperAdmin) {
      return false;
    }
    
    // Must be at appropriate hierarchy level for this role
    // Lower hierarchy numbers are higher privilege (0=union, 1=conference, 2=church)
    const roleHierarchyLevel = getRoleHierarchyLevel(role?.level || 'church');
    const canAccessCategory = roleHierarchyLevel <= category.requiredHierarchyLevel;
    
    return hasPermissions && canAccessCategory;
  });


  const renderContent = () => {
    if (selectedCategory === 'overview') {
      return (
        <div className="space-y-6">
          {/* Role Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{role.displayName}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {role.level}
                </span>
                {role.isSystem && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    System Role
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{role.description}</p>
              <PermissionBreadcrumb 
                roleLevel={role?.level || 'church'} 
                permissionCount={rolePermissions.length}
                totalAvailable={Object.values(permissions).flat().length}
              />
            </div>
          </div>

          {/* System Role Warning */}
          {role.isSystem && (
            <div className={`border rounded-md p-4 ${
              isSuperAdmin 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {isSuperAdmin ? (
                    <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    isSuperAdmin ? 'text-orange-800' : 'text-gray-900'
                  }`}>
                    {isSuperAdmin 
                      ? 'System Role - Super Admin Access' 
                      : 'System Role - Read Only'
                    }
                  </h3>
                  <p className={`mt-2 text-sm ${
                    isSuperAdmin ? 'text-orange-700' : 'text-gray-600'
                  }`}>
                    {isSuperAdmin 
                      ? 'You can modify this system role, but changes will affect all users with this role. Exercise caution when making modifications.'
                      : 'This is a system role and cannot be modified. You can view its permissions but cannot edit them.'
                    }
                  </p>
                  {isSuperAdmin && (
                    <p className="mt-1 text-sm font-medium text-orange-700">
                      Consider using &ldquo;Reset to Default&rdquo; if you need to restore original permissions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wildcard Permission Notice */}
          {(rolePermissions.includes('*') || rolePermissions.includes('all')) && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Wildcard Permissions Active
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  This role has wildcard permissions (*) which grants full system access. 
                  All permission switches are shown as enabled.
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900">{rolePermissions.length}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{visibleCategories.length}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Hierarchy Level</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{role.level}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Specific category view
    const category = visibleCategories.find(c => c.id === selectedCategory);
    if (!category) return <div>Category not found</div>;
    
    const categoryPermissions = permissions[category.id] || [];
    const hasAnyPermission = categoryPermissions.some(p => roleHasPermission(p.key));
    const hasAllPermissions = categoryPermissions.length > 0 && categoryPermissions.every(p => roleHasPermission(p.key));
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
          <p className="text-gray-600">{category.description}</p>
        </div>

        <PermissionCategory
          category={category}
          permissions={categoryPermissions}
          hasPermission={roleHasPermission}
          togglePermission={togglePermission}
          toggleCategoryPermissions={toggleCategoryPermissions}
          hasAnyPermission={hasAnyPermission}
          hasAllPermissions={hasAllPermissions}
          isReadOnly={(role.isSystem && !isSuperAdmin) || !hasPermission('roles.update')}
          savingPermissions={savingPermissions}
        />
      </div>
    );
  };

  return (
    <AdminLayout 
      title={`${role.displayName} - Permissions`}
      description="Manage role permissions and access control"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/roles')}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Roles
            </button>
          </div>
          
          {/* Action buttons */}
          {role.isSystem && isSuperAdmin && (
            <div className="flex items-center space-x-3">
              <button
                onClick={resetToDefaults}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {resetting ? 'Resetting...' : 'Reset to Default'}
              </button>
            </div>
          )}
        </div>

        {/* Two-panel layout matching settings page */}
        <div className="flex h-[calc(100vh-200px)] bg-gray-50">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {role.displayName} Permissions
              </h2>
              
              <nav className="space-y-8">
                {/* Overview Section */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Role Management
                  </h3>
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setSelectedCategory('overview')}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                          selectedCategory === 'overview'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">Overview</div>
                          <div className="text-xs text-gray-500 mt-0.5">Role summary and statistics</div>
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Permission Categories */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Permission Categories
                  </h3>
                  <ul className="space-y-1">
                    {visibleCategories.map((category) => {
                      const categoryPermissions = permissions[category.id] || [];
                      const enabledCount = categoryPermissions.filter(p => roleHasPermission(p.key)).length;
                      const totalCount = categoryPermissions.length;
                      
                      return (
                        <li key={category.id}>
                          <button
                            onClick={() => setSelectedCategory(category.id)}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                              selectedCategory === category.id
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{category.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {enabledCount} of {totalCount} enabled
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}