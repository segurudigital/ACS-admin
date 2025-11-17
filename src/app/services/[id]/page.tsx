'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import { StatusBadge } from '@/components/DataTable';
import ServiceModal from '@/components/ServiceModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement, Service } from '@/lib/serviceManagement';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CalendarIcon,
  UserGroupIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface ServiceDetails {
  service: {
    _id: string;
    name: string;
    type: string;
    organization: { _id: string; name: string; type: string };
    descriptionShort: string;
    descriptionLong: string;
    status: 'active' | 'paused' | 'archived';
    primaryImage?: {
      url: string;
      alt: string;
    };
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const fetchServiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceManagement.getServiceDetails(serviceId);
      setServiceData(data);
    } catch (error) {
      showErrorToast('Failed to fetch service details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceId, showErrorToast]);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId, fetchServiceDetails]);

  const handleDelete = async () => {
    if (!serviceData) return;
    
    try {
      await serviceManagement.deleteService(serviceId);
      showSuccessToast(`${serviceData.service.name} has been archived`);
      router.push('/services');
    } catch (error) {
      showErrorToast('Failed to delete service');
      console.error('Error:', error);
    }
  };

  const handleServiceSaved = (updatedService: Service) => {
    setServiceData(prev => prev ? {
      ...prev,
      service: updatedService
    } : null);
    showSuccessToast(`${updatedService.name} has been updated`);
    setShowEditModal(false);
    fetchServiceDetails(); // Refresh data
  };

  if (loading) {
    return (
      <AdminLayout title="Service Details" description="Loading...">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading service details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!serviceData) {
    return (
      <AdminLayout title="Service Not Found" description="">
        <div className="text-center py-12">
          <p className="text-gray-500">Service not found</p>
          <Button onClick={() => router.push('/services')} className="mt-4">
            Back to Services
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const { service, events, roles, stories, permissions } = serviceData;

  return (
    <AdminLayout 
      title={service.name}
      description={`Manage ${service.name}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-start">
          <Button
            variant="ghost"
            leftIcon={ArrowLeftIcon}
            onClick={() => router.push('/services')}
          >
            Back to Services
          </Button>
          
          <div className="flex space-x-2">
            {permissions.canUpdate && (
              <Button
                leftIcon={PencilIcon}
                onClick={() => setShowEditModal(true)}
              >
                Edit Service
              </Button>
            )}
            
            {permissions.canDelete && (
              <Button
                variant="danger"
                leftIcon={TrashIcon}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Archive Service
              </Button>
            )}
          </div>
        </div>

        {/* Service Details Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-start space-x-5">
              {service.primaryImage?.url && (
                <img 
                  src={service.primaryImage.url} 
                  alt={service.primaryImage.alt}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
                  <StatusBadge
                    status={service.status === 'active'}
                    trueLabel="Active"
                    falseLabel={service.status === 'paused' ? 'Paused' : 'Archived'}
                    trueColor="green"
                    falseColor={service.status === 'paused' ? 'yellow' : 'gray'}
                  />
                </div>
                
                <p className="mt-1 text-sm text-gray-500">
                  {service.organization.name} • {service.type.replace(/_/g, ' ')}
                </p>
                
                <p className="mt-2 text-gray-700">{service.descriptionShort}</p>
                
                <div className="mt-4 prose prose-sm max-w-none text-gray-700">
                  <p>{service.descriptionLong}</p>
                </div>

                {service.tags && service.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {service.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location & Contact Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              {service.locations && service.locations.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Location</h3>
                  {service.locations.map((location: ServiceDetails['service']['locations'][0], index: number) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{location.label}</p>
                        {location.address.street && (
                          <p>
                            {location.address.street}<br />
                            {location.address.suburb}, {location.address.state} {location.address.postcode}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact Information */}
              {service.contactInfo && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {service.contactInfo.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        <a href={`mailto:${service.contactInfo.email}`} className="hover:text-indigo-600">
                          {service.contactInfo.email}
                        </a>
                      </div>
                    )}
                    {service.contactInfo.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <a href={`tel:${service.contactInfo.phone}`} className="hover:text-indigo-600">
                          {service.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {service.contactInfo.website && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                        <a href={service.contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                          {service.contactInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Management Sections */}
        {permissions.canManage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Events */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Events</h3>
                  </div>
                  <span className="text-sm text-gray-500">{events.length}</span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push(`/services/${serviceId}/events`)}
                >
                  Manage Events
                </Button>
              </div>
            </div>

            {/* Volunteer Roles */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Volunteers</h3>
                  </div>
                  <span className="text-sm text-gray-500">{roles.length}</span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push(`/services/${serviceId}/volunteers`)}
                >
                  Manage Volunteers
                </Button>
              </div>
            </div>

            {/* Stories */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <BookOpenIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Stories</h3>
                  </div>
                  <span className="text-sm text-gray-500">{stories.length}</span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push(`/services/${serviceId}/stories`)}
                >
                  Manage Stories
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <ServiceModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleServiceSaved}
            service={service}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Archive Service"
          message={`Are you sure you want to archive "${service.name}"? This service will no longer be visible to the public.`}
          confirmLabel="Archive"
          confirmButtonColor="red"
        />
      </div>
    </AdminLayout>
  );
}