# RBAC Integration Guide for Admin Frontend

This guide explains how to integrate the Role-Based Access Control (RBAC) system into the admin frontend.

## Overview

The RBAC system has been integrated with the following components:
- API Service for RBAC endpoints
- Extended AuthService with permission methods
- Permission Context for global state management
- PermissionGate components for conditional rendering
- Organization selector for context switching
- Type definitions for TypeScript support

## Setup

### 1. Wrap Your App with PermissionProvider

Update your root layout to include the PermissionProvider:

```tsx
// app/layout.tsx
import { PermissionProvider } from '@/contexts/PermissionContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PermissionProvider>
          {children}
        </PermissionProvider>
      </body>
    </html>
  );
}
```

### 2. Add Organization Selector to Layout

Add the organization selector to your admin layout header:

```tsx
// components/AdminLayout.tsx
import { OrganizationSelector, OrganizationBadge } from '@/components/OrganizationSelector';

// In your header component:
<header>
  <div className="flex items-center justify-between">
    <OrganizationBadge />
    <OrganizationSelector />
  </div>
</header>
```

## Usage Examples

### 1. Permission-Based Rendering

Use the PermissionGate component to conditionally render UI elements:

```tsx
import { PermissionGate, Can, Cannot } from '@/components/PermissionGate';

// Basic permission check
<PermissionGate permission="users.create">
  <button>Create User</button>
</PermissionGate>

// Multiple permissions (ANY)
<PermissionGate permissions={['users.create', 'users.update']}>
  <div>User Management Controls</div>
</PermissionGate>

// Multiple permissions (ALL)
<PermissionGate 
  permissions={['users.create', 'users.update']} 
  requireAll={true}
>
  <div>Full User Management</div>
</PermissionGate>

// With fallback
<PermissionGate 
  permission="reports.export"
  fallback={<p>You don't have permission to export reports</p>}
>
  <button>Export Report</button>
</PermissionGate>

// Inline permission checks
<Can permission="users.delete">
  <button className="text-red-600">Delete User</button>
</Can>

<Cannot permission="users.create">
  <p>Contact your administrator to create users</p>
</Cannot>
```

### 2. Role-Based Rendering

Use RoleGate for role-specific UI:

```tsx
import { RoleGate } from '@/components/PermissionGate';

// Check specific role
<RoleGate role="union_admin">
  <AdminDashboard />
</RoleGate>

// Check multiple roles
<RoleGate roles={['church_pastor', 'church_acs_leader']}>
  <ChurchManagementPanel />
</RoleGate>

// Check role level
<RoleGate level="conference">
  <ConferenceReports />
</RoleGate>
```

### 3. Using Permission Hooks

```tsx
import { usePermissions, useHasPermission, useRole, useCurrentOrganization } from '@/contexts/PermissionContext';

function MyComponent() {
  // Get all permission data
  const { user, permissions, hasPermission, loading } = usePermissions();
  
  // Check specific permission
  const canCreateUsers = useHasPermission('users.create');
  
  // Get current role
  const role = useRole();
  
  // Get current organization
  const organization = useCurrentOrganization();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      <p>Current Organization: {organization?.name}</p>
      <p>Role: {role?.displayName}</p>
      
      {canCreateUsers && (
        <button>Create New User</button>
      )}
    </div>
  );
}
```

### 4. API Calls with RBAC

The RBAC service automatically includes organization context in API calls:

```tsx
import { rbacService } from '@/lib/rbac';

// Fetch organizations accessible to the user
const organizations = await rbacService.getOrganizations();

// Create a new user with role
await rbacService.assignUserRole(userId, organizationId, 'church_team_member');

// Get user permissions
const permissions = await rbacService.getUserPermissions(userId);
```

### 5. Protected Routes

Create a protected route wrapper:

```tsx
// components/ProtectedRoute.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { PermissionGate } from '@/components/PermissionGate';

export function ProtectedRoute({ 
  children, 
  permission,
  fallbackUrl = '/dashboard'
}: { 
  children: React.ReactNode;
  permission: string;
  fallbackUrl?: string;
}) {
  const router = useRouter();
  const { loading } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PermissionGate 
      permission={permission}
      fallback={
        <div>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => router.push(fallbackUrl)}>
            Go to Dashboard
          </button>
        </div>
      }
    >
      {children}
    </PermissionGate>
  );
}

// Usage in pages
export default function UsersPage() {
  return (
    <ProtectedRoute permission="users.read">
      <UserManagementComponent />
    </ProtectedRoute>
  );
}
```

## Permission String Format

Permissions follow the format: `resource.action:scope`

### Resources
- `organizations` - Organization management
- `users` - User management
- `roles` - Role management
- `reports` - Report access
- `services` - Service management
- `settings` - Settings access
- `notifications` - Notification management

### Actions
- `create` - Create new resources
- `read` - View resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `assign_role` - Assign roles to users
- `export` - Export data

### Scopes
- `own` - Only within user's organization
- `subordinate` - Include subordinate organizations
- `all` - All organizations (union level)
- `self` - Only user's own data

## Updating Existing Components

### Sidebar Navigation

Update your sidebar to show/hide items based on permissions:

```tsx
// components/Sidebar.tsx
import { Can } from '@/components/PermissionGate';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    permission: null, // Available to all
  },
  {
    name: 'Users',
    href: '/users',
    permission: 'users.read',
  },
  {
    name: 'Organizations',
    href: '/organizations',
    permission: 'organizations.read',
  },
  {
    name: 'Reports',
    href: '/reports',
    permission: 'reports.read',
  },
];

export function Sidebar() {
  return (
    <nav>
      {navigationItems.map((item) => (
        item.permission ? (
          <Can key={item.name} permission={item.permission}>
            <Link href={item.href}>{item.name}</Link>
          </Can>
        ) : (
          <Link key={item.name} href={item.href}>{item.name}</Link>
        )
      ))}
    </nav>
  );
}
```

### Action Buttons

Conditionally show action buttons:

```tsx
// In a user list component
<div className="flex gap-2">
  <Can permission="users.update">
    <button onClick={() => editUser(user.id)}>Edit</button>
  </Can>
  
  <Can permission="users.delete">
    <button 
      onClick={() => deleteUser(user.id)}
      className="text-red-600"
    >
      Delete
    </button>
  </Can>
</div>
```

## Best Practices

1. **Always check permissions on both frontend and backend**
   - Frontend checks improve UX by hiding unavailable actions
   - Backend checks ensure security

2. **Use semantic permission names**
   - `users.create` instead of `create_user`
   - Consistent resource.action pattern

3. **Handle loading states**
   - Show loading indicators while permissions are being fetched
   - Avoid layout shifts when permissions load

4. **Provide meaningful fallbacks**
   - Tell users why they can't access something
   - Suggest alternatives or who to contact

5. **Cache permissions appropriately**
   - Permissions are cached in localStorage
   - Refresh when user switches organizations

## Troubleshooting

### Permission checks always return false
- Ensure PermissionProvider is wrapping your app
- Check if user is authenticated
- Verify organization context is set
- Check browser console for API errors

### Organization selector is empty
- Verify user has organization assignments in the database
- Check RBAC API endpoints are accessible
- Ensure proper authentication headers are sent

### Components flicker during permission checks
- Use loading states appropriately
- Consider server-side rendering for initial permission state
- Implement skeleton loaders for better UX

## Migration Checklist

- [ ] Add PermissionProvider to root layout
- [ ] Update AdminLayout with organization selector
- [ ] Replace role-based checks with permission checks
- [ ] Update navigation menu with permission gates
- [ ] Add permission checks to all action buttons
- [ ] Implement protected routes for sensitive pages
- [ ] Test with different user roles
- [ ] Update error messages for permission denials