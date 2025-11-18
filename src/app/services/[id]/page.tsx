'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import { StatusBadge } from '@/components/DataTable';
import ImageUploadModal from '@/components/ImageUploadModal';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement } from '@/lib/serviceManagement';
import {
   PencilIcon,
   MapPinIcon,
   EnvelopeIcon,
   PhoneIcon,
   GlobeAltIcon,
   CalendarIcon,
   UserGroupIcon,
   BookOpenIcon,
   PhotoIcon,
   XMarkIcon,
} from '@heroicons/react/24/outline';

interface ServiceDetails {
   service: {
      _id: string;
      name: string;
      type: string;
      organization: {
         _id: string;
         name: string;
         type: string;
      };
      descriptionShort: string;
      descriptionLong: string;
      status: 'active' | 'paused' | 'archived';
      primaryImage?: {
         url: string;
         alt: string;
      };
      gallery?: Array<{
         url: string;
         alt: string;
         caption: string;
      }>;
      tags?: string[];
      locations: Array<{
         label: string;
         address: {
            street?: string;
            suburb?: string;
            state?: string;
            postcode?: string;
         };
         coordinates?: {
            lat: number;
            lng: number;
         };
      }>;
      contactInfo: {
         email?: string;
         phone?: string;
         website?: string;
      };
      createdAt: string;
      updatedAt: string;
   };
   events: Array<{ _id: string; title: string; date: string }>;
   roles: Array<{ _id: string; title: string; description: string }>;
   stories: Array<{ _id: string; title: string; content: string }>;
   permissions: {
      canUpdate: boolean;
      canDelete: boolean;
      canManage: boolean;
      canCreateStories: boolean;
   };
}

export default function ServiceDetailPage() {
   const params = useParams();
   const router = useRouter();
   const serviceId = params.id as string;

   const [serviceData, setServiceData] = useState<ServiceDetails | null>(null);
   const [loading, setLoading] = useState(true);
   const [showImageUploadModal, setShowImageUploadModal] = useState(false);
   const { error: showErrorToast } = useToast();

   const fetchServiceDetails = useCallback(async () => {
      try {
         setLoading(true);
         const data = await serviceManagement.getServiceDetails(serviceId);
         setServiceData(data);
      } catch (error) {
         console.error('Failed to fetch service details:', error);
         showErrorToast('Failed to load service details');
         router.push('/services');
      } finally {
         setLoading(false);
      }
   }, [serviceId, router, showErrorToast]);

   useEffect(() => {
      fetchServiceDetails();
   }, [fetchServiceDetails]);

   const handleImageUploaded = () => {
      setShowImageUploadModal(false);
      fetchServiceDetails();
   };

   if (loading) {
      return (
         <AdminLayout title="Loading..." description="Please wait">
            <div className="flex items-center justify-center h-64">
               <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5821F] mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                     Loading service details...
                  </p>
               </div>
            </div>
         </AdminLayout>
      );
   }

   if (!serviceData) {
      return (
         <AdminLayout
            title="Service Not Found"
            description="The requested service could not be found"
         >
            <div className="text-center py-12">
               <p className="text-gray-600 mb-4">
                  The service you&apos;re looking for doesn&apos;t exist or has
                  been removed.
               </p>
               <Button
                  variant="primary"
                  onClick={() => router.push('/services')}
               >
                  Back to Services
               </Button>
            </div>
         </AdminLayout>
      );
   }

   const { service, events, roles, stories, permissions } = serviceData;

   return (
      <>
         {/* Hero Banner Section */}
         <div className="relative h-80 md:h-96 bg-gray-900">
            {service.primaryImage ? (
               <Image
                  src={service.primaryImage.url}
                  alt={service.primaryImage.alt || service.name}
                  fill
                  className="object-cover opacity-50"
                  priority
               />
            ) : (
               <div className="absolute inset-0 bg-gradient-to-br from-[#F5821F] to-[#e0741c]"></div>
            )}

            {/* User Profile Overlay */}
            <div className="absolute top-8 right-4 z-20">
               <div className="flex items-center space-x-4">
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                     {permissions.canUpdate && (
                        <Button
                           variant="outline"
                           size="sm"
                           leftIcon={PencilIcon}
                           onClick={() => setShowImageUploadModal(true)}
                           className="!text-white !border-white hover:!bg-white hover:!text-gray-900 shadow-lg backdrop-blur-sm"
                        >
                           Upload Image
                        </Button>
                     )}
                  </div>

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
                           <span className="px-3 py-1 bg-[#F5821F] text-white text-sm font-medium rounded-full">
                              {service.type.replace(/_/g, ' ')}
                           </span>
                           <StatusBadge
                              status={service.status === 'active'}
                              trueLabel="Active"
                              falseLabel={
                                 service.status === 'paused'
                                    ? 'Paused'
                                    : 'Archived'
                              }
                              trueColor="green"
                              falseColor={
                                 service.status === 'paused' ? 'yellow' : 'gray'
                              }
                           />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                           {service.name}
                        </h1>
                        <p className="text-lg text-gray-200">
                           {service.descriptionShort}
                        </p>
                        <p className="text-sm text-gray-300 mt-2">
                           {service.organization.name}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Back Button */}
            <button
               onClick={() => router.push('/services')}
               className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
               <XMarkIcon className="h-6 w-6" />
            </button>
         </div>

         <AdminLayout
            title={service.name}
            description={`${service.organization.name} • ${service.type.replace(
               /_/g,
               ' '
            )}`}
            hideTitle={true}
            hideHeader={true}
         >
            <div className="-mt-8">
               {/* Main Content Container */}
               <div className="max-w-6xl mx-auto">
                  {/* Description Section */}
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
                        {service.descriptionLong || service.descriptionShort}
                     </p>
                  </div>

                  {/* About This Service Section */}
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        About This Service
                     </h2>
                     <div className="prose max-w-none text-gray-600">
                        <p>{service.descriptionLong}</p>
                        {service.tags && service.tags.length > 0 && (
                           <div className="mt-6 flex flex-wrap gap-2">
                              {service.tags.map((tag, index) => (
                                 <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                                 >
                                    {tag}
                                 </span>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Service Details Section */}
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Service Details
                     </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Location Information */}
                        {service.locations && service.locations.length > 0 && (
                           <div>
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                 <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                                 Locations
                              </h3>
                              <div className="space-y-3">
                                 {service.locations.map((location, index) => (
                                    <div key={index} className="text-gray-600">
                                       <p className="font-medium text-gray-900">
                                          {location.label}
                                       </p>
                                       {location.address && (
                                          <p className="text-sm mt-1">
                                             {location.address.street &&
                                                `${location.address.street}, `}
                                             {location.address.suburb &&
                                                `${location.address.suburb}, `}
                                             {location.address.state &&
                                                `${location.address.state} `}
                                             {location.address.postcode}
                                          </p>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* Contact Information */}
                        {service.contactInfo && (
                           <div>
                              <h3 className="font-semibold text-gray-900 mb-4">
                                 Contact Information
                              </h3>
                              <div className="space-y-3">
                                 {service.contactInfo.email && (
                                    <div className="flex items-center text-gray-600">
                                       <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                                       <a
                                          href={`mailto:${service.contactInfo.email}`}
                                          className="hover:text-[#F5821F] transition-colors"
                                       >
                                          {service.contactInfo.email}
                                       </a>
                                    </div>
                                 )}
                                 {service.contactInfo.phone && (
                                    <div className="flex items-center text-gray-600">
                                       <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                                       <a
                                          href={`tel:${service.contactInfo.phone}`}
                                          className="hover:text-[#F5821F] transition-colors"
                                       >
                                          {service.contactInfo.phone}
                                       </a>
                                    </div>
                                 )}
                                 {service.contactInfo.website && (
                                    <div className="flex items-center text-gray-600">
                                       <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                                       <a
                                          href={service.contactInfo.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:text-[#F5821F] transition-colors"
                                       >
                                          {service.contactInfo.website}
                                       </a>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Events Section */}
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                           <CalendarIcon className="h-7 w-7 text-blue-600 mr-3" />
                           Events
                        </h2>
                        {permissions.canManage && (
                           <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                 router.push(`/services/${serviceId}/events`)
                              }
                           >
                              Manage Events
                           </Button>
                        )}
                     </div>
                     {events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {events.slice(0, 6).map((event) => (
                              <div
                                 key={event._id}
                                 className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                 <h3 className="font-medium text-gray-900">
                                    {event.title}
                                 </h3>
                                 <p className="text-sm text-gray-500 mt-1">
                                    {new Date(event.date).toLocaleDateString()}
                                 </p>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <p className="text-gray-500 text-center py-8">
                           No events scheduled for this service.
                        </p>
                     )}
                  </div>

                  {/* Volunteer Roles Section */}
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                           <UserGroupIcon className="h-7 w-7 text-green-600 mr-3" />
                           Volunteer Opportunities
                        </h2>
                        {permissions.canManage && (
                           <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                 router.push(
                                    `/services/${serviceId}/volunteers`
                                 )
                              }
                           >
                              Manage Volunteers
                           </Button>
                        )}
                     </div>
                     {roles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {roles.slice(0, 4).map((role) => (
                              <div
                                 key={role._id}
                                 className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                 <h3 className="font-medium text-gray-900">
                                    {role.title}
                                 </h3>
                                 <p className="text-sm text-gray-600 mt-2">
                                    {role.description}
                                 </p>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <p className="text-gray-500 text-center py-8">
                           No volunteer opportunities available.
                        </p>
                     )}
                  </div>

                  {/* Stories Section */}
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                           <BookOpenIcon className="h-7 w-7 text-purple-600 mr-3" />
                           Success Stories
                        </h2>
                        {permissions.canManage && (
                           <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                 router.push(`/services/${serviceId}/stories`)
                              }
                           >
                              Manage Stories
                           </Button>
                        )}
                     </div>
                     {stories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {stories.slice(0, 3).map((story) => (
                              <div
                                 key={story._id}
                                 className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                 <h3 className="font-medium text-gray-900 mb-2">
                                    {story.title}
                                 </h3>
                                 <p className="text-sm text-gray-600 line-clamp-3">
                                    {story.content}
                                 </p>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <p className="text-gray-500 text-center py-8">
                           No stories have been shared yet.
                        </p>
                     )}
                  </div>

                  {/* Images Section */}
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                           <PhotoIcon className="h-7 w-7 text-[#F5821F] mr-3" />
                           Images & Gallery
                        </h2>
                        {permissions.canUpdate && (
                           <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                 router.push(`/services/${serviceId}/images`)
                              }
                           >
                              Manage Images
                           </Button>
                        )}
                     </div>

                     {/* Banner Image Display */}
                     {service.primaryImage && (
                        <div className="mb-6">
                           <h3 className="font-medium text-gray-700 mb-3">
                              Banner Image
                           </h3>
                           <div className="relative h-64 rounded-lg overflow-hidden shadow-md">
                              <Image
                                 src={service.primaryImage.url}
                                 alt={
                                    service.primaryImage.alt || 'Service banner'
                                 }
                                 fill
                                 className="object-cover"
                              />
                           </div>
                        </div>
                     )}

                     {/* Gallery Display */}
                     <div>
                        <h3 className="font-medium text-gray-700 mb-3">
                           Gallery
                        </h3>
                        {service.gallery && service.gallery.length > 0 ? (
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {service.gallery
                                 .slice(0, 8)
                                 .map((image, index) => (
                                    <div
                                       key={index}
                                       className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group"
                                    >
                                       <div className="relative h-48">
                                          <Image
                                             src={image.url}
                                             alt={
                                                image.alt ||
                                                `Gallery image ${index + 1}`
                                             }
                                             fill
                                             className="object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                       </div>
                                       {image.caption && (
                                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                             <p className="text-white text-xs">
                                                {image.caption}
                                             </p>
                                          </div>
                                       )}
                                    </div>
                                 ))}
                              {service.gallery.length > 8 && (
                                 <div
                                    className="relative h-48 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() =>
                                       permissions.canUpdate &&
                                       router.push(
                                          `/services/${serviceId}/images`
                                       )
                                    }
                                 >
                                    <div className="text-center">
                                       <p className="text-2xl font-bold text-gray-600">
                                          +{service.gallery.length - 8}
                                       </p>
                                       <p className="text-sm text-gray-500">
                                          more images
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        ) : (
                           <p className="text-gray-500 text-center py-8">
                              No gallery images uploaded yet.
                           </p>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Image Upload Modal */}
            {showImageUploadModal && (
               <ImageUploadModal
                  isOpen={showImageUploadModal}
                  onClose={() => setShowImageUploadModal(false)}
                  onSuccess={handleImageUploaded}
                  serviceId={serviceId}
               />
            )}
         </AdminLayout>
      </>
   );
}
