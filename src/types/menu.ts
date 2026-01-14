// Menu Type Definitions for Role-Based Sidebar

// Icon identifiers matching the SVG icons in MenuIcon component
export type MenuIconId =
  | 'dashboard'
  | 'unions'
  | 'conferences'
  | 'churches'
  | 'team-types'
  | 'teams'
  | 'services'
  | 'service-types'
  | 'events'
  | 'volunteer-opportunities'
  | 'users'
  | 'roles'
  | 'media'
  | 'my-team'
  | 'communications'
  | 'updates'
  | 'settings';

// Role categories from backend Role model
export type RoleCategory =
  | 'super_admin'
  | 'union_admin'
  | 'conference_admin'
  | 'team_leader'
  | 'team_member'
  | 'communications'
  | 'viewer';

// Menu section identifiers
export type MenuSection =
  | 'main'
  | 'hierarchy'
  | 'services_events'
  | 'user_management'
  | 'media'
  | 'my_team'
  | 'system';

// Team interface for menu context
export interface MenuTeam {
  _id: string;
  name: string;
  type?: string;
  churchId?: string;
  hierarchyPath?: string;
}

// Context passed to dynamic menu items
export interface MenuContext {
  teamRole: 'leader' | 'member' | 'communications' | null;
  currentTeam: MenuTeam | null | undefined;
  roleCategory: RoleCategory | null;
  permissions: string[];
  hierarchyLevel: number;
}

// Individual menu item configuration
export interface MenuItem {
  id: string;
  label: string;
  href: string | ((context: MenuContext) => string);
  icon: MenuIconId;
  section: MenuSection;
  allowedRoles: RoleCategory[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
  badge?: string | number;
  condition?: (context: MenuContext) => boolean;
}

// Menu section configuration
export interface MenuSectionConfig {
  id: MenuSection;
  title: string;
  order: number;
}

// Filtered menu result
export interface FilteredMenuResult {
  sections: MenuSectionConfig[];
  items: MenuItem[];
  itemsBySection: Record<MenuSection, MenuItem[]>;
}
