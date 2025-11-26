# Team-Based Navigation System

## Overview
The admin frontend now implements role-based navigation that adapts based on the user's team role and permissions.

## Navigation Structure

### Standard Navigation Items
All users with appropriate permissions see:
- Dashboard
- Organizations (requires `organizations.read`)
- Service Types (requires `manage_service_types`)
- Services (requires `services.read`)
- Events (requires `services.manage`)
- Volunteer Opportunities (requires `services.manage`)
- Users (requires `users.read`)
- Teams (requires `teams.read`)
- Roles (requires `roles.read`)
- Updates (requires `reports.read`)
- Settings (requires `settings.read`)

### Team-Specific Navigation

#### Team Leaders (`teamRole === 'leader'`)
Additional navigation items:
- **My Team** - Direct link to manage their team (`/teams/{teamId}`)
  - Requires `teams.manage_members` permission
  - Only shows when user has a current team

#### Communications Team Members (`teamRole === 'communications'`)
Additional navigation items:
- **Communications** - Special access to services with team badge
  - Shows services page with visual indicator
  - Requires `services.manage` permission

### Team Context Indicator
When a user is part of a team, the sidebar displays:
- Current team name
- User's role within the team (Leader/Member/Communications)
- Visual badge indicating role

## Implementation Details

### Components
1. **Sidebar.tsx** - Main navigation component
   - Uses `usePermissions` hook to access team context
   - Conditionally renders navigation items based on permissions and team role
   
2. **TeamPermissionGate.tsx** - New component for team-aware permission checking
   - Supports checking organization permissions, team permissions, and team roles
   - Can require all conditions or any condition to pass

### Permission Checking
The system uses two types of permission checks:
1. **Organization-level permissions** - Standard RBAC permissions
2. **Team-level permissions** - Team-specific access control

Team leaders automatically get enhanced permissions:
- `teams.read`, `teams.update`, `teams.manage_members`
- `services.*`, `users.read`

### Usage Example
```tsx
// Show only to team leaders
{teamRole === 'leader' && currentTeam && (
  <SidebarItem href={`/teams/${currentTeam._id}`} />
)}

// Show to users with specific team permission
<TeamPermissionGate teamPermission="teams.manage_members">
  <SidebarItem href="/team-admin" />
</TeamPermissionGate>

// Show to communications team members with service manage permission
<TeamPermissionGate 
  teamRole="communications" 
  permission="services.manage"
  requireAll={true}
>
  <SidebarItem href="/communications-panel" />
</TeamPermissionGate>
```

## Future Enhancements
1. Add team switcher in sidebar for users in multiple teams
2. Create team-specific dashboards
3. Add visual indicators for team-scoped vs organization-scoped access
4. Implement team-specific permission overrides