'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface RoleLimit {
  role: string;
  displayName: string;
  currentLimit: number;
  currentCount: number;
  description: string;
  isSystem: boolean;
}

interface GlobalConfigSettingsProps {
  section: string;
}

export default function GlobalConfigSettings({ section }: GlobalConfigSettingsProps) {
  const [roleLimits, setRoleLimits] = useState<RoleLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (section === 'role-limits') {
      fetchRoleLimits();
    }
  }, [section]);

  const fetchRoleLimits = async () => {
    try {
      const data = await api.get('/api/admin/role-limits');
      setRoleLimits(data);
    } catch (error: unknown) {
      console.error('Error fetching role limits:', error);
      setError(`Failed to load role limits: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRoleLimit = async (role: string, newLimit: number) => {
    if (newLimit < 1) {
      setError('Role limits must be at least 1');
      return;
    }

    const roleData = roleLimits.find(r => r.role === role);
    if (roleData && newLimit < roleData.currentCount) {
      setError(`Cannot set limit below current count (${roleData.currentCount})`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put('/api/admin/role-limits', {
        role,
        maxUsers: newLimit,
      });

      setSuccess('Role limit updated successfully');
      fetchRoleLimits();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error updating role limit:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLimitChange = (role: string, value: string) => {
    const newLimit = parseInt(value);
    if (!isNaN(newLimit)) {
      setRoleLimits(prev => 
        prev.map(r => r.role === role ? { ...r, currentLimit: newLimit } : r)
      );
    }
  };

  if (section === 'role-limits') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Role & Access Limits</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure the maximum number of accounts allowed for each role type
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Role Account Limits</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              roleLimits.map((roleLimit) => {
                const usagePercentage = Math.round((roleLimit.currentCount / roleLimit.currentLimit) * 100);
                
                return (
                  <div key={roleLimit.role} className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{roleLimit.displayName}</h4>
                        {roleLimit.isSystem && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Critical
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{roleLimit.description}</p>
                      
                      {/* Usage Bar */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>{roleLimit.currentCount} / {roleLimit.currentLimit} accounts</span>
                            <span>{usagePercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                usagePercentage >= 80 
                                  ? 'bg-red-500' 
                                  : usagePercentage >= 60 
                                  ? 'bg-yellow-500' 
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <label htmlFor={`limit-${roleLimit.role}`} className="text-sm font-medium text-gray-700">
                          Limit:
                        </label>
                        <input
                          id={`limit-${roleLimit.role}`}
                          type="number"
                          min="1"
                          value={roleLimit.currentLimit}
                          onChange={(e) => handleLimitChange(roleLimit.role, e.target.value)}
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          disabled={saving}
                        />
                      </div>
                      <button
                        onClick={() => updateRoleLimit(roleLimit.role, roleLimit.currentLimit)}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#F5821F] hover:bg-[#E07419] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5821F] disabled:bg-gray-400"
                      >
                        {saving ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Important Notes</h3>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>You cannot set a limit below the current number of active accounts</li>
                <li>Super Admin limits are critical for system security - set conservatively</li>
                <li>Changes take effect immediately and apply system-wide</li>
                <li>Warning notifications are sent when usage reaches 80% of the limit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'system-config') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Configuration</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure application settings, email preferences, security options, and system defaults
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Coming Soon</h3>
              <p className="mt-2 text-sm text-blue-700">
                System configuration options are under development. Soon you&apos;ll be able to configure email settings, security options, and other system defaults here.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Settings */}
        <div className="space-y-6">
          {/* Email Settings */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Configure SMTP settings and email templates</p>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Email configuration coming soon...</p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Configure password policies and authentication</p>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm">Security configuration coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}