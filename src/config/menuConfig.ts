import { MenuItem, MenuSectionConfig, MenuSection, RoleCategory } from '@/types/menu';

// Role access tiers - defines which roles can access which menus
export const ROLE_ACCESS_TIERS: Record<string, RoleCategory[]> = {
  // All roles
  ALL: ['super_admin', 'union_admin', 'conference_admin', 'team_leader', 'team_member', 'communications', 'viewer'],

  // Admin tiers
  SUPER_ADMIN_ONLY: ['super_admin'],
  ADMIN_TIERS: ['super_admin', 'union_admin', 'conference_admin'],
  UNION_AND_ABOVE: ['super_admin', 'union_admin'],

  // Hierarchy management
  HIERARCHY_FULL: ['super_admin', 'union_admin'],
  HIERARCHY_PARTIAL: ['super_admin', 'union_admin', 'conference_admin'],

  // Service management
  SERVICE_MANAGERS: ['super_admin', 'union_admin', 'conference_admin', 'team_leader'],

  // Team access
  TEAM_MEMBERS_AND_ABOVE: ['super_admin', 'union_admin', 'conference_admin', 'team_leader', 'team_member', 'communications'],

  // Viewers
  DASHBOARD_AND_REPORTS: ['super_admin', 'union_admin', 'conference_admin', 'team_leader', 'team_member', 'communications', 'viewer'],
};

// Section configuration with ordering
export const MENU_SECTIONS: MenuSectionConfig[] = [
  { id: 'main', title: '', order: 0 },
  { id: 'hierarchy', title: 'Hierarchy', order: 1 },
  { id: 'services_events', title: 'Services & Events', order: 2 },
  { id: 'user_management', title: 'User Management', order: 3 },
  { id: 'media', title: '', order: 4 },
  { id: 'my_team', title: 'My Team', order: 5 },
  { id: 'system', title: 'System', order: 6 },
];

// Complete menu configuration
export const MENU_ITEMS: MenuItem[] = [
  // ======================
  // MAIN SECTION (Dashboard - Always visible)
  // ======================
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    section: 'main',
    allowedRoles: ROLE_ACCESS_TIERS.ALL,
  },

  // ======================
  // HIERARCHY SECTION
  // ======================
  {
    id: 'unions',
    label: 'Unions',
    href: '/unions',
    icon: 'unions',
    section: 'hierarchy',
    allowedRoles: ROLE_ACCESS_TIERS.UNION_AND_ABOVE,
    requiredPermission: 'unions.read',
  },
  {
    id: 'conferences',
    label: 'Conferences',
    href: '/conferences',
    icon: 'conferences',
    section: 'hierarchy',
    allowedRoles: ROLE_ACCESS_TIERS.HIERARCHY_PARTIAL,
    requiredPermission: 'conferences.read',
  },
  {
    id: 'churches',
    label: 'Churches',
    href: '/churches',
    icon: 'churches',
    section: 'hierarchy',
    allowedRoles: ['super_admin', 'union_admin', 'conference_admin', 'team_leader'],
    requiredPermission: 'churches.read',
  },
  {
    id: 'team-types',
    label: 'Team Types',
    href: '/team-types',
    icon: 'team-types',
    section: 'hierarchy',
    allowedRoles: ROLE_ACCESS_TIERS.HIERARCHY_PARTIAL,
    requiredPermission: 'teams.manage',
  },
  {
    id: 'teams',
    label: 'Teams',
    href: '/teams',
    icon: 'teams',
    section: 'hierarchy',
    allowedRoles: ['super_admin', 'union_admin', 'conference_admin', 'team_leader'],
    requiredPermission: 'teams.read',
  },

  // ======================
  // SERVICES & EVENTS SECTION
  // ======================
  {
    id: 'services',
    label: 'Services',
    href: '/services',
    icon: 'services',
    section: 'services_events',
    allowedRoles: ROLE_ACCESS_TIERS.SERVICE_MANAGERS,
    requiredPermission: 'services.read',
  },
  {
    id: 'service-types',
    label: 'Service Types',
    href: '/settings/service-types',
    icon: 'service-types',
    section: 'services_events',
    allowedRoles: ROLE_ACCESS_TIERS.ADMIN_TIERS,
    requiredPermission: 'manage_service_types',
  },
  {
    id: 'events',
    label: 'Events',
    href: '/events',
    icon: 'events',
    section: 'services_events',
    allowedRoles: ROLE_ACCESS_TIERS.SERVICE_MANAGERS,
    requiredPermission: 'services.manage',
  },
  {
    id: 'volunteer-opportunities',
    label: 'Volunteer Opportunities',
    href: '/volunteer-opportunities',
    icon: 'volunteer-opportunities',
    section: 'services_events',
    allowedRoles: ROLE_ACCESS_TIERS.SERVICE_MANAGERS,
    requiredPermission: 'services.manage',
  },

  // ======================
  // USER MANAGEMENT SECTION
  // ======================
  {
    id: 'users',
    label: 'Users',
    href: '/users',
    icon: 'users',
    section: 'user_management',
    allowedRoles: ROLE_ACCESS_TIERS.HIERARCHY_PARTIAL,
    requiredPermission: 'users.read',
  },
  {
    id: 'roles',
    label: 'Roles',
    href: '/roles',
    icon: 'roles',
    section: 'user_management',
    allowedRoles: ROLE_ACCESS_TIERS.UNION_AND_ABOVE,
    requiredPermission: 'roles.read',
  },

  // ======================
  // MEDIA SECTION
  // ======================
  {
    id: 'media',
    label: 'Media Gallery',
    href: '/media',
    icon: 'media',
    section: 'media',
    allowedRoles: ROLE_ACCESS_TIERS.TEAM_MEMBERS_AND_ABOVE,
  },

  // ======================
  // MY TEAM SECTION (Conditional)
  // ======================
  {
    id: 'my-team',
    label: 'My Team',
    href: (context) => `/teams/${context.currentTeam?._id}`,
    icon: 'my-team',
    section: 'my_team',
    allowedRoles: ['team_leader'],
    requiredPermission: 'teams.manage_members',
    condition: (context) => context.teamRole === 'leader' && !!context.currentTeam,
  },
  {
    id: 'communications',
    label: 'Communications',
    href: '/services',
    icon: 'communications',
    section: 'my_team',
    allowedRoles: ['communications'],
    requiredPermission: 'services.manage',
    badge: 'Team',
    condition: (context) => context.teamRole === 'communications',
  },

  // ======================
  // SYSTEM SECTION
  // ======================
  {
    id: 'updates',
    label: 'Updates',
    href: '/updates',
    icon: 'updates',
    section: 'system',
    allowedRoles: ROLE_ACCESS_TIERS.ALL,
    requiredPermission: 'reports.read',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: 'settings',
    section: 'system',
    allowedRoles: ROLE_ACCESS_TIERS.ADMIN_TIERS,
    condition: (context) =>
      context.permissions.includes('*') ||
      context.permissions.includes('manage_service_types'),
  },
];

// Helper function to get menu items by section
export function getMenuItemsBySection(): Record<MenuSection, MenuItem[]> {
  const result: Record<MenuSection, MenuItem[]> = {
    main: [],
    hierarchy: [],
    services_events: [],
    user_management: [],
    media: [],
    my_team: [],
    system: [],
  };

  MENU_ITEMS.forEach((item) => {
    result[item.section].push(item);
  });

  return result;
}
