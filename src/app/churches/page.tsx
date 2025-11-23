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
import ChurchModal from '@/components/ChurchModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';
import { ChurchService } from '@/lib/churchService';
import { teamService } from '@/lib/teams';
import { Church } from '@/types/hierarchy';
import { Conference } from '@/types/rbac';
import {
   BuildingLibraryIcon,
   PencilIcon,
   TrashIcon,
   MapPinIcon,
   PhoneIcon,
   EnvelopeIcon,
   UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function Churches() {
   const [churches, setChurches] = useState<Church[]>([]);
   const [conferences, setConferences] = useState<Conference[]>([]);
   const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});
   const [loading, setLoading] = useState(true);
   const [selectedChurch, setSelectedChurch] = useState<Church | undefined>(
      undefined
   );
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [churchToDelete, setChurchToDelete] = useState<Church | undefined>(
      undefined
   );
   const [searchQuery, setSearchQuery] = useState('');
   const [showInactive, setShowInactive] = useState(false);
   const toast = useToast();

   const fetchTeamCounts = useCallback(async (churches: Church[]) => {
      const counts: Record<string, number> = {};
      
      try {
         await Promise.all(
            churches.map(async (church) => {
               if (church._id) {
                  try {
                     const response = await teamService.getOrganizationTeams(church._id, {
                        includeInactive: false
                     });
                     counts[church._id] = response.data?.length || 0;
                  } catch (error) {
                     console.warn(`Failed to fetch team count for church ${church._id}:`, error);
                     counts[church._id] = 0;
                  }
               }
            })
         );
         setTeamCounts(counts);
      } catch (error) {
         console.error('Error fetching team counts:', error);
      }
   }, []);

   const fetchChurches = useCallback(async () => {
      try {
         setLoading(true);
         const response = await ChurchService.getAllChurches({
            isActive: showInactive ? false : true
         });

         if (response && response.success) {
            // Handle successful response with data
            const churches = response.data || [];
            const churchesArray = Array.isArray(churches) ? churches : [];
            
            // Debug: Log initial church data
            console.log('Initial churches from getAllChurches:', churchesArray.map(c => ({
               id: c._id,
               name: c.name,
               hasPrimaryImage: !!c.primaryImage,
               primaryImageUrl: c.primaryImage?.url
            })));
            
            // Fetch complete church data for churches missing primaryImage
            const enrichedChurches = await Promise.all(
               churchesArray.map(async (church) => {
                  // If church doesn't have primaryImage data, fetch complete details
                  if (!church.primaryImage && church._id) {
                     console.log(`Fetching complete data for church: ${church.name} (${church._id})`);
                     try {
                        const detailedChurch = await ChurchService.getChurchById(church._id);
                        if (detailedChurch.success && detailedChurch.data) {
                           console.log(`Got detailed data for ${church.name}:`, {
                              hasPrimaryImage: !!detailedChurch.data.primaryImage,
                              primaryImageUrl: detailedChurch.data.primaryImage?.url,
                              primaryImageData: detailedChurch.data.primaryImage
                           });
                           return detailedChurch.data;
                        }
                     } catch (error) {
                        console.warn(`Failed to fetch details for church ${church._id}:`, error);
                     }
                  }
                  return church;
               })
            );
            
            // Debug: Log final enriched church data
            console.log('Final enriched churches:', enrichedChurches.map(c => ({
               id: c._id,
               name: c.name,
               hasPrimaryImage: !!c.primaryImage,
               primaryImageUrl: c.primaryImage?.url
            })));
            
            setChurches(enrichedChurches);
            
            // Extract unique conferences from churches
            const conferenceMap = new Map<string, Conference>();
            enrichedChurches
               .filter(church => church.conferenceId && typeof church.conferenceId === 'object')
               .forEach(church => {
                  const conf = church.conferenceId as unknown as Conference;
                  if (conf && typeof conf === 'object' && conf._id) {
                     conferenceMap.set(conf._id, conf);
                  }
               });
            setConferences(Array.from(conferenceMap.values()));
            
            // Fetch team counts for all churches
            fetchTeamCounts(enrichedChurches);
         } else if (response && response.success === false) {
            // Handle API error response
            console.error('API error fetching churches:', response.message);
            const errorMsg = response.message || 'Failed to fetch churches';
            if (!errorMsg.toLowerCase().includes('no churches found')) {
               toast.error('Failed to load churches', errorMsg);
            }
            setChurches([]);
            setConferences([]);
         } else {
            // Handle unexpected response format
            console.error('Unexpected response format:', response);
            setChurches([]);
            setConferences([]);
         }
      } catch (error) {
         console.error('Error fetching churches:', error);
         const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
         // Only show toast error if it's not a network/timeout issue
         if (!errorMessage.toLowerCase().includes('fetch')) {
            toast.error('Failed to load churches', errorMessage);
         }
         setChurches([]);
         setConferences([]);
      } finally {
         setLoading(false);
      }
   }, [toast, showInactive, fetchTeamCounts]);

   useEffect(() => {
      fetchChurches();
   }, [fetchChurches]);

   const handleDeleteChurch = async (church: Church) => {
      try {
         const response = await ChurchService.deleteChurch(
            church._id
         );

         if (response.success) {
            setChurches((prev) =>
               prev.filter((c) => c._id !== church._id)
            );
            toast.success(
               'Church deleted',
               `${church.name} has been successfully removed.`
            );
         } else {
            toast.error('Failed to delete church', response.message);
         }
      } catch (error) {
         console.error('Error deleting church:', error);
         toast.error(
            'Failed to delete church',
            'An unexpected error occurred'
         );
      } finally {
         setShowDeleteConfirm(false);
         setChurchToDelete(undefined);
      }
   };

   const handleChurchSaved = async (
      savedChurch: Church,
      isEdit: boolean
   ) => {
      // Ensure we have complete church data including primaryImage
      let completeChurch = savedChurch;
      if (!savedChurch.primaryImage && savedChurch._id) {
         try {
            const detailedResponse = await ChurchService.getChurchById(savedChurch._id);
            if (detailedResponse.success && detailedResponse.data) {
               completeChurch = detailedResponse.data;
            }
         } catch (error) {
            console.warn(`Failed to fetch complete church data for ${savedChurch._id}:`, error);
         }
      }
      
      if (isEdit) {
         // Update existing church in the list
         setChurches((prev) =>
            prev.map((church) =>
               church._id === completeChurch._id ? completeChurch : church
            )
         );
         toast.success(
            'Church updated',
            `${completeChurch.name} has been successfully updated.`
         );
         // Refresh team count for the updated church
         fetchTeamCounts([completeChurch]);
      } else {
         // Add new church to the list
         const updatedChurches = [...churches, completeChurch];
         setChurches(updatedChurches);
         toast.success(
            'Church created',
            `${completeChurch.name} has been successfully created.`
         );
         // Fetch team count for the new church
         fetchTeamCounts([completeChurch]);
      }

      // Close modals and clear state
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedChurch(undefined);
   };

   const filteredChurches = (churches || []).filter(
      (church) => {
         if (!church) return false;
         
         const searchLower = searchQuery.toLowerCase();
         
         // If no search query, return all churches
         if (!searchQuery.trim()) return true;
         
         // Check church name
         if (church.name?.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         // Check contact email with null safety
         if (church.contact?.email?.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         // Check location city/state
         if (church.location?.address?.city?.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         if (church.location?.address?.state?.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         // Check conference name
         const conferenceName = typeof church.conferenceId === 'object' && church.conferenceId
            ? (church.conferenceId as Conference).name 
            : conferences.find(c => c._id === church.conferenceId)?.name || '';
         if (conferenceName.toLowerCase().includes(searchLower)) {
            return true;
         }
         
         // Check team count (convert to string for search)
         const teamCount = teamCounts[church._id] || 0;
         if (teamCount.toString().includes(searchQuery.trim())) {
            return true;
         }
         
         return false;
      }
   );

   // Define table columns
   const columns: Column<Church>[] = [
      {
         key: 'name',
         header: 'Church',
         accessor: (church) => (
            <div className="flex items-center">
               <div className="shrink-0 h-12 w-12">
                  {(() => {
                     console.log(`Rendering ${church.name}:`, {
                        hasPrimaryImage: !!church.primaryImage,
                        hasUrl: !!church.primaryImage?.url,
                        url: church.primaryImage?.url,
                        thumbnailUrl: church.primaryImage?.thumbnailUrl,
                        fullPrimaryImageData: church.primaryImage
                     });
                     return church.primaryImage?.url;
                  })() ? (
                     <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        <Image
                           src={church.primaryImage?.thumbnailUrl || church.primaryImage?.url || ''}
                           alt={church.primaryImage?.alt || church.name}
                           width={96}
                           height={96}
                           className="h-full w-full object-cover"
                           style={{ imageRendering: 'auto' }}
                           priority={false}
                           quality={95}
                           onError={() => {
                              console.warn(`Failed to load image for church: ${church.name}`, church.primaryImage);
                           }}
                        />
                     </div>
                  ) : (
                     <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
                        <BuildingLibraryIcon className="h-7 w-7 text-white" />
                     </div>
                  )}
               </div>
               <div className="ml-4">
                  <button
                     onClick={() => window.location.href = `/churches/${church._id}`}
                     className="text-sm font-medium text-indigo-600 hover:text-indigo-900 text-left cursor-pointer"
                  >
                     {church.name}
                  </button>
                  {church.code && (
                     <div className="text-xs text-gray-500">Code: {church.code}</div>
                  )}
               </div>
            </div>
         ),
      },
      {
         key: 'conference',
         header: 'Conference',
         accessor: (church) => {
            const conference = typeof church.conferenceId === 'object' 
               ? church.conferenceId 
               : conferences.find(c => c._id === church.conferenceId);
            
            return (
               <div className="text-sm text-gray-900">
                  {conference?.name || 'Unknown Conference'}
               </div>
            );
         },
         className: 'max-w-xs',
      },
      {
         key: 'location',
         header: 'Location',
         accessor: (church) => (
            <div className="text-sm text-gray-900">
               {church.location?.address?.city || church.location?.address?.state ? (
                  <div className="flex items-start">
                     <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-1 shrink-0" />
                     <div>
                        {church.location?.address?.city && (
                           <div>{church.location.address.city}</div>
                        )}
                        {church.location?.address?.state && (
                           <div className="text-gray-500">{church.location.address.state}</div>
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
         key: 'teams',
         header: 'Teams',
         accessor: (church) => {
            const teamCount = teamCounts[church._id] || 0;
            return (
               <div className="text-sm text-gray-900">
                  <div className="flex items-center">
                     <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                     <div>
                        <div className="font-medium">{teamCount}</div>
                        <div className="text-xs text-gray-500">
                           {teamCount === 1 ? 'team' : 'teams'}
                        </div>
                     </div>
                  </div>
               </div>
            );
         },
         className: 'max-w-xs',
      },
      {
         key: 'contact',
         header: 'Contact',
         accessor: (church) => (
            <div className="text-sm text-gray-900">
               {church.contact?.email && (
                  <div className="flex items-center mb-1">
                     <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                     {church.contact.email}
                  </div>
               )}
               {church.contact?.phone && (
                  <div className="flex items-center">
                     <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                     {church.contact.phone}
                  </div>
               )}
            </div>
         ),
      },
      {
         key: 'membership',
         header: 'Membership',
         accessor: (church) => (
            <div className="text-sm text-gray-900">
               {church.demographics?.membership?.total ? (
                  <div>
                     <div>{church.demographics.membership.total} members</div>
                     {church.demographics?.averageAttendance && (
                        <div className="text-xs text-gray-500">
                           Avg: {church.demographics.averageAttendance}
                        </div>
                     )}
                  </div>
               ) : (
                  <span className="text-gray-400">Not specified</span>
               )}
            </div>
         ),
         className: 'max-w-xs',
      },
      {
         key: 'status',
         header: 'Status',
         accessor: (church) => (
            <StatusBadge
               status={church.isActive}
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
         accessor: (church) => (
            <ActionCell>
               <PermissionGate permission="churches.update">
                  <IconButton
                     onClick={() => {
                        setSelectedChurch(church);
                        setShowEditModal(true);
                     }}
                     title="Edit Church"
                     icon={<PencilIcon className="h-5 w-5" />}
                  />
               </PermissionGate>

               <PermissionGate permission="churches.delete">
                  <IconButton
                     onClick={() => {
                        setChurchToDelete(church);
                        setShowDeleteConfirm(true);
                     }}
                     title="Delete Church"
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
         title="Churches"
         description="Manage churches in the denominational hierarchy"
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
                              placeholder="Search churches..."
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
                     <PermissionGate permission="churches.create">
                        <Button
                           onClick={() => setShowCreateModal(true)}
                           className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white"
                           size="sm"
                        >
                           Add Church
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
                  ) : filteredChurches.length === 0 ? (
                     <div className="px-4 py-8 text-center">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                           <BuildingLibraryIcon />
                        </div>
                        <p className="text-sm text-gray-500">
                           No churches found
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
                           {filteredChurches.map((item) => (
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
            <ChurchModal
               isOpen={showCreateModal || showEditModal}
               onClose={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedChurch(undefined);
               }}
               onSave={handleChurchSaved}
               church={showEditModal ? selectedChurch : null}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
               isOpen={showDeleteConfirm}
               onClose={() => {
                  setShowDeleteConfirm(false);
                  setChurchToDelete(undefined);
               }}
               onConfirm={() =>
                  churchToDelete && handleDeleteChurch(churchToDelete)
               }
               title="Delete Church"
               message={`Are you sure you want to delete "${churchToDelete?.name}"? This action cannot be undone.`}
               confirmLabel="Delete Church"
               confirmButtonColor="red"
               icon={<TrashIcon className="h-6 w-6 text-red-600" />}
            />
         </div>
      </AdminLayout>
   );
}