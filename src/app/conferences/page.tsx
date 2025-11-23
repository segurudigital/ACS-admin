'use client';

import { useState, useEffect } from 'react';
import { Conference } from '../../types/rbac';
import { Union, ConferenceListResponse, ConferenceListParams } from '../../types/hierarchy';
import DataTable, { Column } from '../../components/DataTable';
import AdminLayout from '../../components/AdminLayout';
import { PermissionGate } from '../../components/PermissionGate';
import Button from '../../components/Button';
import ConferenceModal from '../../components/ConferenceModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { conferenceService } from '../../lib/conferenceService';
import { unionService } from '../../lib/unionService';

interface ConferenceWithUnion extends Conference {
  unionId: Union | string;
}

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<ConferenceWithUnion[]>([]);
  const [unions, setUnions] = useState<Union[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingConference, setEditingConference] = useState<ConferenceWithUnion | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingConference, setDeletingConference] = useState<ConferenceWithUnion | null>(null);

  // Fetch conferences and unions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: ConferenceListParams = {
        includeInactive: showInactive,
      };
      
      const [conferencesResponse, unionsResponse] = await Promise.all([
        conferenceService.getConferences(params),
        unionService.getUnions({ isActive: true })
      ]);
      
      setConferences(conferencesResponse.data);
      setUnions(unionsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conferences');
      console.error('Failed to fetch conferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showInactive]);

  // Filter conferences based on search term
  const filteredConferences = conferences.filter(conference => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const unionName = typeof conference.unionId === 'object' 
      ? conference.unionId.name 
      : unions.find(u => u._id === conference.unionId)?.name || '';
    
    return (
      conference.name.toLowerCase().includes(searchLower) ||
      conference.metadata?.email?.toLowerCase().includes(searchLower) ||
      conference.metadata?.territory?.some(t => t.toLowerCase().includes(searchLower)) ||
      unionName.toLowerCase().includes(searchLower)
    );
  });

  // Handle conference creation/editing
  const handleSaveConference = async () => {
    await fetchData();
    setShowModal(false);
    setEditingConference(null);
  };

  // Handle conference deletion
  const handleDeleteConference = async () => {
    if (!deletingConference) return;
    
    try {
      await conferenceService.deleteConference(deletingConference._id);
      await fetchData();
      setShowDeleteModal(false);
      setDeletingConference(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete conference');
      console.error('Failed to delete conference:', err);
    }
  };

  const getUnionName = (unionId: Union | string): string => {
    if (typeof unionId === 'object') {
      return unionId.name;
    }
    return unions.find(u => u._id === unionId)?.name || 'Unknown Union';
  };

  // Define table columns
  const columns: Column<ConferenceWithUnion>[] = [
    {
      header: 'Conference Name',
      accessor: 'name',
      className: 'font-medium text-gray-900',
    },
    {
      header: 'Union',
      accessor: (conference) => getUnionName(conference.unionId),
      className: 'text-gray-600',
    },
    {
      header: 'Territory',
      accessor: (conference) => conference.metadata?.territory?.join(', ') || 'Not specified',
      className: 'text-gray-600',
    },
    {
      header: 'Contact',
      accessor: (conference) => (
        <div className="space-y-1">
          {conference.metadata?.email && (
            <div className="text-sm text-gray-600">
              📧 {conference.metadata.email}
            </div>
          )}
          {conference.metadata?.phone && (
            <div className="text-sm text-gray-600">
              📞 {conference.metadata.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Statistics',
      accessor: (conference) => (
        <div className="text-sm text-gray-600">
          {conference.childCount ? `${conference.childCount} churches` : 'No data'}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (conference) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            conference.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {conference.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Edit',
      permission: 'conferences.update' as const,
      onClick: (conference: ConferenceWithUnion) => {
        setEditingConference(conference);
        setShowModal(true);
      },
      className: 'text-blue-600 hover:text-blue-900',
    },
    {
      label: 'Delete',
      permission: 'conferences.delete' as const,
      onClick: (conference: ConferenceWithUnion) => {
        setDeletingConference(conference);
        setShowDeleteModal(true);
      },
      className: 'text-red-600 hover:text-red-900',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Conferences</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage regional divisions within unions. Conferences oversee local church operations and administration.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <PermissionGate permission="conferences.create">
              <Button
                onClick={() => setShowModal(true)}
                variant="primary"
              >
                Create Conference
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search conferences by name, email, territory, or union..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <input
              id="show-inactive"
              type="checkbox"
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <label htmlFor="show-inactive" className="ml-2 block text-sm text-gray-900">
              Show inactive
            </label>
          </div>
        </div>

        {/* Conference Table */}
        <div className="mt-6">
          <DataTable
            data={filteredConferences}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="No conferences found"
            searchValue={searchTerm}
            onSearch={setSearchTerm}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading conferences
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <ConferenceModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingConference(null);
          }}
          onSave={handleSaveConference}
          conference={editingConference}
          unions={unions}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingConference && (
        <ConfirmationModal
          title="Delete Conference"
          message={`Are you sure you want to delete "${deletingConference.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConference}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingConference(null);
          }}
          isDestructive
        />
      )}
    </AdminLayout>
  );
}