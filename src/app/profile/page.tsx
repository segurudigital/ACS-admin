'use client';

import AdminLayout from '../../components/AdminLayout';
import ProfileHeader from '../../components/ProfileHeader';
import PersonalInfoCard from '../../components/PersonalInfoCard';
import ContactInfoCard from '../../components/ContactInfoCard';
import OrganizationInfoCard from '../../components/OrganizationInfoCard';
import SecurityCard from '../../components/SecurityCard';

export default function Profile() {
  return (
    <AdminLayout 
      title="Profile" 
      description="Manage your account information, contact details, and security settings"
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header - Avatar and basic info */}
        <ProfileHeader />

        {/* Single column layout */}
        <div className="space-y-6">
          <PersonalInfoCard />
          <ContactInfoCard />
          <OrganizationInfoCard />
          <SecurityCard />
        </div>

        {/* Footer with helpful information */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Need Help?</h3>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>• For organizational role changes, contact your system administrator</p>
                <p>• For technical support, reach out to IT support</p>
                <p>• All profile changes are logged for security purposes</p>
                <p>• Keep your contact information up to date for important notifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}