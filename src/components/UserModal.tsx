'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { useToast } from '@/contexts/ToastContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { User, Role, Organization } from '@/types/rbac';
import { rbacService } from '@/lib/rbac';

interface UserModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSave: (savedUser: User, isEdit: boolean) => void;
   user?: User | null;
}

export default function UserModal({
   isOpen,
   onClose,
   onSave,
   user,
}: UserModalProps) {
   const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      country: user?.country || '',
      verified: user?.verified || false,
   });
   const [loading, setLoading] = useState(false);
   const [roles, setRoles] = useState<Role[]>([]);
   const [organizations, setOrganizations] = useState<Organization[]>([]);
   const [selectedRole, setSelectedRole] = useState('');
   const [selectedOrganization, setSelectedOrganization] = useState('');
   const toast = useToast();
   const { hasPermission } = usePermissions();

   const fetchRoles = useCallback(async () => {
      if (!isOpen) return; // Fetch for both new and existing users

      try {
         console.log('Fetching roles...');
         const systemRoles = await rbacService.getSystemRoles();
         console.log('Received roles from API:', systemRoles);
         setRoles(Array.isArray(systemRoles) ? systemRoles : []);
         console.log('Roles set in state:', Array.isArray(systemRoles) ? systemRoles : []);
      } catch (error) {
         console.error('Error fetching roles:', error);
         setRoles([]);
      }
   }, [isOpen]);

   const fetchOrganizations = useCallback(async () => {
      if (!isOpen) return; // Fetch for both new and existing users

      try {
         console.log('Fetching organizations...');
         const orgs = await rbacService.getOrganizations();
         console.log('Received organizations from API:', orgs);
         setOrganizations(Array.isArray(orgs) ? orgs : []);
         console.log('Organizations set in state:', Array.isArray(orgs) ? orgs : []);
      } catch (error) {
         console.error('Error fetching organizations:', error);
         setOrganizations([]);
      }
   }, [isOpen]);

   useEffect(() => {
      if (isOpen && hasPermission('users.assign_role')) {
         fetchRoles();
         fetchOrganizations();
      }
   }, [fetchRoles, fetchOrganizations, isOpen, hasPermission]);

   const getFilteredRoles = useCallback(() => {
      // Find the selected organization object
      const selectedOrgObj = organizations.find(org => org._id === selectedOrganization);
      console.log('getFilteredRoles called with selectedOrganization:', selectedOrganization);
      console.log('selectedOrgObj:', selectedOrgObj);
      console.log('selectedOrgObj.type:', selectedOrgObj?.type);
      
      if (!selectedOrgObj) {
         console.log('No organization selected - returning all roles');
         return roles;
      }

      // If organization type is undefined, return all roles (super admin case)
      if (!selectedOrgObj.type) {
         console.log('No organization type defined - returning all roles (super admin)');
         return roles;
      }

      // Filter roles based on selected organization type
      const filteredRoles = roles.filter((role) => {
         console.log('Checking role:', role.name, 'level:', role.level, 'against org type:', selectedOrgObj.type);
         
         // Security check: Only super admins can assign super_admin roles
         if (role.name === 'super_admin') {
            const currentUserIsSuperAdmin = hasPermission('*');
            console.log('Super admin role check - current user has wildcard permission:', currentUserIsSuperAdmin);
            if (!currentUserIsSuperAdmin) {
               console.log('Non-super-admin user cannot assign super_admin role');
               return false;
            }
         }
         
         // Church can have all roles
         if (selectedOrgObj.type === 'church') {
            console.log('Church org - including role:', role.name);
            return true;
         }
         // Conference can have conference and union roles
         if (selectedOrgObj.type === 'conference') {
            const canInclude = role.level ? ['conference', 'union'].includes(role.level) : false;
            console.log('Conference org - can include:', canInclude, 'for role:', role.name);
            return canInclude;
         }
         // Union can only have union roles
         if (selectedOrgObj.type === 'union') {
            const canInclude = role.level === 'union';
            console.log('Union org - can include:', canInclude, 'for role:', role.name);
            return canInclude;
         }

         console.log('Unknown org type - excluding role:', role.name);
         return false;
      });
      console.log('Filtered roles result:', filteredRoles);
      return filteredRoles;
   }, [selectedOrganization, organizations, roles, hasPermission]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
         setLoading(true);

         const userData: {
            name: string;
            email: string;
            phone?: string;
            address?: string;
            city?: string;
            state?: string;
            country?: string;
            verified: boolean;
            organizationId?: string;
            role?: string;
         } = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            address: formData.address || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            country: formData.country || undefined,
            verified: formData.verified,
         };

         // Add role assignment data if selected
         if (selectedOrganization && selectedRole) {
            userData.organizationId = selectedOrganization;
            userData.role = selectedRole;
         }

         let response;
         if (user) {
            // Update existing user - split into user info update and role assignment
            
            // First, update basic user information (exclude role assignment fields)
            const basicUserData = { ...userData };
            delete basicUserData.organizationId;
            delete basicUserData.role;
            
            response = await fetch(
               `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user._id}`,
               {
                  method: 'PUT',
                  headers: {
                     'Content-Type': 'application/json',
                     Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                  credentials: 'include',
                  body: JSON.stringify(basicUserData),
               }
            );

            if (!response.ok) {
               throw new Error('Failed to update user information');
            }

            // If role/organization is being updated, make separate call to role assignment endpoint
            if (selectedOrganization && selectedRole) {
               console.log('Updating user role - Organization ID:', selectedOrganization, 'Role:', selectedRole);
               const roleResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user._id}/roles`,
                  {
                     method: 'POST',
                     headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                     },
                     credentials: 'include',
                     body: JSON.stringify({
                        organizationId: selectedOrganization,
                        roleName: selectedRole,
                     }),
                  }
               );

               if (!roleResponse.ok) {
                  const roleErrorText = await roleResponse.text();
                  console.error('Role assignment failed:', roleResponse.status, roleErrorText);
                  throw new Error('Failed to update user role: ' + roleErrorText);
               } else {
                  console.log('Role assignment successful');
               }
            } else if (user) {
               console.log('No role/organization selected for update');
            }
         } else {
            // Create new user (existing logic works fine)
            response = await fetch(
               `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`,
               {
                  method: 'POST',
                  headers: {
                     'Content-Type': 'application/json',
                     Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                  credentials: 'include',
                  body: JSON.stringify(userData),
               }
            );
         }

         if (response.ok) {
            let savedUser;
            
            if (user) {
               // For user updates, we need to fetch the updated user data since we made separate API calls
               console.log('Fetching updated user data after role assignment...');
               const updatedUserResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user._id}`,
                  {
                     method: 'GET',
                     headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                     },
                     credentials: 'include',
                  }
               );
               
               if (updatedUserResponse.ok) {
                  savedUser = await updatedUserResponse.json();
                  console.log('Fetched updated user:', savedUser);
               } else {
                  // Fallback to original user data if fetch fails
                  savedUser = user;
                  console.warn('Failed to fetch updated user data, using original');
               }
            } else {
               // For new users, use the response from the create endpoint
               savedUser = await response.json();
               console.log('API Response for new user:', savedUser);
            }

            // Ensure both _id and id are present for compatibility
            if (savedUser._id && !savedUser.id) {
               savedUser.id = savedUser._id;
            } else if (savedUser.id && !savedUser._id) {
               savedUser._id = savedUser.id;
            }

            console.log('Processed user:', savedUser); // Debug log
            onSave(savedUser, !!user);
         } else {
            console.log('API Error Response Status:', response.status);
            const errorText = await response.text();
            console.log('API Error Response:', errorText);

            let error;
            try {
               error = JSON.parse(errorText);
            } catch {
               error = { message: errorText || 'Unknown error' };
            }

            toast.error(
               user ? 'Failed to update user' : 'Failed to create user',
               error.message ||
                  `HTTP ${response.status}: ${response.statusText}`
            );
         }
      } catch (error) {
         console.error('Error saving user:', error);
         toast.error(
            user ? 'Failed to update user' : 'Failed to create user',
            'An unexpected error occurred'
         );
      } finally {
         setLoading(false);
      }
   };

   // Reset form when user changes or modal opens/closes
   React.useEffect(() => {
      if (isOpen) {
         setFormData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            city: user?.city || '',
            state: user?.state || '',
            country: user?.country || '',
            verified: user?.verified || false,
         });
         
         // Set current role and organization if editing an existing user
         if (user && user.organizations && user.organizations.length > 0) {
            const currentOrg = user.organizations[0]; // Use first organization
            console.log('Setting initial values for edit - currentOrg:', currentOrg);
            
            // Extract organization ID - it could be a string or an object
            const orgId = typeof currentOrg.organization === 'string' 
               ? currentOrg.organization 
               : currentOrg.organization?._id || '';
            
            // Extract role name - it could be a string or an object
            const roleName = typeof currentOrg.role === 'string' 
               ? currentOrg.role 
               : currentOrg.role?.name || '';
            
            console.log('Extracted orgId:', orgId, 'roleName:', roleName);
            setSelectedOrganization(orgId);
            setSelectedRole(roleName);
         } else {
            console.log('No organizations found for user, clearing selections');
            setSelectedRole('');
            setSelectedOrganization('');
         }
      }
   }, [user, isOpen]);

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title={user ? 'Edit User' : 'Create User'}
         maxWidth="2xl"
      >
         <form onSubmit={handleSubmit}>
            <ModalBody className="space-y-6">
               {/* Basic Info */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700">
                        Full Name *
                     </label>
                     <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                           setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                           }))
                        }
                        required
                        className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700">
                        Email Address *
                     </label>
                     <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                           setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                           }))
                        }
                        required
                        className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700">
                     Phone Number
                  </label>
                  <input
                     type="tel"
                     value={formData.phone}
                     onChange={(e) =>
                        setFormData((prev) => ({
                           ...prev,
                           phone: e.target.value,
                        }))
                     }
                     className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
               </div>

               {/* Address Info */}
               <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">
                     Address Information
                  </h4>

                  <div>
                     <label className="block text-sm font-medium text-gray-700">
                        Street Address
                     </label>
                     <textarea
                        value={formData.address}
                        onChange={(e) =>
                           setFormData((prev) => ({
                              ...prev,
                              address: e.target.value,
                           }))
                        }
                        rows={2}
                        className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                     />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">
                           City
                        </label>
                        <input
                           type="text"
                           value={formData.city}
                           onChange={(e) =>
                              setFormData((prev) => ({
                                 ...prev,
                                 city: e.target.value,
                              }))
                           }
                           className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700">
                           State/Province
                        </label>
                        <input
                           type="text"
                           value={formData.state}
                           onChange={(e) =>
                              setFormData((prev) => ({
                                 ...prev,
                                 state: e.target.value,
                              }))
                           }
                           className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700">
                           Country
                        </label>
                        <input
                           type="text"
                           value={formData.country}
                           onChange={(e) =>
                              setFormData((prev) => ({
                                 ...prev,
                                 country: e.target.value,
                              }))
                           }
                           className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                     </div>
                  </div>
               </div>

               {/* Status */}
               <div>
                  <label className="flex items-center">
                     <input
                        type="checkbox"
                        checked={formData.verified}
                        onChange={(e) =>
                           setFormData((prev) => ({
                              ...prev,
                              verified: e.target.checked,
                           }))
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-900">
                        User is verified
                     </span>
                  </label>
               </div>

               {/* Organization and Role Assignment - Show for users with permission */}
               {hasPermission('users.assign_role') && (
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">
                           Organization *
                        </label>
                        <select
                           value={selectedOrganization}
                           onChange={(e) => setSelectedOrganization(e.target.value)}
                           required
                           className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                           <option value="">Select organization...</option>
                           {organizations.map((org) => (
                              <option key={org._id} value={org._id}>
                                 {org.name} ({org.type})
                              </option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700">
                           User Role *
                        </label>
                     <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 text-base rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                     >
                        <option value="">Select role...</option>
                        {getFilteredRoles().map((role) => (
                           <option key={role.name} value={role.name}>
                              {role.displayName} - {role.description}
                           </option>
                        ))}
                     </select>
                     {selectedOrganization && (
                        <p className="mt-1 text-sm text-gray-500">
                           Role will be assigned in: {organizations.find(org => org._id === selectedOrganization)?.name}
                        </p>
                     )}
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
               <button
                  type="submit"
                  disabled={
                     loading ||
                     !formData.name ||
                     !formData.email
                  }
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F5821F] hover:bg-[#e0741c] disabled:bg-gray-300 disabled:cursor-not-allowed"
               >
                  {user ? 'Update' : 'Create'} User
               </button>
            </ModalFooter>
         </form>
      </Modal>
   );
}
