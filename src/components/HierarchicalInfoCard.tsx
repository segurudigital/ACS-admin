'use client';

import React from 'react';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';
import { Role, HierarchicalEntity } from '@/types/rbac';

export default function HierarchicalInfoCard() {
  const { user } = usePermissions();

  if (!user) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Hierarchical Assignments
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading hierarchical information...</p>
          </div>
        </div>
      </div>
    );
  }

  const unionAssignments = user.unionAssignments || [];
  const conferenceAssignments = user.conferenceAssignments || [];
  const churchAssignments = user.churchAssignments || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleName = (role: Role | string) => {
    if (typeof role === 'string') return role;
    return role?.displayName || role?.name || 'Unknown Role';
  };

  const getEntityName = (entity: HierarchicalEntity | string) => {
    if (typeof entity === 'string') return entity;
    return entity?.name || 'Unknown';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Hierarchical Assignments
        </h3>
        
        <div className="space-y-6">
          {/* Union Assignments */}
          {unionAssignments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                  Union
                </span>
                Union Assignments
              </h4>
              <div className="space-y-3">
                {unionAssignments.map((assignment, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getEntityName(assignment.union)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Role: {getRoleName(assignment.role)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Since {formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conference Assignments */}
          {conferenceAssignments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                  Conference
                </span>
                Conference Assignments
              </h4>
              <div className="space-y-3">
                {conferenceAssignments.map((assignment, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getEntityName(assignment.conference)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Role: {getRoleName(assignment.role)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Since {formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Church Assignments */}
          {churchAssignments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                  Church
                </span>
                Church Assignments
              </h4>
              <div className="space-y-3">
                {churchAssignments.map((assignment, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-green-50 border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getEntityName(assignment.church)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Role: {getRoleName(assignment.role)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Since {formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No assignments message */}
          {unionAssignments.length === 0 && conferenceAssignments.length === 0 && churchAssignments.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-12 w-12">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No hierarchical assignments found</p>
              <p className="text-gray-400 text-xs mt-1">Contact your administrator to be assigned to a union, conference, or church</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}