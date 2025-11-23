'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import { PermissionGate } from '@/components/PermissionGate';
import {
   Column,
   ActionCell,
   IconButton,
   StatusBadge,
} from '@/components/DataTable';
import Button from '@/components/Button';
import UnionModal from '@/components/UnionModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';
import { UnionService } from '@/lib/unionService';
import { Union } from '@/types/hierarchy';
import { Conference } from '@/types/rbac';
import {
   BuildingOfficeIcon,
   PencilIcon,
   TrashIcon,
   MapPinIcon,
   PhoneIcon,
   EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default function Unions() {
   const [unions, setUnions] = useState<Union[]>([]);
   const [unionConferences, setUnionConferences] = useState<Record<string, Conference[]>>({});
   const [loading, setLoading] = useState(true);
   const [selectedUnion, setSelectedUnion] = useState<Union | undefined>(
      undefined
   );
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [unionToDelete, setUnionToDelete] = useState<Union | undefined>(
      undefined
   );
   const [searchQuery, setSearchQuery] = useState('');
   const [showInactive, setShowInactive] = useState(false);
   const toast = useToast();

   const fetchUnions = useCallback(async () => {
      try {
         setLoading(true);
         const response = await UnionService.getAllUnions({
            isActive: showInactive ? false : true
         });

         if (response && response.success) {
            // Handle successful response with data
            const unions = response.data || [];
            const unionsArray = Array.isArray(unions) ? unions : [];
            setUnions(unionsArray);
            
            // Fetch conferences for each union
            const conferencesData: Record<string, Conference[]> = {};
            for (const union of unionsArray) {
               try {
                  const conferenceResponse = await UnionService.getUnionConferences(union._id);
                  if (conferenceResponse.success && conferenceResponse.data) {
                     conferencesData[union._id] = conferenceResponse.data as Conference[];
                  } else {
                     conferencesData[union._id] = [];
                  }
               } catch (error) {
                  console.error(`Error fetching conferences for union ${union._id}:`, error);
                  conferencesData[union._id] = [];
               }
            }
            setUnionConferences(conferencesData);
         } else if (response && response.success === false) {
            // Handle API error response
            console.error('API error fetching unions:', response.message);
            const errorMsg = response.message || 'Failed to fetch unions';
            if (!errorMsg.toLowerCase().includes('no unions found')) {
               toast.error('Failed to load unions', errorMsg);
            }
            setUnions([]);
            setUnionConferences({});
         } else {
            // Handle unexpected response format
            console.error('Unexpected response format:', response);
            setUnions([]);
            setUnionConferences({});
         }
      } catch (error) {
         console.error('Error fetching unions:', error);
         const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
         // Only show toast error if it's not a network/timeout issue
         if (!errorMessage.toLowerCase().includes('fetch')) {
            toast.error('Failed to load unions', errorMessage);
         }
         setUnions([]);
         setUnionConferences({});
      } finally {
         setLoading(false);
      }
   }, [toast, showInactive]);

   useEffect(() => {
      fetchUnions();
   }, [fetchUnions]);

   const handleDeleteUnion = async (union: Union) => {
      try {
         const response = await UnionService.deleteUnion(
            union._id
         );

         if (response.success) {
            setUnions((prev) =>
               prev.filter((u) => u._id !== union._id)
            );
            toast.success(
               'Union deleted',
               `${union.name} has been successfully removed.`
            );
         } else {
            toast.error('Failed to delete union', response.message);
         }
      } catch (error) {
         console.error('Error deleting union:', error);
         toast.error(
            'Failed to delete union',
            'An unexpected error occurred'
         );
      } finally {
         setShowDeleteConfirm(false);
         setUnionToDelete(undefined);
      }
   };

   const handleUnionSaved = (
      savedUnion: Union,
      isEdit: boolean
   ) => {
      if (isEdit) {
         // Update existing union in the list
         setUnions((prev) =>
            prev.map((union) =>
               union._id === savedUnion._id ? savedUnion : union
            )
         );
         toast.success(
            'Union updated',
            `${savedUnion.name} has been successfully updated.`
         );
      } else {
         // Add new union to the list
         setUnions((prev) => [...prev, savedUnion]);
         toast.success(
            'Union created',
            `${savedUnion.name} has been successfully created.`
         );
      }

      // Close modals and clear state
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedUnion(undefined);
   };

   // Removed quick setup functionality for unions page

   const filteredUnions = (unions || []).filter(
      (union) => {
         if (!union) return false;
         
         const searchLower = searchQuery.toLowerCase();
         
         // If no search query, return all unions
         if (!searchQuery.trim()) return true;
         
         // Check basic fields
         if (union.name?.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         // Check contact email with null safety
         if (union.contact?.email?.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         // Check territory description with null safety
         if (union.territory?.description?.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         return false;
      }
   );


   // Define table columns
   const columns: Column<Union>[] = [
      {
         key: 'name',
         header: 'Union',
         accessor: (union) => (
            <div className="flex items-center">
               <div className="shrink-0 h-12 w-12">
                  {union.primaryImage?.url ? (
                     <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        <Image
                           src={union.primaryImage.thumbnailUrl || union.primaryImage.url}
                           alt={union.primaryImage.alt || union.name}
                           width={96}
                           height={96}
                           className="h-full w-full object-cover"
                           style={{ imageRendering: 'auto' }}
                           priority={false}
                           quality={95}
                           onError={() => {
                              console.warn(`Failed to load image for union: ${union.name}`);
                           }}
                        />
                     </div>
                  ) : (
                     <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm">
                        <BuildingOfficeIcon className="h-7 w-7 text-white" />
                     </div>
                  )}
               </div>
               <div className="ml-4">
                  <button
                     onClick={() => window.location.href = `/unions/${union._id}`}
                     className="text-sm font-medium text-indigo-600 hover:text-indigo-900 text-left cursor-pointer"
                  >
                     {union.name}
                  </button>
               </div>
            </div>
         ),
      },
      {
         key: 'territory',
         header: 'Territory',
         accessor: (union) => (
            <div className="text-sm text-gray-900">
               {union?.territory?.description || '-'}
            </div>
         ),
         className: 'max-w-xs',
      },
      {
         key: 'contact',
         header: 'Contact',
         accessor: (union) => (
            <div className="text-sm text-gray-900">
               {union.contact?.email && (
                  <div className="flex items-center mb-1">
                     <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                     {union.contact.email}
                  </div>
               )}
               {union.contact?.phone && (
                  <div className="flex items-center">
                     <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                     {union.contact.phone}
                  </div>
               )}
            </div>
         ),
      },
      {
         key: 'headquarters',
         header: 'Headquarters',
         accessor: (union) => (
            <div className="text-sm text-gray-900">
               {union.headquarters?.city || union.headquarters?.country ? (
                  <div className="flex items-start">
                     <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-1 shrink-0" />
                     <div>
                        {union.headquarters?.city && (
                           <div>{union.headquarters.city}</div>
                        )}
                        {union.headquarters?.country && (
                           <div className="text-gray-500">{union.headquarters.country}</div>
                        )}
                     </div>
                  </div>
               ) : (
                  '-'
               )}
            </div>
         ),
         className: 'max-w-xs',
      },
      {
         key: 'conferences',
         header: 'Conferences',
         accessor: (union) => {
            const conferences = unionConferences[union._id] || [];
            return (
               <div className="text-sm text-gray-900">
                  {conferences.length > 0 ? (
                     <div className="space-y-1">
                        {conferences.slice(0, 3).map((conference) => (
                           <div key={conference._id} className="flex items-center">
                              <span className="text-gray-900">{conference.name}</span>
                              {!conference.isActive && (
                                 <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                                    Inactive
                                 </span>
                              )}
                           </div>
                        ))}
                        {conferences.length > 3 && (
                           <div className="text-xs text-gray-500">
                              +{conferences.length - 3} more
                           </div>
                        )}
                     </div>
                  ) : (
                     <span className="text-gray-400">No conferences</span>
                  )}
               </div>
            );
         },
         className: 'max-w-xs',
      },
      {
         key: 'status',
         header: 'Status',
         accessor: (union) => (
            <StatusBadge
               status={union.isActive}
               trueLabel="Active"
               falseLabel="Inactive"
               trueColor="green"
               falseColor="red"
            />
         ),
      },
      {
         key: 'actions',
         header: 'Actions',
         headerClassName:
            'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
         className:
            'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
         accessor: (union) => (
            <ActionCell>
               <PermissionGate permission="unions.update">
                  <IconButton
                     onClick={() => {
                        setSelectedUnion(union);
                        setShowEditModal(true);
                     }}
                     title="Edit Union"
                     icon={<PencilIcon className="h-5 w-5" />}
                  />
               </PermissionGate>

               {/* Quick Setup removed for unions - use conferences page to create conferences */}

               <PermissionGate permission="unions.delete">
                  <IconButton
                     onClick={() => {
                        setUnionToDelete(union);
                        setShowDeleteConfirm(true);
                     }}
                     title="Delete Union"
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
         title="Unions"
         description="Manage unions in the denominational hierarchy"
      >
         <div className="space-y-6">
            {/* Table with custom header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
               {/* Custom header with search and button */}
               <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="max-w-xs">
                           <input
                              type="text"
                              placeholder="Search unions..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                           />
                        </div>
                        <div className="flex items-center">
                           <label className="inline-flex items-center">
                              <input
                                 type="checkbox"
                                 checked={showInactive}
                                 onChange={(e) => setShowInactive(e.target.checked)}
                                 className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Show inactive</span>
                           </label>
                        </div>
                     </div>
                     <PermissionGate permission="unions.create">
                        <Button
                           onClick={() => setShowCreateModal(true)}
                           className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white"
                           size="sm"
                        >
                           Add Union
                        </Button>
                     </PermissionGate>
                  </div>
               </div>

               {/* Table content */}
               <div className="overflow-x-auto">
                  {loading ? (
                     <div className="px-4 py-5 text-center">
                        <p className="text-gray-500">Loading...</p>
                     </div>
                  ) : filteredUnions.length === 0 ? (
                     <div className="px-4 py-8 text-center">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                           <BuildingOfficeIcon />
                        </div>
                        <p className="text-sm text-gray-500">
                           No unions found
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
                           {filteredUnions.map((item) => (
                              <tr key={item?._id || Math.random()} className="hover:bg-gray-50">
                                 {columns.map((column) => (
                                    <td
                                       key={column.key}
                                       className={
                                          column.className ||
                                          'px-6 py-4 whitespace-nowrap text-sm'
                                       }
                                    >
                                       {item ? column.accessor(item) : '-'}
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
            <UnionModal
               isOpen={showCreateModal || showEditModal}
               onClose={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedUnion(undefined);
               }}
               onSave={handleUnionSaved}
               union={showEditModal ? selectedUnion : null}
            />

            {/* Quick Setup Modal removed for unions page */}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
               isOpen={showDeleteConfirm}
               onClose={() => {
                  setShowDeleteConfirm(false);
                  setUnionToDelete(undefined);
               }}
               onConfirm={() =>
                  unionToDelete && handleDeleteUnion(unionToDelete)
               }
               title="Delete Union"
               message={`Are you sure you want to delete "${unionToDelete?.name}"? This action cannot be undone.`}
               confirmLabel="Delete Union"
               confirmButtonColor="red"
               icon={<TrashIcon className="h-6 w-6 text-red-600" />}
            />
         </div>
      </AdminLayout>
   );
}
