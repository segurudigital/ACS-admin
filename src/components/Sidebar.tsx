'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AuthService } from '../lib/auth';
import SidebarItem from './SidebarItem';
import { PermissionGate } from './PermissionGate';

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    console.log('[Sidebar] Logout initiated');
    try {
      await AuthService.logout();
      console.log('[Sidebar] AuthService.logout() completed - waiting for context to handle redirect');
    } catch (error) {
      console.error('[Sidebar] Logout error:', error);
      // If logout fails, manually redirect immediately
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F5821F]">
      {/* Logo Section */}
      <div className="flex items-center px-4 py-6 border-b border-orange-700/30">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <Image 
            src="/logo-white.png" 
            alt="ACS Logo" 
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-white truncate">
                ACS Admin
              </h2>
              <p className="text-sm text-orange-100 truncate">
                Control Panel
              </p>
            </div>
            {/* Mobile close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-white hover:bg-white/10 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <SidebarItem
          href="/dashboard"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
            </svg>
          }
          label={collapsed ? "" : "Dashboard"}
          onClick={onClose}
        />

        <PermissionGate permission="organizations.read">
          <SidebarItem
            href="/organizations"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            label={collapsed ? "" : "Organizations"}
          onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="manage_service_types">
          <SidebarItem
            href="/settings/service-types"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            label={collapsed ? "" : "Service Types"}
          onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="services.read">
          <SidebarItem
            href="/services"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            label={collapsed ? "" : "Services"}
          onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="services.manage">
          <SidebarItem
            href="/events"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
              </svg>
            }
            label={collapsed ? "" : "Events"}
          onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="services.manage">
          <SidebarItem
            href="/volunteer-opportunities"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            label={collapsed ? "" : "Volunteer Opportunities"}
          onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="users.read">
          <SidebarItem
            href="/users"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            label={collapsed ? "" : "Users"}
          onClick={onClose}
          />
        </PermissionGate>


        <PermissionGate permission="roles.read">
          <SidebarItem
            href="/roles"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            label={collapsed ? "" : "Roles"}
          onClick={onClose}
          />
        </PermissionGate>


        <PermissionGate permission="reports.read">
          <SidebarItem
            href="/updates"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
            label={collapsed ? "" : "Updates"}
          onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="settings.read">
          <SidebarItem
            href="/settings"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label={collapsed ? "" : "Settings"}
          onClick={onClose}
          />
        </PermissionGate>
      </nav>

      {/* User Section & Logout */}
      <div className="border-t border-orange-700/30 p-4 space-y-1">
        <button 
          onClick={() => {
            handleLogout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-white rounded-lg hover:bg-white/10 transition-colors duration-200 group"
        >
          <span className="mr-3 flex-shrink-0 w-5 h-5 text-white">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          {!collapsed && <span className="flex-1 text-left">Logout</span>}
        </button>
      </div>
    </div>
  );
}