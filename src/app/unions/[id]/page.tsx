'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import { StatusBadge } from '@/components/DataTable';
import { useToast } from '@/contexts/ToastContext';
import { UnionService } from '@/lib/unionService';
import { Union } from '@/types/hierarchy';
import {
   MapPinIcon,
   EnvelopeIcon,
   PhoneIcon,
   GlobeAltIcon,
   XMarkIcon,
} from '@heroicons/react/24/outline';

interface UnionDetails {
   union: Union;
   permissions: {
      canUpdate: boolean;
      canDelete: boolean;
      canManage: boolean;
   };
}

function UnionBannerImage({ union }: { union: Union }) {
   const [imageError, setImageError] = useState(false);

   if (!union.primaryImage?.url || imageError) {
      return <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600"></div>;
   }

   return (
      <Image
         src={union.primaryImage.url}
         alt={union.primaryImage.alt || union.name}
         fill
         className="object-cover opacity-50"
         priority
         onError={() => {
            console.error('Banner image failed to load:', union.primaryImage?.url);
            setImageError(true);
         }}
         onLoad={() => console.log('Banner image loaded successfully')}
      />
   );
}

export default function UnionDetailPage() {
   const params = useParams();
   const router = useRouter();
   const unionId = params?.id as string;

   const [unionData, setUnionData] = useState<UnionDetails | null>(null);
   const [loading, setLoading] = useState(true);
   const { error: showErrorToast } = useToast();

   const fetchUnionDetails = useCallback(async () => {
      try {
         setLoading(true);
         const response = await UnionService.getUnionById(unionId);
         
         if (response.success && response.data) {
            setUnionData({
               union: response.data,
               permissions: {
                  canUpdate: true,
                  canDelete: true,
                  canManage: true,
               }
            });
         } else {
            throw new Error(response.message || 'Failed to fetch union details');
         }
      } catch (error) {
         console.error('Failed to fetch union details:', error);
         showErrorToast('Failed to load union details');
         router.push('/unions');
      } finally {
         setLoading(false);
      }
   }, [unionId, router, showErrorToast]);

   useEffect(() => {
      fetchUnionDetails();
   }, [fetchUnionDetails]);

   if (loading) {
      return (
         <AdminLayout title="Loading..." description="Please wait">
            <div className="flex items-center justify-center h-64">
               <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                     Loading union details...
                  </p>
               </div>
            </div>
         </AdminLayout>
      );
   }

   if (!unionData) {
      return (
         <AdminLayout
            title="Union Not Found"
            description="The requested union could not be found"
         >
            <div className="text-center py-12">
               <p className="text-gray-600 mb-4">
                  The union you&apos;re looking for doesn&apos;t exist or has
                  been removed.
               </p>
               <Button
                  variant="primary"
                  onClick={() => router.push('/unions')}
               >
                  Back to Unions
               </Button>
            </div>
         </AdminLayout>
      );
   }

   const { union } = unionData;

   return (
      <AdminLayout
         title={union.name}
         description={`Union • ${union.territory?.description || 'No territory specified'}`}
         hideTitle={true}
         hideHeader={true}
      >
         {/* Hero Banner Section */}
         <div className="relative h-80 md:h-96 bg-gray-900 -mx-6 -mt-6">
            <UnionBannerImage union={union} />

            {/* User Profile Overlay */}
            <div className="absolute top-8 right-4 z-20">
               <div className="flex items-center space-x-4">
                  {/* User Profile */}
                  <div className="flex items-center space-x-3">
                     <div className="text-right">
                        <p className="text-sm font-medium text-white drop-shadow-lg">
                           Bemee
                        </p>
                        <p className="text-xs text-white/90 drop-shadow-lg">
                           bem@gyocc.org
                        </p>
                     </div>

                     <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: '#454545' }}
                     >
                        <span className="text-white text-sm font-medium">
                           B
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 flex items-end">
               <div className="w-full p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="max-w-6xl mx-auto">
                     <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                           <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                              Union
                           </span>
                           <StatusBadge
                              status={union.isActive}
                              trueLabel="Active"
                              falseLabel="Inactive"
                              trueColor="green"
                              falseColor="red"
                           />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                           {union.name}
                        </h1>
                        <p className="text-lg text-gray-200">
                           {union.territory?.description || 'No territory description'}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Back Button */}
            <button
               onClick={() => router.push('/unions')}
               className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
               <XMarkIcon className="h-6 w-6" />
            </button>
         </div>

         <div className="mt-8">
            {/* Main Content Container */}
            <div className="max-w-6xl mx-auto">
               {/* Territory Description Section */}
               {union.territory?.description && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
                        {union.territory.description}
                     </p>
                  </div>
               )}

               {/* Union Details Section */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                     Union Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Headquarters Information */}
                     {union.headquarters && (
                        <div>
                           <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                              Headquarters
                           </h3>
                           <div className="space-y-2">
                              {union.headquarters.address && (
                                 <p className="text-gray-600">{union.headquarters.address}</p>
                              )}
                              <div className="text-gray-600">
                                 {union.headquarters.city && (
                                    <span>{union.headquarters.city}</span>
                                 )}
                                 {union.headquarters.state && (
                                    <span>{union.headquarters.city ? ', ' : ''}{union.headquarters.state}</span>
                                 )}
                                 {union.headquarters.postalCode && (
                                    <span> {union.headquarters.postalCode}</span>
                                 )}
                              </div>
                              {union.headquarters.country && (
                                 <p className="text-gray-600">{union.headquarters.country}</p>
                              )}
                           </div>
                        </div>
                     )}

                     {/* Contact Information */}
                     {union.contact && (
                        <div>
                           <h3 className="font-semibold text-gray-900 mb-4">
                              Contact Information
                           </h3>
                           <div className="space-y-3">
                              {union.contact.email && (
                                 <div className="flex items-center text-gray-600">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={`mailto:${union.contact.email}`}
                                       className="hover:text-purple-600 transition-colors"
                                    >
                                       {union.contact.email}
                                    </a>
                                 </div>
                              )}
                              {union.contact.phone && (
                                 <div className="flex items-center text-gray-600">
                                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={`tel:${union.contact.phone}`}
                                       className="hover:text-purple-600 transition-colors"
                                    >
                                       {union.contact.phone}
                                    </a>
                                 </div>
                              )}
                              {union.contact.website && (
                                 <div className="flex items-center text-gray-600">
                                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={union.contact.website}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="hover:text-purple-600 transition-colors"
                                    >
                                       {union.contact.website}
                                    </a>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* Statistics Section */}
               {union.statistics && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Statistics
                     </h2>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                           <div className="text-3xl font-bold text-purple-600">
                              {union.statistics.conferences || 0}
                           </div>
                           <div className="text-sm text-gray-600">Conferences</div>
                        </div>
                        <div className="text-center">
                           <div className="text-3xl font-bold text-purple-600">
                              {union.statistics.churches || 0}
                           </div>
                           <div className="text-sm text-gray-600">Churches</div>
                        </div>
                        <div className="text-center">
                           <div className="text-3xl font-bold text-purple-600">
                              {union.statistics.teams || 0}
                           </div>
                           <div className="text-sm text-gray-600">Teams</div>
                        </div>
                        <div className="text-center">
                           <div className="text-3xl font-bold text-purple-600">
                              {union.statistics.services || 0}
                           </div>
                           <div className="text-sm text-gray-600">Services</div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Metadata Section */}
               {union.metadata && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Additional Information
                     </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {union.metadata.membershipCount !== undefined && (
                           <div className="flex justify-between">
                              <span className="text-gray-600">Membership Count:</span>
                              <span className="font-medium">{union.metadata.membershipCount}</span>
                           </div>
                        )}
                        {union.metadata.churchCount !== undefined && (
                           <div className="flex justify-between">
                              <span className="text-gray-600">Church Count:</span>
                              <span className="font-medium">{union.metadata.churchCount}</span>
                           </div>
                        )}
                        {union.metadata.territory && union.metadata.territory.length > 0 && (
                           <div className="md:col-span-2">
                              <span className="text-gray-600">Territory Coverage:</span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                 {union.metadata.territory.map((territory, index) => (
                                    <span
                                       key={index}
                                       className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                                    >
                                       {territory}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}
                        {union.metadata.lastUpdated && (
                           <div className="md:col-span-2 flex justify-between text-sm text-gray-500">
                              <span>Last Updated:</span>
                              <span>{new Date(union.metadata.lastUpdated).toLocaleDateString()}</span>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* System Information Section */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                     System Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="text-gray-600">Union ID:</span>
                           <span className="font-mono text-sm">{union._id}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Hierarchy Level:</span>
                           <span className="font-medium">{union.hierarchyLevel}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Hierarchy Path:</span>
                           <span className="font-mono text-sm">{union.hierarchyPath}</span>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="text-gray-600">Created:</span>
                           <span className="text-sm">{new Date(union.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Last Updated:</span>
                           <span className="text-sm">{new Date(union.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {union.childCount !== undefined && (
                           <div className="flex justify-between">
                              <span className="text-gray-600">Child Entities:</span>
                              <span className="font-medium">{union.childCount}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </AdminLayout>
   );
}