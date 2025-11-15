'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { StatusBadge } from '@/components/DataTable';
import Button from '@/components/Button';
import ServiceModal from '@/components/ServiceModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement } from '@/lib/serviceManagement';
import { 
  BuildingStorefrontIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Service {
  _id: string;
  name: string;
  type: string;
  organization: {
    _id: string;
    name: string;
    type: string;
  };
  descriptionShort: string;
  status: 'active' | 'paused' | 'archived';
  locations: Array<{
    label: string;
    address: {
      street?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
    };
  }>;
  primaryImage?: {
    url: string;
    alt: string;
  };
  permissions?: {
    canUpdate: boolean;
    canDelete: boolean;
    canManage: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await serviceManagement.getServices();
      setServices(data.services || []);
    } catch (err) {
      error('Failed to fetch services');
      console.error('Error:', err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    try {
      await serviceManagement.deleteService(service._id);
      setServices(prev => prev.filter(s => s._id !== service._id));
      success(`${service.name} has been successfully archived.`);
    } catch (err) {
      console.error('Error deleting service:', err);
      error('Failed to delete service');
    } finally {
      setShowDeleteConfirm(false);
      setServiceToDelete(null);
    }
  };

  const handleServiceSaved = (savedService: Service, isEdit: boolean) => {
    if (isEdit) {
      setServices(prev => 
        prev.map(service => service._id === savedService._id ? savedService : service)
      );
      success(`${savedService.name} has been successfully updated.`);
    } else {
      setServices(prev => [...prev, savedService]);
      success(`${savedService.name} has been successfully created.`);
    }
    
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedService(null);
  };

  const columns = [
    {
      key: 'name',
      header: 'Service',
      accessor: (service: Service) => (
        <div className="flex items-start space-x-3">
          {service.primaryImage?.url && (
            <img 
              src={service.primaryImage.url} 
              alt={service.primaryImage.alt}
              className="w-10 h-10 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{service.name}</div>
            <div className="text-sm text-gray-500 truncate">{service.descriptionShort}</div>
          </div>
        </div>
      ),
      className: 'px-6 py-4'
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (service: Service) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
          {service.type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      accessor: (service: Service) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {service.organization.name}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {service.organization.type}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      accessor: (service: Service) => {
        if (!service.locations || service.locations.length === 0) {
          return <span className="text-gray-400">-</span>;
        }
        const location = service.locations[0];
        return (
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">
              {location.address.suburb && location.address.state ? 
                `${location.address.suburb}, ${location.address.state}` : 
                location.label
              }
            </span>
          </div>
        );
      },
      className: 'px-6 py-4 max-w-xs'
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (service: Service) => (
        <StatusBadge
          status={service.status === 'active'}
          trueLabel="Active"
          falseLabel={service.status === 'paused' ? 'Paused' : 'Archived'}
          trueColor="green"
          falseColor={service.status === 'paused' ? 'yellow' : 'gray'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (service: Service) => (
        <span className="text-sm text-gray-500">
          {new Date(service.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
      accessor: (service: Service) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => window.location.href = `/services/${service._id}`}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            View
          </button>
          
          <PermissionGate 
            permission="services.update"
          >
            <button
              onClick={() => {
                setSelectedService(service);
                setShowEditModal(true);
              }}
              className="text-indigo-600 hover:text-indigo-900"
              title="Edit Service"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          </PermissionGate>

          <PermissionGate 
            permission="services.delete"
          >
            <button
              onClick={() => {
                setServiceToDelete(service);
                setShowDeleteConfirm(true);
              }}
              className="text-red-600 hover:text-red-900"
              title="Delete Service"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.organization.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout 
      title="Services" 
      description="Manage community services across your organization"
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
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                />
              </div>
              <PermissionGate permission="services.create">
                <Button onClick={() => setShowCreateModal(true)} className="whitespace-nowrap" size="sm">
                  Add Service
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
            ) : filteredServices.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <BuildingStorefrontIcon />
                </div>
                <p className="text-sm text-gray-500">No services found</p>
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
                  {filteredServices.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={column.className || 'px-6 py-4 whitespace-nowrap text-sm'}
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
        <ServiceModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedService(null);
          }}
          onSave={handleServiceSaved}
          service={showEditModal ? selectedService : null}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setServiceToDelete(null);
          }}
          onConfirm={() => serviceToDelete && handleDeleteService(serviceToDelete)}
          title="Delete Service"
          message={`Are you sure you want to archive "${serviceToDelete?.name}"? This service will no longer be visible to the public.`}
          confirmLabel="Archive"
          confirmButtonColor="red"
        />
      </div>
    </AdminLayout>
  );
}