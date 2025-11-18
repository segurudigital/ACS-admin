# Frontend Permission Infrastructure Documentation

## Overview

This document describes the frontend permission infrastructure for the Adventist Community Services admin application. The system provides client-side permission checking, UI component protection, and seamless integration with the backend RBAC system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Permission Context](#permission-context)
4. [Permission Gates](#permission-gates)
5. [Auth Service Integration](#auth-service-integration)
6. [UI Component Protection](#ui-component-protection)
7. [Usage Patterns](#usage-patterns)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The frontend permission system follows a context-based architecture with component-level protection:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │───▶│  PermissionGate  │───▶│ PermissionContext│
│                 │    │                  │    │                 │
│ - Users Page    │    │ - <Can>          │    │ - hasPermission │
│ - Roles Page    │    │ - <Cannot>       │    │ - permissions[] │
│ - Organizations │    │ - <RoleGate>     │    │ - user context  │
│ - Sidebar       │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AuthService   │    │   API Calls      │    │   LocalStorage  │
│                 │    │                  │    │                 │
│ - verifyAuth    │    │ - Headers        │    │ - token         │
│ - login         │    │ - Organization   │    │ - permissions   │
│ - hasPermission │    │   Context        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Components

### 1. PermissionContext (`contexts/PermissionContext.tsx`)

**Purpose:** Central state management for user authentication and permissions.

```typescript
interface PermissionContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  currentOrganization: Organization | null;
  organizations: Organization[];
  role: string | null;
  switchOrganization: (organizationId: string) => void;
}
```

**Key Features:**
- User authentication state management
- Permission array management
- Organization context switching
- Dynamic permission loading
- JWT token validation

### 2. Permission Checking Logic

**Advanced Permission Checking:**
```typescript
const hasPermission = (permission: string): boolean => {
  if (!permissions || permissions.length === 0) {
    return false;
  }

  // 1. Check for wildcard permissions (*, all)
  if (permissions.includes('*') || permissions.includes('all')) {
    return true;
  }

  // 2. Check exact match
  if (permissions.includes(permission)) {
    return true;
  }

  // 3. Check resource wildcard (e.g., 'users.*' matches 'users.create')
  const [resource, action] = permission.split('.');
  if (permissions.includes(`${resource}.*`)) {
    return true;
  }

  // 4. Check for scoped permissions (e.g., 'organizations.create:subordinate' matches 'organizations.create')
  const hasScoped = permissions.some(perm => {
    const [permResource, permActionWithScope] = perm.split('.');
    if (!permActionWithScope || !permActionWithScope.includes(':')) {
      return false;
    }

    const [permAction] = permActionWithScope.split(':');
    return permResource === resource && permAction === action;
  });

  return hasScoped;
};
```

### 3. Organization Context Management

**Organization Switching:**
```typescript
const switchOrganization = async (organizationId: string) => {
  const org = organizations.find(o => o._id === organizationId);
  if (org) {
    setCurrentOrganization(org);
    await loadPermissionsForOrganization(organizationId);
  }
};

const loadPermissionsForOrganization = async (organizationId: string | undefined) => {
  if (!organizationId || !user) return;
  
  try {
    const token = AuthService.getToken();
    const response = await fetch(`/api/users/${user.id}/permissions?organizationId=${organizationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const permissionData = await response.json();
      setPermissions(permissionData.permissions || []);
      setRole(permissionData.role?.name || null);
    }
  } catch (error) {
    console.error('Error loading permissions for organization:', error);
  }
};
```

## Permission Gates

### 1. PermissionGate Component (`components/PermissionGate.tsx`)

**Purpose:** Conditional rendering based on single or multiple permissions.

```typescript
interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission } = usePermissions();

  // Single permission check
  if (permission && !permissions) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? permissions.every(perm => hasPermission(perm))
      : permissions.some(perm => hasPermission(perm));
    
    return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
};
```

### 2. RoleGate Component

**Purpose:** Role-based conditional rendering with organizational level support.

```typescript
interface RoleGateProps {
  role?: string;
  roles?: string[];
  level?: 'union' | 'conference' | 'church';
  fallback?: ReactNode;
  children: ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  role,
  roles,
  level,
  fallback = null,
  children
}) => {
  const { role: userRole, currentOrganization } = usePermissions();

  // Single role check with level validation
  if (role && !roles) {
    const hasRole = userRole === role;
    const hasCorrectLevel = !level || currentOrganization?.type === level;
    return (hasRole && hasCorrectLevel) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple roles check
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(userRole || '');
    const hasCorrectLevel = !level || currentOrganization?.type === level;
    return (hasRole && hasCorrectLevel) ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
};
```

### 3. Utility Components

**Can Component:**
```typescript
export const Can: React.FC<CanProps> = ({ permission, children }) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? <>{children}</> : null;
};
```

**Cannot Component:**
```typescript
export const Cannot: React.FC<CannotProps> = ({ permission, children }) => {
  const { hasPermission } = usePermissions();
  return !hasPermission(permission) ? <>{children}</> : null;
};
```

## Auth Service Integration

### 1. AuthService (`lib/auth.ts`)

**Purpose:** Handles authentication, token management, and permission validation.

```typescript
export class AuthService {
  // Login with permission loading
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();
    
    if (data.success) {
      // Store token and permissions
      this.setToken(data.data.token);
      this.setStoredPermissions(data.data.permissions);
    }
    
    return data;
  }

  // Verify authentication and load permissions
  static async verifyAuth(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/is-auth`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
      credentials: 'include',
    });

    const data = await response.json();

    return {
      success: true,
      message: 'Authentication verified',
      data: {
        user: data.data.user,
        permissions: data.data.permissions,
        role: data.data.role,
        token,
      },
    };
  }

  // Client-side permission checking
  static hasPermission(permission: string, userPermissions?: string[]): boolean {
    if (!userPermissions) {
      userPermissions = this.getStoredPermissions();
      if (!userPermissions) return false;
    }

    // Wildcard permissions
    if (userPermissions.includes('*') || userPermissions.includes('all')) return true;

    // Exact match
    if (userPermissions.includes(permission)) return true;

    // Resource wildcard
    const [resource, action] = permission.split('.');
    if (userPermissions.includes(`${resource}.*`)) return true;

    // Scoped permissions
    const matchesScoped = userPermissions.some(userPerm => {
      const [userResource, userActionWithScope] = userPerm.split('.');
      if (!userActionWithScope || !userActionWithScope.includes(':')) return false;

      const [userAction] = userActionWithScope.split(':');
      return userResource === resource && userAction === action;
    });

    return matchesScoped;
  }
}
```

### 2. Token and Permission Storage

```typescript
// Token management
static setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

static getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// Permission caching
static setStoredPermissions(permissions: string[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
  }
}

static getStoredPermissions(): string[] | null {
  if (typeof window !== 'undefined') {
    const permissions = localStorage.getItem('userPermissions');
    return permissions ? JSON.parse(permissions) : null;
  }
  return null;
}
```

## UI Component Protection

### 1. Navigation Protection (`components/Sidebar.tsx`)

```typescript
// Protected sidebar navigation
<PermissionGate permission="organizations.read">
  <SidebarItem href="/organizations" label="Organizations" />
</PermissionGate>

<PermissionGate permission="users.read">
  <SidebarItem href="/users" label="Users" />
</PermissionGate>

<PermissionGate permission="roles.read">
  <SidebarItem href="/roles" label="Roles" />
</PermissionGate>

<PermissionGate permission="services.read">
  <SidebarItem href="/services" label="Services" />
</PermissionGate>
```

### 2. Action Button Protection

**Users Page (`app/users/page.tsx`):**
```typescript
// Create user button
<PermissionGate permission="users.create">
  <Button onClick={() => setShowCreateModal(true)}>
    Add User
  </Button>
</PermissionGate>

// Table row actions
<ActionCell>
  <PermissionGate permission="users.assign_role">
    <IconButton onClick={() => openRoleModal(user)} icon={<UserIcon />} />
  </PermissionGate>
  
  <PermissionGate permission="users.update">
    <IconButton onClick={() => openEditModal(user)} icon={<PencilIcon />} />
  </PermissionGate>
  
  <PermissionGate permission="users.delete">
    <IconButton onClick={() => deleteUser(user)} icon={<TrashIcon />} variant="danger" />
  </PermissionGate>
</ActionCell>
```

**Organizations Page (`app/organizations/page.tsx`):**
```typescript
// Organization management actions
<PermissionGate permission="organizations.create">
  <Button onClick={() => setShowCreateModal(true)}>
    Add Organization
  </Button>
</PermissionGate>

<PermissionGate permission="organizations.update">
  <IconButton onClick={() => editOrganization(org)} icon={<PencilIcon />} />
</PermissionGate>

<PermissionGate permission="organizations.delete">
  <IconButton onClick={() => deleteOrganization(org)} icon={<TrashIcon />} />
</PermissionGate>
```

**Roles Page (`app/roles/page.tsx`):**
```typescript
// Role management actions
<PermissionGate permission="roles.create">
  <Button onClick={() => setShowCreateModal(true)}>
    Add Role
  </Button>
</PermissionGate>

<PermissionGate permission="roles.read">
  <IconButton onClick={() => viewRole(role)} icon={<EyeIcon />} />
</PermissionGate>

<PermissionGate permission="roles.update">
  <IconButton onClick={() => editRole(role)} icon={<PencilIcon />} />
</PermissionGate>

<PermissionGate permission="roles.delete">
  <IconButton onClick={() => deleteRole(role)} icon={<TrashIcon />} />
</PermissionGate>
```

### 3. Modal and Form Protection

**User Modal (`components/UserModal.tsx`):**
```typescript
// Role assignment section only for users with permission
<PermissionGate permission="users.assign_role">
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Assign Role
    </label>
    <RoleSelector 
      value={selectedRole}
      onChange={setSelectedRole}
      organizationId={selectedOrganization}
    />
  </div>
</PermissionGate>
```

## Usage Patterns

### 1. Page-Level Protection

```typescript
// Protect entire pages
export default function UsersPage() {
  const { hasPermission, loading } = usePermissions();

  if (loading) return <LoadingSpinner />;
  
  if (!hasPermission('users.read')) {
    return <UnauthorizedPage message="You don't have permission to view users" />;
  }

  return <UsersPageContent />;
}
```

### 2. Conditional Feature Rendering

```typescript
// Show/hide features based on permissions
function UserProfilePage({ user }) {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <UserDetails user={user} />
      
      <PermissionGate permission="users.update">
        <EditProfileForm user={user} />
      </PermissionGate>
      
      <Can permission="users.assign_role">
        <RoleManagementSection user={user} />
      </Can>
      
      <Cannot permission="users.delete">
        <p className="text-gray-500">Contact administrator to delete this user</p>
      </Cannot>
    </div>
  );
}
```

### 3. Multiple Permission Requirements

```typescript
// Require multiple permissions
<PermissionGate 
  permissions={['users.create', 'users.assign_role']} 
  requireAll={true}
  fallback={<p>You need both create and role assignment permissions</p>}
>
  <CreateUserWithRoleForm />
</PermissionGate>

// Require any of multiple permissions
<PermissionGate 
  permissions={['users.update', 'users.delete']} 
  requireAll={false}
>
  <UserActionsMenu />
</PermissionGate>
```

### 4. Role-Based Protection

```typescript
// Protect by role and organization level
<RoleGate role="church_pastor" level="church">
  <ChurchManagementPanel />
</RoleGate>

<RoleGate roles={['union_admin', 'conference_admin']}>
  <AdvancedAdministrationPanel />
</RoleGate>
```

### 5. Custom Hook Usage

```typescript
// Create custom permission hooks
export const useUserPermissions = () => {
  const { hasPermission } = usePermissions();
  
  return {
    canCreateUsers: hasPermission('users.create'),
    canEditUsers: hasPermission('users.update'),
    canDeleteUsers: hasPermission('users.delete'),
    canAssignRoles: hasPermission('users.assign_role'),
  };
};

// Use in components
function UserManagementToolbar() {
  const { canCreateUsers, canAssignRoles } = useUserPermissions();
  
  return (
    <div className="toolbar">
      {canCreateUsers && <CreateUserButton />}
      {canAssignRoles && <BulkRoleAssignButton />}
    </div>
  );
}
```

## Best Practices

### 1. Security Best Practices

```typescript
// Always validate permissions on both client and server
// Frontend checks are for UX only - not security

// ❌ Don't rely only on frontend checks
function deleteUser(userId) {
  // This request will still be validated by backend
  return api.deleteUser(userId);
}

// ✅ Provide user feedback while backend validates
function deleteUser(userId) {
  if (!hasPermission('users.delete')) {
    toast.error('You do not have permission to delete users');
    return;
  }
  
  return api.deleteUser(userId); // Backend will also validate
}
```

### 2. Performance Optimization

```typescript
// Use memoization for expensive permission checks
const memoizedPermissionCheck = useMemo(() => 
  hasPermission('complex.permission.check'), 
  [permissions]
);

// Batch permission checks
const userPermissions = useMemo(() => ({
  canCreate: hasPermission('users.create'),
  canEdit: hasPermission('users.update'),
  canDelete: hasPermission('users.delete'),
}), [permissions]);
```

### 3. Error Handling

```typescript
// Handle permission loading errors gracefully
const PermissionProvider = ({ children }) => {
  const [error, setError] = useState(null);
  
  const loadPermissions = async () => {
    try {
      // Load permissions
    } catch (error) {
      setError(error);
      // Fallback to safe defaults
      setPermissions([]);
    }
  };
  
  if (error) {
    return <PermissionErrorFallback error={error} />;
  }
  
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};
```

### 4. Testing Permissions

```typescript
// Mock permissions for testing
const mockPermissions = ['users.read', 'users.create'];

const renderWithPermissions = (component, permissions = mockPermissions) => {
  return render(
    <PermissionContext.Provider value={{ 
      permissions, 
      hasPermission: (perm) => permissions.includes(perm),
      // ... other context values
    }}>
      {component}
    </PermissionContext.Provider>
  );
};

// Test permission-protected components
test('shows create button for users with create permission', () => {
  renderWithPermissions(<UsersPage />, ['users.read', 'users.create']);
  expect(screen.getByText('Add User')).toBeInTheDocument();
});

test('hides create button for users without create permission', () => {
  renderWithPermissions(<UsersPage />, ['users.read']);
  expect(screen.queryByText('Add User')).not.toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **"Permission gate not working"**
   - Check if PermissionProvider wraps the application
   - Verify permissions are loaded in context
   - Ensure correct permission string format

2. **"User context is null"**
   - Check authentication flow
   - Verify token is valid and stored
   - Ensure auth verification completes before rendering

3. **"Permissions not updating after login"**
   - Check if context is properly refreshed
   - Verify backend returns correct permission format
   - Clear cached permissions if needed

### Debugging Tips

```typescript
// Debug permission context
const PermissionDebugger = () => {
  const context = usePermissions();
  
  console.log('Permission Context:', {
    user: context.user,
    permissions: context.permissions,
    currentOrganization: context.currentOrganization,
    loading: context.loading
  });
  
  return null;
};

// Add to app during development
<PermissionProvider>
  <PermissionDebugger />
  <App />
</PermissionProvider>
```

### Performance Monitoring

```typescript
// Monitor permission check performance
const usePermissionProfiler = () => {
  const startTime = performance.now();
  
  const profiledHasPermission = (permission) => {
    const result = hasPermission(permission);
    const endTime = performance.now();
    
    if (endTime - startTime > 10) { // Log slow checks
      console.warn(`Slow permission check: ${permission} took ${endTime - startTime}ms`);
    }
    
    return result;
  };
  
  return { hasPermission: profiledHasPermission };
};
```

## Future Enhancements

1. **Permission Caching:** Implement service worker for offline permission caching
2. **Real-time Updates:** WebSocket integration for permission updates
3. **A/B Testing:** Permission-based feature flagging system
4. **Analytics:** Track permission usage and access patterns
5. **Advanced Scoping:** More granular permission scopes and conditions
6. **Progressive Enhancement:** Graceful degradation for users with limited permissions