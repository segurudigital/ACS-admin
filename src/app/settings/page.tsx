'use client';

import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/HierarchicalPermissionContext';
import GlobalConfigSettings from '../../components/settings/GlobalConfigSettings';
import ApplicationSettings from '../../components/settings/ApplicationSettings';
import SuperAdminSettings from '../../components/settings/SuperAdminSettings';

export default function Settings() {
  const { hasPermission } = useAuth();
  const isSuperAdmin = hasPermission('*');
  const canManageServiceTypes = hasPermission('manage_service_types') || hasPermission('*');
  
  // Check if user has any meaningful settings they can manage
  const hasAnySettingsAccess = isSuperAdmin || canManageServiceTypes;
  
  // Determine the default active section based on permissions
  const getDefaultSection = () => {
    if (isSuperAdmin) return 'super-admin-management';
    if (canManageServiceTypes) return 'service-types';
    return 'role-limits'; // fallback
  };
  
  const [activeSection, setActiveSection] = useState(getDefaultSection());

  // If user has no meaningful settings access, show appropriate message
  if (!hasAnySettingsAccess) {
    return (
      <AdminLayout 
        title="Settings" 
        description="Configure system settings and preferences"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Settings Available</h3>
            <p className="text-gray-500">
              You don&apos;t have permission to manage any system settings. 
              Contact your administrator if you need access to configuration options.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const settingsNavigation = [
    // Super Admin Section - Super Admin Only
    ...(isSuperAdmin ? [
      {
        id: 'super-admin',
        title: 'Super Administrator',
        items: [
          {
            id: 'super-admin-management',
            title: 'Super Admin Management',
            description: 'Grant and revoke super admin privileges',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )
          }
        ]
      },
      {
        id: 'global-config',
        title: 'Global Configuration',
        items: [
          {
            id: 'role-limits',
            title: 'Role & Access Limits',
            description: 'Configure maximum accounts per role',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )
          },
          {
            id: 'system-config',
            title: 'System Configuration',
            description: 'Email, security, and system defaults',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )
          }
        ]
      }
    ] : []),
    // Application Settings
    {
      id: 'application',
      title: 'Application Settings',
      items: [
        ...(canManageServiceTypes ? [{
          id: 'service-types',
          title: 'Service Types',
          description: 'Manage service categories',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )
        }] : [])
      ]
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'super-admin-management':
        return <SuperAdminSettings />;
      case 'role-limits':
        return <GlobalConfigSettings section="role-limits" />;
      case 'system-config':
        return <GlobalConfigSettings section="system-config" />;
      case 'service-types':
        return <ApplicationSettings section="service-types" />;
      default:
        return <GlobalConfigSettings section="role-limits" />;
    }
  };

  return (
    <AdminLayout 
      title="Settings" 
      description="Configure system settings and preferences"
    >
      <div className="flex h-[calc(100vh-200px)] bg-gray-50">
        {/* Settings Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>
            
            <nav className="space-y-8">
              {settingsNavigation.map((section) => (
                <div key={section.id}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div className={`mr-3 flex-shrink-0 ${
                            activeSection === item.id ? 'text-[#B95B09]' : 'text-[#B95B09]'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}