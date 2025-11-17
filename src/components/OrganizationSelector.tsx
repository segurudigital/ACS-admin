'use client';

import React, { useState } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
// Simple organization interface for this component
interface SimpleOrganization {
  _id: string;
  name: string;
  type: string;
}
import { ChevronDownIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export const OrganizationSelector: React.FC = () => {
  const { currentOrganization, organizations, switchOrganization, loading } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);

  const handleOrganizationChange = async (org: SimpleOrganization) => {
    await switchOrganization(org._id);
    setIsOpen(false);
  };

  // Group organizations by type
  const groupedOrganizations = organizations.reduce((acc: Record<string, SimpleOrganization[]>, org: SimpleOrganization) => {
    if (!acc[org.type]) {
      acc[org.type] = [];
    }
    acc[org.type].push(org);
    return acc;
  }, {} as Record<string, SimpleOrganization[]>);

  if (loading || organizations.length === 0) {
    return null;
  }

  // If user only has access to one organization, don't show selector
  if (organizations.length === 1) {
    return (
      <div className="flex items-center px-4 py-2 text-sm text-gray-600">
        <BuildingOfficeIcon className="w-4 h-4 mr-2" />
        <span>{currentOrganization?.name}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="flex items-center">
          {currentOrganization && (
            <>
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              <span className="truncate">{currentOrganization.name}</span>
              <span className="ml-2 text-xs text-gray-500 capitalize">({currentOrganization.type})</span>
            </>
          )}
          {!currentOrganization && (
            <span className="text-gray-500">Select Organization</span>
          )}
        </div>
        <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 w-64 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1 max-h-96 overflow-y-auto">
              {['union', 'conference', 'church'].map(type => {
                const orgs = groupedOrganizations[type];
                if (!orgs || orgs.length === 0) return null;

                return (
                  <div key={type}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                      {type}s
                    </div>
                    {orgs.map((org: SimpleOrganization) => (
                      <button
                        key={org._id}
                        onClick={() => handleOrganizationChange(org)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          currentOrganization?._id === org._id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="truncate">{org.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Compact version for header
export const OrganizationBadge: React.FC = () => {
  const { currentOrganization, role } = usePermissions();

  if (!currentOrganization) return null;

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'union':
        return 'bg-purple-100 text-purple-800';
      case 'conference':
        return 'bg-blue-100 text-blue-800';
      case 'church':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(currentOrganization.type)}`}>
        {currentOrganization.type}
      </span>
      {role && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {role}
        </span>
      )}
    </div>
  );
};