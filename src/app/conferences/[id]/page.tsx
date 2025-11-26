'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import { StatusBadge } from '@/components/DataTable';
import { useToast } from '@/contexts/ToastContext';
import { ConferenceService } from '@/lib/conferenceService';
import { Conference } from '@/types/rbac';
import {
   MapPinIcon,
   EnvelopeIcon,
   PhoneIcon,
   GlobeAltIcon,
   XMarkIcon,
} from '@heroicons/react/24/outline';

interface ConferenceDetails {
   conference: Conference;
   permissions: {
      canUpdate: boolean;
      canDelete: boolean;
      canManage: boolean;
   };
}

function ConferenceBannerImage({ conference }: { conference: Conference }) {
   const [imageError, setImageError] = useState(false);
   const conferenceName = conference.name || 'Conference Image';

   if (!conference.primaryImage?.url || imageError) {
      return <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600"></div>;
   }

   return (
      <Image
         src={conference.primaryImage.url}
         alt={conference.primaryImage.alt || conferenceName}
         fill
         className="object-cover opacity-50"
         priority
         onError={() => {
            console.error('Banner image failed to load:', conference.primaryImage?.url);
            setImageError(true);
         }}
         onLoad={() => console.log('Banner image loaded successfully')}
      />
   );
}

function safeRenderText(value: string | number | null | undefined | { name?: string; _id?: string }, fallback: string = 'N/A'): string {
   if (value === null || value === undefined) return fallback;
   if (typeof value === 'string') return value;
   if (typeof value === 'number') return value.toString();
   if (typeof value === 'object' && value.name) return String(value.name);
   if (typeof value === 'object' && value._id) return String(value._id);
   return fallback;
}

function safeRenderObject(obj: string | number | null | undefined | { name?: string; email?: string; phone?: string; _id?: string }): string {
   if (obj === null || obj === undefined) return 'N/A';
   if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
   if (typeof obj === 'object') {
      if (obj.name) return String(obj.name);
      if (obj.email) return String(obj.email);
      if (obj.phone) return String(obj.phone);
      if (obj._id) return String(obj._id);
      return JSON.stringify(obj);
   }
   return String(obj);
}

export default function ConferenceDetailPage() {
   const params = useParams();
   const router = useRouter();
   const conferenceId = params?.id as string;

   const [conferenceData, setConferenceData] = useState<ConferenceDetails | null>(null);
   const [loading, setLoading] = useState(true);
   const { error: showErrorToast } = useToast();

   const fetchConferenceDetails = useCallback(async () => {
      try {
         setLoading(true);
         const response = await ConferenceService.getConferenceById(conferenceId);
         
         if (response.success && response.data) {
            setConferenceData({
               conference: response.data,
               permissions: {
                  canUpdate: true,
                  canDelete: true,
                  canManage: true,
               }
            });
         } else {
            throw new Error(response.message || 'Failed to fetch conference details');
         }
      } catch (error) {
         console.error('Failed to fetch conference details:', error);
         showErrorToast('Failed to load conference details');
         router.push('/conferences');
      } finally {
         setLoading(false);
      }
   }, [conferenceId, router, showErrorToast]);

   useEffect(() => {
      fetchConferenceDetails();
   }, [fetchConferenceDetails]);

   if (loading) {
      return (
         <AdminLayout title="Loading..." description="Please wait">
            <div className="flex items-center justify-center h-64">
               <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                     Loading conference details...
                  </p>
               </div>
            </div>
         </AdminLayout>
      );
   }

   if (!conferenceData) {
      return (
         <AdminLayout
            title="Conference Not Found"
            description="The requested conference could not be found"
         >
            <div className="text-center py-12">
               <p className="text-gray-600 mb-4">
                  The conference you&apos;re looking for doesn&apos;t exist or has
                  been removed.
               </p>
               <Button
                  variant="primary"
                  onClick={() => router.push('/conferences')}
               >
                  Back to Conferences
               </Button>
            </div>
         </AdminLayout>
      );
   }

   const { conference } = conferenceData;
   const conferenceName = safeRenderText(conference.name, 'Unnamed Conference');
   const territoryDescription = safeRenderText(conference.territory?.description, 'No territory specified');
   
   return (
      <AdminLayout
         title={conferenceName}
         description={`Conference • ${territoryDescription}`}
         hideTitle={true}
         hideHeader={true}
      >
         {/* Hero Banner Section */}
         <div className="relative h-80 md:h-96 bg-gray-900 -mx-6 -mt-6">
            <ConferenceBannerImage conference={conference} />

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
                           <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                              Conference
                           </span>
                           <StatusBadge
                              status={conference.isActive}
                              trueLabel="Active"
                              falseLabel="Inactive"
                              trueColor="green"
                              falseColor="red"
                           />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                           {conferenceName}
                        </h1>
                        <p className="text-lg text-gray-200">
                           {territoryDescription}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Back Button */}
            <button
               onClick={() => router.push('/conferences')}
               className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
               <XMarkIcon className="h-6 w-6" />
            </button>
         </div>

         <div className="mt-8">
            {/* Main Content Container */}
            <div className="max-w-6xl mx-auto">
               {/* Territory Description Section */}
               {conference.territory?.description && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
                        {safeRenderText(conference.territory.description)}
                     </p>
                  </div>
               )}

               {/* Conference Details Section */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                     Conference Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Headquarters Information */}
                     {conference.headquarters && (
                        <div>
                           <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                              Headquarters
                           </h3>
                           <div className="space-y-2">
                              {conference.headquarters.address && (
                                 <p className="text-gray-600">{safeRenderText(conference.headquarters.address)}</p>
                              )}
                              <div className="text-gray-600">
                                 {conference.headquarters.city && (
                                    <span>{safeRenderText(conference.headquarters.city)}</span>
                                 )}
                                 {conference.headquarters.state && (
                                    <span>{conference.headquarters.city ? ', ' : ''}{safeRenderText(conference.headquarters.state)}</span>
                                 )}
                                 {conference.headquarters.postalCode && (
                                    <span> {safeRenderText(conference.headquarters.postalCode)}</span>
                                 )}
                              </div>
                              {conference.headquarters.country && (
                                 <p className="text-gray-600">{safeRenderText(conference.headquarters.country)}</p>
                              )}
                           </div>
                        </div>
                     )}

                     {/* Contact Information */}
                     {conference.contact && (
                        <div>
                           <h3 className="font-semibold text-gray-900 mb-4">
                              Contact Information
                           </h3>
                           <div className="space-y-3">
                              {conference.contact.email && (
                                 <div className="flex items-center text-gray-600">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={`mailto:${safeRenderText(conference.contact.email)}`}
                                       className="hover:text-blue-600 transition-colors"
                                    >
                                       {safeRenderText(conference.contact.email)}
                                    </a>
                                 </div>
                              )}
                              {conference.contact.phone && (
                                 <div className="flex items-center text-gray-600">
                                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={`tel:${safeRenderText(conference.contact.phone)}`}
                                       className="hover:text-blue-600 transition-colors"
                                    >
                                       {safeRenderText(conference.contact.phone)}
                                    </a>
                                 </div>
                              )}
                              {conference.contact.website && (
                                 <div className="flex items-center text-gray-600">
                                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={safeRenderText(conference.contact.website)}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="hover:text-blue-600 transition-colors"
                                    >
                                       {safeRenderText(conference.contact.website)}
                                    </a>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* Parent Union Section */}
               {conference.union && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Parent Union
                     </h2>
                     <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                           {safeRenderObject(conference.union)}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Union</div>
                     </div>
                  </div>
               )}


               {/* Additional Conference Details */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                     Additional Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Status Information */}
                     <div>
                        <h3 className="font-semibold text-gray-900 mb-4">
                           Conference Status
                        </h3>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-gray-600">Active Status:</span>
                              <StatusBadge
                                 status={conference.isActive}
                                 trueLabel="Active"
                                 falseLabel="Inactive"
                                 trueColor="green"
                                 falseColor="red"
                              />
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-600">Conference Type:</span>
                              <span className="font-medium">Conference</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-600">Hierarchy Level:</span>
                              <span className="font-medium">{safeRenderText(conference.hierarchyLevel)}</span>
                           </div>
                        </div>
                     </div>

                     {/* Metadata Information */}
                     {conference.metadata && (
                        <div>
                           <h3 className="font-semibold text-gray-900 mb-4">
                              Conference Metrics
                           </h3>
                           <div className="space-y-3">
                              {conference.metadata.churchCount !== undefined && (
                                 <div className="flex justify-between">
                                    <span className="text-gray-600">Churches:</span>
                                    <span className="font-medium">{safeRenderText(conference.metadata.churchCount, '0')}</span>
                                 </div>
                              )}
                              {conference.metadata.membershipCount !== undefined && (
                                 <div className="flex justify-between">
                                    <span className="text-gray-600">Total Members:</span>
                                    <span className="font-medium">{safeRenderText(conference.metadata.membershipCount, '0')}</span>
                                 </div>
                              )}
                              {conference.metadata.lastUpdated && (
                                 <div className="flex justify-between">
                                    <span className="text-gray-600">Last Updated:</span>
                                    <span className="text-sm">{new Date(conference.metadata.lastUpdated).toLocaleDateString()}</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
               </div>


               {/* Programs Section */}
               {conference.programs && Array.isArray(conference.programs) && conference.programs.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Programs & Services
                     </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {conference.programs.map((program, index) => (
                           <div key={index} className="border rounded-lg p-4">
                              <h3 className="font-semibold text-gray-900 mb-2">
                                 {safeRenderObject(program.name)}
                              </h3>
                              {program.type && (
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                                    {safeRenderText(program.type, '').replace(/_/g, ' ').toUpperCase()}
                                 </span>
                              )}
                              {program.description && (
                                 <p className="text-gray-600 text-sm mb-2">
                                    {safeRenderText(program.description)}
                                 </p>
                              )}
                              {program.director && (
                                 <p className="text-gray-600 text-sm">
                                    <span className="font-medium">Director:</span> {safeRenderObject(program.director)}
                                 </p>
                              )}
                              {program.contact && (
                                 <p className="text-gray-600 text-sm">
                                    <span className="font-medium">Contact:</span> {safeRenderObject(program.contact)}
                                 </p>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               )}



            </div>
         </div>
      </AdminLayout>
   );
}