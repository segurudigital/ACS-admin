'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { rbacService } from '@/lib/rbac';
import { useToast } from '@/contexts/ToastContext';
import { Role } from '@/types/rbac';
import { useAuth } from '@/contexts/HierarchicalPermissionContext';
import SystemRoleConfirmationModal from './SystemRoleConfirmationModal';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedRole: Role, isEdit: boolean) => void;
  role?: Role | null;
  viewMode?: boolean;
}

export default function RoleModal({ 
  isOpen, 
  onClose, 
  onSave, 
  role,
  viewMode = false
}: RoleModalProps) {
  const { hasPermission, currentLevel } = useAuth();
  const isSuperAdmin = hasPermission('*');
  
  // Get user's hierarchy level for restricting role level options
  const userHierarchyLevel = currentLevel; // 0=union, 1=conference, 2=church
  
  // Determine which role levels this user can create/edit
  const getAvailableRoleLevels = () => {
    if (isSuperAdmin) {
      // Super admins can create any level
      return ['union', 'conference', 'church'];
    }
    
    // Users can only create roles at their level or below
    switch (userHierarchyLevel) {
      case 0: // Union level
        return ['union', 'conference', 'church'];
      case 1: // Conference level
        return ['conference', 'church'];
      case 2: // Church level
        return ['church'];
      default:
        return ['church']; // Default to most restrictive
    }
  };
  
  const availableRoleLevels = getAvailableRoleLevels();
  
  // Check if user can edit this role level
  const canEditRoleLevel = (level: string) => {
    return isSuperAdmin || availableRoleLevels.includes(level);
  };
  
  // Force view mode if user cannot edit this role level
  const effectiveViewMode = viewMode || (role && !canEditRoleLevel(role.level || ''));
  
  const [formData, setFormData] = useState({
    name: role?.name || '',
    displayName: role?.displayName || '',
    level: (role?.level || 'church') as 'union' | 'conference' | 'church',
    description: role?.description || '',
    permissions: role?.permissions || [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, Array<{key: string; label: string; description: string}>>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<React.FormEvent | null>(null);
  const toast = useToast();

  const fetchPermissions = useCallback(async () => {
    try {
      setPermissionsLoading(true);
      // Fetch permissions based on the role level being edited
      // Super admins can edit any level, but should see permissions appropriate to that level
      const permissions = await rbacService.getAvailablePermissionsForRole(formData.level);
      setAvailablePermissions(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions', 'Please try again later');
    } finally {
      setPermissionsLoading(false);
    }
  }, [formData.level, toast]);

  // Fetch available permissions when modal opens
  useEffect(() => {
    if (isOpen && !effectiveViewMode) {
      fetchPermissions();
    }
  }, [isOpen, effectiveViewMode, fetchPermissions]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If this is a system role and user is super admin, show confirmation
    if (role?.isSystem && isSuperAdmin && !showConfirmation) {
      setPendingSubmit(e);
      setShowConfirmation(true);
      return;
    }
    
    try {
      setLoading(true);
      
      const roleData = {
        name: formData.name,
        displayName: formData.displayName,
        level: formData.level,
        description: formData.description,
        permissions: formData.permissions
      };

      let response;
      if (role) {
        // Update existing role
        response = await rbacService.updateRole(role._id, roleData);
      } else {
        // Create new role
        response = await rbacService.createRole(roleData);
      }
      
      onSave(response, !!role);
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(
        role ? 'Failed to update role' : 'Failed to create role',
        'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setPendingSubmit(null);
    }
  };

  const handleConfirmSystemRoleEdit = async () => {
    if (pendingSubmit) {
      await handleSubmit(pendingSubmit);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPendingSubmit(null);
  };

  const hasWildcardPermission = () => {
    return formData.permissions.includes('*') || formData.permissions.includes('all');
  };

  const hasFormPermission = (permission: string) => {
    // Check for wildcard
    if (hasWildcardPermission()) return true;
    
    // Check exact match
    if (formData.permissions.includes(permission)) return true;
    
    // Check resource wildcard (e.g., 'users.*' matches 'users.create')
    const [resource] = permission.split('.');
    if (formData.permissions.includes(`${resource}.*`)) return true;
    
    return false;
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleAllPermissions = (resource: string, permissions: { key: string; label: string }[]) => {
    const permissionKeys = permissions.map(p => p.key);
    const hasAllPermissions = permissionKeys.every(p => hasFormPermission(p));
    
    if (hasAllPermissions) {
      // Remove all permissions for this resource
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !permissionKeys.includes(p))
      }));
    } else {
      // Add all permissions for this resource
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...permissionKeys])]
      }));
    }
  };

  // Reset form when role changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: role?.name || '',
        displayName: role?.displayName || '',
        level: (role?.level || 'church') as 'union' | 'conference' | 'church',
        description: role?.description || '',
        permissions: role?.permissions || []
      });
    }
  }, [role, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={effectiveViewMode ? 'View Role Details' : (role ? 'Edit Role' : 'Create Role')}
      maxWidth="2xl"
      theme="orange"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">
                Role Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                }))}
                placeholder="e.g., custom_admin"
                required
                disabled={effectiveViewMode || (role?.isSystem && !isSuperAdmin)}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">Lowercase, underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Custom Administrator"
                required
                disabled={effectiveViewMode || (role?.isSystem && !isSuperAdmin)}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800">
              Level *
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as 'union' | 'conference' | 'church' }))}
              disabled={effectiveViewMode || role?.isSystem}
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              {availableRoleLevels.includes('church') && <option value="church">Church</option>}
              {availableRoleLevels.includes('conference') && <option value="conference">Conference</option>}
              {availableRoleLevels.includes('union') && <option value="union">Union</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
              disabled={effectiveViewMode || role?.isSystem}
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              placeholder="Describe the role and its responsibilities..."
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-3">
              Permissions *
            </label>
            {hasWildcardPermission() && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  This role has wildcard permissions (*) which grants full system access.
                  All permission checkboxes are shown as checked.
                </p>
              </div>
            )}
            {permissionsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(availablePermissions).map(([resource, perms]) => {
                const permissionKeys = perms.map(p => p.key);
                const hasAllPermissions = permissionKeys.every(p => hasFormPermission(p));
                
                return (
                  <div key={resource} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-800 capitalize">
                        {resource}
                      </h5>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(resource, perms)}
                        disabled={effectiveViewMode || (role?.isSystem && !isSuperAdmin)}
                        className={`text-xs px-3 py-1 rounded-md font-medium ${
                          hasAllPermissions 
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {hasAllPermissions ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {perms.map((perm) => (
                        <label key={perm.key} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={hasFormPermission(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            disabled={effectiveViewMode || (role?.isSystem && !isSuperAdmin)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-gray-800">{perm.description || perm.label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {(role?.isSystem || effectiveViewMode) && (
            <div className={`border rounded-md p-4 ${
              viewMode 
                ? 'bg-blue-50 border-blue-200' 
                : (role && !canEditRoleLevel(role.level || ''))
                  ? 'bg-purple-50 border-purple-200'
                : (role?.isSystem && isSuperAdmin)
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {viewMode ? (
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  ) : (role && !canEditRoleLevel(role.level || '')) ? (
                    <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1L5 6v4h10V6l-5-5zM8.5 7.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
                    </svg>
                  ) : (role?.isSystem && isSuperAdmin) ? (
                    <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    viewMode 
                      ? 'text-blue-800' 
                      : (role && !canEditRoleLevel(role.level || ''))
                        ? 'text-purple-800'
                      : (role?.isSystem && isSuperAdmin)
                        ? 'text-orange-800'
                        : 'text-amber-800'
                  }`}>
                    {viewMode 
                      ? 'Read-Only View' 
                      : (role && !canEditRoleLevel(role.level || ''))
                        ? 'Hierarchy Restriction'
                      : (role?.isSystem && isSuperAdmin)
                        ? 'System Role - Super Admin Access'
                        : 'System Role - Restricted Access'
                    }
                  </h3>
                  <div className={`mt-2 text-sm ${
                    viewMode 
                      ? 'text-blue-700' 
                      : (role && !canEditRoleLevel(role.level || ''))
                        ? 'text-purple-700'
                      : (role?.isSystem && isSuperAdmin)
                        ? 'text-orange-700'
                        : 'text-amber-700'
                  }`}>
                    <p>
                      {viewMode 
                        ? 'You are viewing this role in read-only mode. To make changes, use the edit button.'
                        : (role && !canEditRoleLevel(role.level || ''))
                          ? `You cannot edit this ${role.level}-level role. You can only edit roles at your hierarchy level or below.`
                        : (role?.isSystem && isSuperAdmin)
                          ? 'You can modify this system role, but changes will affect all users with this role. Exercise caution when making modifications.'
                          : 'This is a system role and cannot be modified. You can view its permissions but cannot edit them.'
                      }
                    </p>
                    {role?.isSystem && isSuperAdmin && !effectiveViewMode && (
                      <p className="mt-1 font-medium">
                        Consider using &quot;Reset to Default&quot; if you need to restore original permissions.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-500"
          >
            Cancel
          </button>
          {!effectiveViewMode && !(role?.isSystem && !isSuperAdmin) && (
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.displayName || formData.permissions.length === 0}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F25F29] hover:bg-[#F23E16] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
            </button>
          )}
        </ModalFooter>
      </form>

      {/* System Role Confirmation Dialog */}
      <SystemRoleConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCancelConfirmation}
        onConfirm={handleConfirmSystemRoleEdit}
        roleName={role?.displayName || ''}
        action="edit"
      />
    </Modal>
  );
}