'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { PermissionGate } from '@/components/PermissionGate';
import {
   Column,
   ActionCell,
   IconButton,
   StatusBadge,
} from '@/components/DataTable';
import Button from '@/components/Button';
import OrganizationModal from '@/components/OrganizationModal';
import QuickSetupModal from '@/components/QuickSetupModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';
import { OrganizationService } from '@/lib/organizationService';
import {
   BuildingOfficeIcon,
   PencilIcon,
   TrashIcon,
   MapPinIcon,
   PhoneIcon,
   EnvelopeIcon,
   BoltIcon,
} from '@heroicons/react/24/outline';

// Mock organization type
interface Organization {
   _id: string;
   name: string;
   type: 'union' | 'conference' | 'church';
   parentOrganization?: {
      _id: string;
      name: string;
      type: string;
   };
   metadata: {
      address?: string;
      phone?: string;
      territory?: string[];
      email?: string;
   };
   isActive: boolean;
   createdAt: string;
   updatedAt: string;
   childCount?: number;
}

export default function Organizations() {
   const [organizations, setOrganizations] = useState<Organization[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedOrg, setSelectedOrg] = useState<Organization | undefined>(
      undefined
   );
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [showQuickSetupModal, setShowQuickSetupModal] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [orgToDelete, setOrgToDelete] = useState<Organization | undefined>(
      undefined
   );
   const [searchQuery, setSearchQuery] = useState('');
   const [quickSetupParent, setQuickSetupParent] = useState<
      Organization | undefined
   >(undefined);
   const toast = useToast();

   const fetchOrganizations = useCallback(async () => {
      try {
         setLoading(true);
         const response = await OrganizationService.getOrganizations();

         if (response.success && response.data) {
            setOrganizations(response.data);
         } else {
            console.error('Error fetching organizations:', response.message);
            toast.error('Failed to load organizations', response.message);
            setOrganizations([]);
         }
      } catch (error) {
         console.error('Error fetching organizations:', error);
         toast.error(
            'Failed to load organizations',
            'An unexpected error occurred'
         );
         setOrganizations([]);
      } finally {
         setLoading(false);
      }
   }, [toast]);

   useEffect(() => {
      fetchOrganizations();
   }, [fetchOrganizations]);

   const handleDeleteOrganization = async (organization: Organization) => {
      try {
         const response = await OrganizationService.deleteOrganization(
            organization._id
         );

         if (response.success) {
            setOrganizations((prev) =>
               prev.filter((org) => org._id !== organization._id)
            );
            toast.success(
               'Organization deleted',
               `${organization.name} has been successfully removed.`
            );
         } else {
            toast.error('Failed to delete organization', response.message);
         }
      } catch (error) {
         console.error('Error deleting organization:', error);
         toast.error(
            'Failed to delete organization',
            'An unexpected error occurred'
         );
      } finally {
         setShowDeleteConfirm(false);
         setOrgToDelete(undefined);
      }
   };

   const handleOrganizationSaved = (
      savedOrganization: Organization,
      isEdit: boolean
   ) => {
      if (isEdit) {
         // Update existing organization in the list
         setOrganizations((prev) =>
            prev.map((org) =>
               org._id === savedOrganization._id ? savedOrganization : org
            )
         );
         toast.success(
            'Organization updated',
            `${savedOrganization.name} has been successfully updated.`
         );
      } else {
         // Add new organization to the list
         setOrganizations((prev) => [...prev, savedOrganization]);
         toast.success(
            'Organization created',
            `${savedOrganization.name} has been successfully created.`
         );
      }

      // Close modals and clear state
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedOrg(undefined);
   };

   const handleQuickSetupSuccess = () => {
      // Refresh organizations list
      fetchOrganizations();
      setShowQuickSetupModal(false);
      setQuickSetupParent(undefined);
   };

   const filteredOrganizations = organizations.filter(
      (org) =>
         org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         org.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
         org.metadata.email?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const getTypeColor = (type: string) => {
      switch (type) {
         case 'union':
            return { bg: 'bg-purple-100', text: 'text-purple-800' };
         case 'conference':
            return { bg: 'bg-blue-100', text: 'text-blue-800' };
         case 'church':
            return { bg: 'bg-green-100', text: 'text-green-800' };
         default:
            return { bg: 'bg-gray-100', text: 'text-gray-800' };
      }
   };

   // Define table columns
   const columns: Column<Organization>[] = [
      {
         key: 'name',
         header: 'Organization',
         accessor: (org) => (
            <div className="flex items-center">
               <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                     <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
                  </div>
               </div>
               <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                     {org.name}
                  </div>
                  <div className="text-sm text-gray-500">
                     {org.parentOrganization
                        ? `Under ${org.parentOrganization.name}`
                        : 'Top Level'}
                  </div>
               </div>
            </div>
         ),
      },
      {
         key: 'type',
         header: 'Type',
         accessor: (org) => {
            const colors = getTypeColor(org.type);
            return (
               <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors.bg} ${colors.text}`}
               >
                  {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
               </span>
            );
         },
      },
      {
         key: 'contact',
         header: 'Contact',
         accessor: (org) => (
            <div className="text-sm text-gray-900">
               {org.metadata.email && (
                  <div className="flex items-center mb-1">
                     <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                     {org.metadata.email}
                  </div>
               )}
               {org.metadata.phone && (
                  <div className="flex items-center">
                     <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                     {org.metadata.phone}
                  </div>
               )}
            </div>
         ),
      },
      {
         key: 'location',
         header: 'Address',
         accessor: (org) => (
            <div className="text-sm text-gray-900">
               {org.metadata.address ? (
                  <div className="flex items-start">
                     <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                     <span>{org.metadata.address}</span>
                  </div>
               ) : (
                  '-'
               )}
            </div>
         ),
         className: 'max-w-xs',
      },
      {
         key: 'territory',
         header: 'Territory',
         accessor: (org) => (
            <div className="text-sm text-gray-900">
               {org.metadata.territory && org.metadata.territory.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                     {org.metadata.territory.map((territory, index) => (
                        <span
                           key={index}
                           className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                           {territory}
                        </span>
                     ))}
                  </div>
               ) : (
                  '-'
               )}
            </div>
         ),
         className: 'max-w-xs',
      },
      {
         key: 'children',
         header: 'Child Organizations',
         accessor: (org) => (
            <div className="text-sm text-gray-900">
               {(org.childCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                     {org.childCount}{' '}
                     {org.childCount === 1 ? 'child' : 'children'}
                  </span>
               ) : (
                  <span className="text-gray-400">None</span>
               )}
            </div>
         ),
      },
      {
         key: 'status',
         header: 'Status',
         accessor: (org) => (
            <StatusBadge
               status={org.isActive}
               trueLabel="Active"
               falseLabel="Inactive"
               trueColor="green"
               falseColor="red"
            />
         ),
      },
      {
         key: 'createdAt',
         header: 'Created',
         accessor: (org) => (
            <span className="text-sm text-gray-500">
               {new Date(org.createdAt).toLocaleDateString()}
            </span>
         ),
      },
      {
         key: 'actions',
         header: 'Actions',
         headerClassName:
            'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
         className:
            'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
         accessor: (org) => (
            <ActionCell>
               <PermissionGate permission="organizations.update">
                  <IconButton
                     onClick={() => {
                        setSelectedOrg(org);
                        setShowEditModal(true);
                     }}
                     title="Edit Organization"
                     icon={<PencilIcon className="h-5 w-5" />}
                  />
               </PermissionGate>

               {/* Quick Setup for child organizations */}
               {org.type !== 'church' && (
                  <PermissionGate permission="organizations.create">
                     <IconButton
                        onClick={() => {
                           setQuickSetupParent(org);
                           setShowQuickSetupModal(true);
                        }}
                        title={`Quick Setup ${
                           org.type === 'union' ? 'Conference' : 'Church'
                        }`}
                        icon={<BoltIcon className="h-5 w-5" />}
                        variant="default"
                     />
                  </PermissionGate>
               )}

               <PermissionGate permission="organizations.delete">
                  <IconButton
                     onClick={() => {
                        setOrgToDelete(org);
                        setShowDeleteConfirm(true);
                     }}
                     title="Delete Organization"
                     icon={<TrashIcon className="h-5 w-5" />}
                     variant="danger"
                  />
               </PermissionGate>
            </ActionCell>
         ),
      },
   ];

   return (
      <AdminLayout
         title="Organizations"
         description="Manage the organizational hierarchy"
      >
         <div className="space-y-6">
            {/* Table with custom header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
               {/* Custom header with search and button */}
               <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                     <div className="max-w-xs">
                        <input
                           type="text"
                           placeholder="Search organizations..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                        />
                     </div>
                     <PermissionGate permission="organizations.create">
                        <div className="flex items-center gap-2">
                           <Button
                              onClick={() => setShowQuickSetupModal(true)}
                              className="whitespace-nowrap bg-[#F5821F] hover:bg-[#e0741c] text-white"
                              size="sm"
                           >
                              Quick Setup
                           </Button>
                           <Button
                              onClick={() => setShowCreateModal(true)}
                              className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white"
                              size="sm"
                           >
                              Add Organization
                           </Button>
                        </div>
                     </PermissionGate>
                  </div>
               </div>

               {/* Table content */}
               <div className="overflow-x-auto">
                  {loading ? (
                     <div className="px-4 py-5 text-center">
                        <p className="text-gray-500">Loading...</p>
                     </div>
                  ) : filteredOrganizations.length === 0 ? (
                     <div className="px-4 py-8 text-center">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                           <BuildingOfficeIcon />
                        </div>
                        <p className="text-sm text-gray-500">
                           No organizations found
                        </p>
                     </div>
                  ) : (
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                           <tr>
                              {columns.map((column) => (
                                 <th
                                    key={column.key}
                                    scope="col"
                                    className={
                                       column.headerClassName ||
                                       'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                    }
                                 >
                                    {column.header}
                                 </th>
                              ))}
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {filteredOrganizations.map((item) => (
                              <tr key={item._id} className="hover:bg-gray-50">
                                 {columns.map((column) => (
                                    <td
                                       key={column.key}
                                       className={
                                          column.className ||
                                          'px-6 py-4 whitespace-nowrap text-sm'
                                       }
                                    >
                                       {column.accessor(item)}
                                    </td>
                                 ))}
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>

            {/* Create/Edit Modal */}
            <OrganizationModal
               isOpen={showCreateModal || showEditModal}
               onClose={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedOrg(undefined);
               }}
               onSave={handleOrganizationSaved}
               organization={showEditModal ? selectedOrg : null}
               organizations={organizations}
            />

            {/* Quick Setup Modal */}
            <QuickSetupModal
               isOpen={showQuickSetupModal}
               onClose={() => {
                  setShowQuickSetupModal(false);
                  setQuickSetupParent(undefined);
               }}
               parentOrganization={quickSetupParent}
               onSuccess={handleQuickSetupSuccess}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
               isOpen={showDeleteConfirm}
               onClose={() => {
                  setShowDeleteConfirm(false);
                  setOrgToDelete(undefined);
               }}
               onConfirm={() =>
                  orgToDelete && handleDeleteOrganization(orgToDelete)
               }
               title="Delete Organization"
               message={`Are you sure you want to delete "${orgToDelete?.name}"? This action cannot be undone.`}
               confirmLabel="Delete Organization"
               confirmButtonColor="red"
               icon={<TrashIcon className="h-6 w-6 text-red-600" />}
            />
         </div>
      </AdminLayout>
   );
}
