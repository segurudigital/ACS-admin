'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { rbacService } from '@/lib/rbac';
import { useToast } from '@/contexts/ToastContext';
import { Role } from '@/types/rbac';

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
  const toast = useToast();

  const fetchPermissions = useCallback(async () => {
    try {
      setPermissionsLoading(true);
      // Fetch permissions based on role level
      const permissions = await rbacService.getAvailablePermissionsForRole(
        role?.name === 'super_admin' ? 'union' : formData.level
      );
      setAvailablePermissions(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions', 'Please try again later');
    } finally {
      setPermissionsLoading(false);
    }
  }, [role?.name, formData.level, toast]);

  // Fetch available permissions when modal opens
  useEffect(() => {
    if (isOpen && !viewMode) {
      fetchPermissions();
    }
  }, [isOpen, viewMode, fetchPermissions]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    }
  };

  const hasWildcardPermission = () => {
    return formData.permissions.includes('*') || formData.permissions.includes('all');
  };

  const hasPermission = (permission: string) => {
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
    const hasAllPermissions = permissionKeys.every(p => hasPermission(p));
    
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
      title={viewMode ? 'View Role Details' : (role ? 'Edit Role' : 'Create Role')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                disabled={viewMode || role?.isSystem}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">Lowercase, underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Custom Administrator"
                required
                disabled={viewMode || role?.isSystem}
                className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Level *
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as 'union' | 'conference' | 'church' }))}
              disabled={viewMode || role?.isSystem}
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              <option value="church">Church</option>
              <option value="conference">Conference</option>
              <option value="union">Union</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
              disabled={viewMode || role?.isSystem}
              className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              placeholder="Describe the role and its responsibilities..."
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
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
                const hasAllPermissions = permissionKeys.every(p => hasPermission(p));
                
                return (
                  <div key={resource} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-900 capitalize">
                        {resource}
                      </h5>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(resource, perms)}
                        disabled={viewMode || role?.isSystem}
                        className={`text-xs px-3 py-1 rounded-md font-medium ${
                          hasAllPermissions 
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                            checked={hasPermission(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            disabled={viewMode || role?.isSystem}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{perm.description || perm.label}</div>
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

          {(role?.isSystem || viewMode) && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    {viewMode ? 'Read-Only View' : 'System Role'}
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      {viewMode 
                        ? 'You are viewing this role in read-only mode. To make changes, use the edit button.'
                        : 'This is a system role and cannot be modified. You can view its permissions but cannot edit them.'
                      }
                    </p>
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
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Cancel
          </button>
          {!viewMode && !role?.isSystem && (
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.displayName || formData.permissions.length === 0}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F5821F] hover:bg-[#e0741c] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
            </button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}