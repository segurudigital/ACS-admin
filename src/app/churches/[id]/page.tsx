'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import { StatusBadge } from '@/components/DataTable';
import { useToast } from '@/contexts/ToastContext';
import { ChurchService } from '@/lib/churchService';
import { Church, Conference } from '@/types/hierarchy';
import {
   MapPinIcon,
   EnvelopeIcon,
   PhoneIcon,
   GlobeAltIcon,
   XMarkIcon,
   UserGroupIcon,
   ClockIcon,
   HomeIcon,
   ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ChurchDetails {
   church: Church;
   permissions: {
      canUpdate: boolean;
      canDelete: boolean;
      canManage: boolean;
   };
}

function ChurchBannerImage({ church }: { church: Church }) {
   const [imageError, setImageError] = useState(false);

   if (!church.primaryImage?.url || imageError) {
      return <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600"></div>;
   }

   return (
      <Image
         src={church.primaryImage.url}
         alt={church.primaryImage.alt || church.name}
         fill
         className="object-cover opacity-50"
         priority
         onError={() => {
            console.error('Banner image failed to load:', church.primaryImage?.url);
            setImageError(true);
         }}
         onLoad={() => console.log('Banner image loaded successfully')}
      />
   );
}

export default function ChurchDetailPage() {
   const params = useParams();
   const router = useRouter();
   const churchId = params?.id as string;

   const [churchData, setChurchData] = useState<ChurchDetails | null>(null);
   const [loading, setLoading] = useState(true);
   const { error: showErrorToast } = useToast();

   const fetchChurchDetails = useCallback(async () => {
      try {
         setLoading(true);
         const response = await ChurchService.getChurchById(churchId);
         
         if (response.success && response.data) {
            setChurchData({
               church: response.data,
               permissions: {
                  canUpdate: true,
                  canDelete: true,
                  canManage: true,
               }
            });
         } else {
            throw new Error(response.message || 'Failed to fetch church details');
         }
      } catch (error) {
         console.error('Failed to fetch church details:', error);
         showErrorToast('Failed to load church details');
         router.push('/churches');
      } finally {
         setLoading(false);
      }
   }, [churchId, router, showErrorToast]);

   useEffect(() => {
      fetchChurchDetails();
   }, [fetchChurchDetails]);

   if (loading) {
      return (
         <AdminLayout title="Loading..." description="Please wait">
            <div className="flex items-center justify-center h-64">
               <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                     Loading church details...
                  </p>
               </div>
            </div>
         </AdminLayout>
      );
   }

   if (!churchData) {
      return (
         <AdminLayout
            title="Church Not Found"
            description="The requested church could not be found"
         >
            <div className="text-center py-12">
               <p className="text-gray-600 mb-4">
                  The church you&apos;re looking for doesn&apos;t exist or has
                  been removed.
               </p>
               <Button
                  variant="primary"
                  onClick={() => router.push('/churches')}
               >
                  Back to Churches
               </Button>
            </div>
         </AdminLayout>
      );
   }

   const { church } = churchData;

   return (
      <AdminLayout
         title={church.name}
         description={`Church • ${typeof church.conferenceId === 'object' && church.conferenceId ? (church.conferenceId as Conference).name : 'Conference'}`}
         hideTitle={true}
         hideHeader={true}
      >
         {/* Hero Banner Section */}
         <div className="relative h-80 md:h-96 bg-gray-900 -mx-6 -mt-6">
            <ChurchBannerImage church={church} />

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
                           <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                              Church
                           </span>
                           <StatusBadge
                              status={church.isActive}
                              trueLabel="Active"
                              falseLabel="Inactive"
                              trueColor="green"
                              falseColor="red"
                           />
                           {church.code && (
                              <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
                                 {church.code}
                              </span>
                           )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                           {church.name}
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
                           {typeof church.conferenceId === 'object' && church.conferenceId && (
                              <p className="text-lg text-gray-200">
                                 {(church.conferenceId as Conference).name}
                              </p>
                           )}
                           {church.location?.address?.city && (
                              <p className="text-lg text-gray-200 flex items-center">
                                 <MapPinIcon className="h-5 w-5 mr-1" />
                                 {church.location.address.city}
                                 {church.location.address.state && `, ${church.location.address.state}`}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Back Button */}
            <button
               onClick={() => router.push('/churches')}
               className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
               <XMarkIcon className="h-6 w-6" />
            </button>
         </div>

         <div className="mt-8">
            {/* Main Content Container */}
            <div className="max-w-6xl mx-auto">
               
               {/* Leadership Section */}
               {church.leadership && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <UserGroupIcon className="h-6 w-6 text-gray-400 mr-2" />
                        Leadership
                     </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Pastor */}
                        {church.leadership.associatePastors?.[0]?.name && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Pastor</h3>
                              <p className="text-gray-700 font-medium">{church.leadership.associatePastors[0].name}</p>
                              {church.leadership.associatePastors[0].email && (
                                 <p className="text-gray-600 text-sm">{church.leadership.associatePastors[0].email}</p>
                              )}
                              {church.leadership.associatePastors[0].phone && (
                                 <p className="text-gray-600 text-sm">{church.leadership.associatePastors[0].phone}</p>
                              )}
                           </div>
                        )}
                        
                        {/* Elders */}
                        {church.leadership.elders && church.leadership.elders.length > 0 && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Elders</h3>
                              <div className="space-y-2">
                                 {church.leadership.elders.slice(0, 3).map((elder: { name: string; role?: string; email?: string; phone?: string }, index: number) => (
                                    <div key={index}>
                                       <p className="text-gray-700">{elder.name}</p>
                                       {elder.role && (
                                          <p className="text-gray-600 text-sm">{elder.role}</p>
                                       )}
                                    </div>
                                 ))}
                                 {church.leadership.elders.length > 3 && (
                                    <p className="text-gray-500 text-sm">
                                       +{church.leadership.elders.length - 3} more elders
                                    </p>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        {/* Coordinators */}
                        {church.leadership.coordinators && church.leadership.coordinators.length > 0 && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Coordinators</h3>
                              <div className="space-y-2">
                                 {church.leadership.coordinators.slice(0, 3).map((coordinator: { name: string; department?: string; email?: string; phone?: string }, index: number) => (
                                    <div key={index}>
                                       <p className="text-gray-700">{coordinator.name}</p>
                                       {coordinator.department && (
                                          <p className="text-gray-600 text-sm">{coordinator.department}</p>
                                       )}
                                    </div>
                                 ))}
                                 {church.leadership.coordinators.length > 3 && (
                                    <p className="text-gray-500 text-sm">
                                       +{church.leadership.coordinators.length - 3} more coordinators
                                    </p>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* Demographics & Statistics */}
               {church.demographics && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <ChartBarIcon className="h-6 w-6 text-gray-400 mr-2" />
                        Demographics & Statistics
                     </h2>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {church.demographics.membership?.total && (
                           <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">
                                 {church.demographics.membership.total}
                              </div>
                              <div className="text-sm text-gray-600">Total Members</div>
                           </div>
                        )}
                        {church.demographics.averageAttendance && (
                           <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">
                                 {church.demographics.averageAttendance}
                              </div>
                              <div className="text-sm text-gray-600">Avg Attendance</div>
                           </div>
                        )}
                        {church.demographics.ageGroups?.children && (
                           <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">
                                 {church.demographics.ageGroups.children}
                              </div>
                              <div className="text-sm text-gray-600">Children</div>
                           </div>
                        )}
                        {church.demographics.ageGroups?.youth && (
                           <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">
                                 {church.demographics.ageGroups.youth}
                              </div>
                              <div className="text-sm text-gray-600">Youth</div>
                           </div>
                        )}
                     </div>
                     
                     {/* Additional demographic details */}
                     {(church.demographics.membership?.baptized || church.demographics.membership?.visiting) && (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                           {church.demographics.membership.baptized && (
                              <div className="bg-gray-50 p-3 rounded text-center">
                                 <div className="font-semibold text-lg">{church.demographics.membership.baptized}</div>
                                 <div className="text-sm text-gray-600">Baptized Members</div>
                              </div>
                           )}
                           {church.demographics.membership.visiting && (
                              <div className="bg-gray-50 p-3 rounded text-center">
                                 <div className="font-semibold text-lg">{church.demographics.membership.visiting}</div>
                                 <div className="text-sm text-gray-600">Visiting Members</div>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               )}

               {/* Facilities Section */}
               {church.facilities && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <HomeIcon className="h-6 w-6 text-gray-400 mr-2" />
                        Facilities
                     </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Sanctuary */}
                        {church.facilities.sanctuary && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Sanctuary</h3>
                              <div className="space-y-1">
                                 {church.facilities.sanctuary.capacity && (
                                    <p className="text-gray-600">Capacity: {church.facilities.sanctuary.capacity}</p>
                                 )}
                                 {church.facilities.sanctuary.hasAV && (
                                    <p className="text-green-600 text-sm">Audio/Visual Equipment</p>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        {/* Classrooms */}
                        {church.facilities.classrooms && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Classrooms</h3>
                              <div className="space-y-1">
                                 <p className="text-gray-600">Count: {church.facilities.classrooms.count || 0}</p>
                                 {church.facilities.classrooms.capacity && (
                                    <p className="text-gray-600">Total Capacity: {church.facilities.classrooms.capacity}</p>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        {/* Kitchen */}
                        {church.facilities.kitchen && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Kitchen</h3>
                              <div className="space-y-1">
                                 <p className="text-gray-600">Capacity: {church.facilities.kitchen.capacity || 'Not specified'}</p>
                                 {church.facilities.kitchen.hasEquipment && (
                                    <p className="text-green-600 text-sm">Full Equipment Available</p>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        {/* Other amenities */}
                        {church.facilities.other && church.facilities.other.length > 0 && (
                           <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 lg:col-span-3">
                              <h3 className="font-semibold text-gray-900 mb-2">Other Amenities</h3>
                              <div className="flex flex-wrap gap-2">
                                 {church.facilities.other.map((amenity: string, index: number) => (
                                    <span
                                       key={index}
                                       className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                    >
                                       {amenity}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* Service Schedule */}
               {church.serviceSchedule && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <ClockIcon className="h-6 w-6 text-gray-400 mr-2" />
                        Service Schedule
                     </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {church.serviceSchedule.worship && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Worship Service</h3>
                              <div className="space-y-1">
                                 <p className="text-gray-600">
                                    {church.serviceSchedule.worship.day}: {church.serviceSchedule.worship.time}
                                 </p>
                                 {church.serviceSchedule.worship.description && (
                                    <p className="text-gray-600 text-sm">{church.serviceSchedule.worship.description}</p>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        {church.serviceSchedule.prayerMeeting && (
                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-900 mb-2">Prayer Meeting</h3>
                              <div className="space-y-1">
                                 <p className="text-gray-600">
                                    {church.serviceSchedule.prayerMeeting.day}: {church.serviceSchedule.prayerMeeting.time}
                                 </p>
                                 {church.serviceSchedule.prayerMeeting.description && (
                                    <p className="text-gray-600 text-sm">{church.serviceSchedule.prayerMeeting.description}</p>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        {church.serviceSchedule.other && church.serviceSchedule.other.length > 0 && (
                           <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                              <h3 className="font-semibold text-gray-900 mb-2">Other Services</h3>
                              <div className="space-y-2">
                                 {church.serviceSchedule.other.map((service: { name: string; day: string; time: string; description?: string }, index: number) => (
                                    <div key={index} className="flex justify-between">
                                       <span className="text-gray-700">{service.name}</span>
                                       <span className="text-gray-600">{service.day}: {service.time}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* Church Details Section */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                     Church Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Location Information */}
                     {church.location && (
                        <div>
                           <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                              Location
                           </h3>
                           <div className="space-y-2">
                              {church.location.address?.address && (
                                 <p className="text-gray-600">{church.location.address.address}</p>
                              )}
                              <div className="text-gray-600">
                                 {church.location.address?.city && (
                                    <span>{church.location.address.city}</span>
                                 )}
                                 {church.location.address?.state && (
                                    <span>{church.location.address.city ? ', ' : ''}{church.location.address.state}</span>
                                 )}
                                 {church.location.address?.postalCode && (
                                    <span> {church.location.address.postalCode}</span>
                                 )}
                              </div>
                              {church.location.address?.country && (
                                 <p className="text-gray-600">{church.location.address.country}</p>
                              )}
                           </div>
                        </div>
                     )}

                     {/* Contact Information */}
                     {church.contact && (
                        <div>
                           <h3 className="font-semibold text-gray-900 mb-4">
                              Contact Information
                           </h3>
                           <div className="space-y-3">
                              {church.contact.email && (
                                 <div className="flex items-center text-gray-600">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={`mailto:${church.contact.email}`}
                                       className="hover:text-green-600 transition-colors"
                                    >
                                       {church.contact.email}
                                    </a>
                                 </div>
                              )}
                              {church.contact.phone && (
                                 <div className="flex items-center text-gray-600">
                                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={`tel:${church.contact.phone}`}
                                       className="hover:text-green-600 transition-colors"
                                    >
                                       {church.contact.phone}
                                    </a>
                                 </div>
                              )}
                              {church.contact.website && (
                                 <div className="flex items-center text-gray-600">
                                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                                    <a
                                       href={church.contact.website}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="hover:text-green-600 transition-colors"
                                    >
                                       {church.contact.website}
                                    </a>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* System Information Section */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                     System Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="text-gray-600">Church ID:</span>
                           <span className="font-mono text-sm">{church._id}</span>
                        </div>
                        {church.code && (
                           <div className="flex justify-between">
                              <span className="text-gray-600">Church Code:</span>
                              <span className="font-medium">{church.code}</span>
                           </div>
                        )}
                        <div className="flex justify-between">
                           <span className="text-gray-600">Hierarchy Level:</span>
                           <span className="font-medium">{church.hierarchyLevel}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Hierarchy Path:</span>
                           <span className="font-mono text-sm">{church.hierarchyPath}</span>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="text-gray-600">Created:</span>
                           <span className="text-sm">{new Date(church.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Last Updated:</span>
                           <span className="text-sm">{new Date(church.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {church.establishedDate && (
                           <div className="flex justify-between">
                              <span className="text-gray-600">Established:</span>
                              <span className="text-sm">{new Date(church.establishedDate).toLocaleDateString()}</span>
                           </div>
                        )}
                        {typeof church.conferenceId === 'object' && church.conferenceId && (
                           <div className="flex justify-between">
                              <span className="text-gray-600">Conference ID:</span>
                              <span className="font-mono text-sm">
                                 {(church.conferenceId as Conference)._id}
                              </span>
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