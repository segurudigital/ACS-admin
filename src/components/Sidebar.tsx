'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AuthService } from '../lib/auth';
import SidebarItem from './SidebarItem';
import SidebarSectionHeader from './SidebarSectionHeader';
import { PermissionGate } from './PermissionGate';
import { useHierarchicalPermissions } from '../contexts/HierarchicalPermissionContext';

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const router = useRouter();
  const { teamRole, currentTeam, permissions } = useHierarchicalPermissions();
  
  // Check if user has any meaningful settings they can manage
  const hasSettingsAccess = permissions.includes('*') || permissions.includes('manage_service_types');

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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#F25F29] to-[#F23E16]">
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
              <p className="text-sm text-white truncate">
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

      {/* Team Context Indicator */}
      {currentTeam && !collapsed && (
        <div className="px-4 py-3 border-b border-orange-700/30">
          <div className="text-xs text-white mb-1">Current Team</div>
          <div className="text-sm font-medium text-white flex items-center">
            <span className="truncate">{currentTeam.name}</span>
            {teamRole && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {teamRole.charAt(0).toUpperCase() + teamRole.slice(1)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {/* Dashboard - Always first */}
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

        {/* Hierarchy Management Section */}
        <SidebarSectionHeader title="Hierarchy" collapsed={collapsed} />
        
        <PermissionGate permission="unions.read">
          <SidebarItem
            href="/unions"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            label={collapsed ? "" : "Unions"}
            onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="conferences.read">
          <SidebarItem
            href="/conferences"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            }
            label={collapsed ? "" : "Conferences"}
            onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="teams.read">
          <SidebarItem
            href="/teams"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            label={collapsed ? "" : "Teams"}
            onClick={onClose}
          />
        </PermissionGate>

        <PermissionGate permission="teams.manage">
          <SidebarItem
            href="/team-types"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            label={collapsed ? "" : "Team Types"}
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

        {/* Services & Events Section */}
        <SidebarSectionHeader title="Services & Events" collapsed={collapsed} />
        
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            label={collapsed ? "" : "Volunteer Opportunities"}
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

        {/* Media Gallery - Available to all authenticated users */}
        <SidebarItem
          href="/media"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label={collapsed ? "" : "Media Gallery"}
          onClick={onClose}
        />

        {/* Team-Specific Section */}
        {((teamRole === 'leader' && currentTeam) || teamRole === 'communications') && (
          <>
            <SidebarSectionHeader title="My Team" collapsed={collapsed} />
            
            {/* Team Leader specific navigation */}
            {teamRole === 'leader' && currentTeam && (
              <PermissionGate permission="teams.manage_members">
                <SidebarItem
                  href={`/teams/${currentTeam._id}`}
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  }
                  label={collapsed ? "" : "My Team"}
                  onClick={onClose}
                />
              </PermissionGate>
            )}

            {/* Communications Team specific navigation */}
            {teamRole === 'communications' && (
              <PermissionGate permission="services.manage">
                <SidebarItem
                  href="/services"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  }
                  label={collapsed ? "" : "Communications"}
                  badge="Team"
                  onClick={onClose}
                />
              </PermissionGate>
            )}
          </>
        )}

        {/* System Section */}
        <SidebarSectionHeader title="System" collapsed={collapsed} />
        
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

        {hasSettingsAccess && (
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
        )}
      </nav>

      {/* User Section & Logout */}
      <div className="border-t border-orange-700/30 p-4 space-y-1">
        <button 
          onClick={() => {
            handleLogout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-white/10 transition-colors duration-200 group"
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