# Frontend Integration Guide for ACS Service Model

## Overview

This guide explains how to integrate the ACS Service Model with your frontend application (Next.js, React, or similar). The system has two main sections:

1. **Public Site** - No authentication required
2. **Admin Dashboard** - Requires authentication and permissions

## Public Site Integration

### 1. Fetching Services

```javascript
// Get all active services
const response = await fetch('/api/services');
const { services } = await response.json();

// Search services by location
const response = await fetch('/api/services?lat=-37.8136&lng=144.9631&radius=10');
const { services } = await response.json();

// Search services by text
const response = await fetch('/api/services?search=food+pantry');
const { services } = await response.json();

// Filter by type
const response = await fetch('/api/services?type=food_pantry');
const { services } = await response.json();
```

### 2. Service Detail Page

```javascript
// Get service details
const response = await fetch(`/api/services/${serviceId}`);
const { service } = await response.json();

// Get service events
const eventsResponse = await fetch(`/api/services/${serviceId}/events`);
const { events } = await eventsResponse.json();

// Get volunteer opportunities
const rolesResponse = await fetch(`/api/services/${serviceId}/volunteer-roles`);
const { roles } = await rolesResponse.json();

// Get service stories
const storiesResponse = await fetch(`/api/services/${serviceId}/stories`);
const { stories } = await storiesResponse.json();
```

### 3. Public Components Example

```jsx
// ServiceCard.jsx
function ServiceCard({ service }) {
  return (
    <div className="service-card">
      <img src={service.primaryImage?.url} alt={service.primaryImage?.alt} />
      <h3>{service.name}</h3>
      <p className="org-name">{service.organization.name}</p>
      <p className="description">{service.descriptionShort}</p>
      <div className="service-type">{service.type}</div>
      {service.locations.map(location => (
        <div key={location.label} className="location">
          <span>{location.label}</span>
          <address>
            {location.address.street}, {location.address.suburb}
          </address>
        </div>
      ))}
      <Link href={`/services/${service._id}`}>Learn More</Link>
    </div>
  );
}

// ServiceList.jsx
function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data.services);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="services-grid">
      {services.map(service => (
        <ServiceCard key={service._id} service={service} />
      ))}
    </div>
  );
}
```

## Admin Dashboard Integration

### 1. Authentication & Permissions

First, fetch the user's permissions when they log in:

```javascript
// UserContext.jsx
const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const userData = await response.json();
    setUser(userData.user);
    
    // Process permissions by organization
    const permissionsByOrg = {};
    userData.user.organizations.forEach(org => {
      permissionsByOrg[org.organization._id] = {
        organizationName: org.organization.name,
        role: org.role.name,
        permissions: org.role.permissions
      };
    });
    
    setPermissions(permissionsByOrg);
  };

  const hasPermission = (orgId, permission) => {
    const orgPerms = permissions[orgId];
    if (!orgPerms) return false;
    
    return orgPerms.permissions.includes(permission) || 
           orgPerms.permissions.includes('services.*');
  };

  return (
    <UserContext.Provider value={{ user, permissions, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
}
```

### 2. Admin Service Management

```jsx
// AdminServiceList.jsx
function AdminServiceList() {
  const { user, hasPermission } = useContext(UserContext);
  const [services, setServices] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    fetchManageableServices();
  }, []);

  const fetchManageableServices = async () => {
    const response = await fetch('/api/services/manageable', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setServices(data.services);
  };

  const canEdit = (service) => {
    return hasPermission(service.organization._id, 'services.update') ||
           hasPermission(service.organization._id, 'services.update:own');
  };

  const canDelete = (service) => {
    return hasPermission(service.organization._id, 'services.delete');
  };

  return (
    <div className="admin-services">
      <div className="actions">
        {user.organizations.map(org => (
          hasPermission(org.organization._id, 'services.create') && (
            <button 
              key={org.organization._id}
              onClick={() => setSelectedOrg(org.organization._id)}
            >
              Add Service for {org.organization.name}
            </button>
          )
        ))}
      </div>

      <div className="services-table">
        {services.map(service => (
          <div key={service._id} className="service-row">
            <h4>{service.name}</h4>
            <span>{service.organization.name}</span>
            <span className={`status ${service.status}`}>{service.status}</span>
            
            <div className="actions">
              {canEdit(service) && (
                <Link href={`/admin/services/${service._id}/edit`}>Edit</Link>
              )}
              
              {canDelete(service) && (
                <button onClick={() => handleDelete(service._id)}>Archive</button>
              )}
              
              <Link href={`/admin/services/${service._id}/events`}>Manage Events</Link>
              <Link href={`/admin/services/${service._id}/stories`}>Manage Stories</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Service Form with Organization Selection

```jsx
// ServiceForm.jsx
function ServiceForm({ serviceId = null }) {
  const { user, hasPermission } = useContext(UserContext);
  const [service, setService] = useState({
    name: '',
    type: '',
    organization: '',
    descriptionShort: '',
    descriptionLong: '',
    locations: []
  });
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    // Get organizations where user can create services
    fetchOrganizations();
    
    // If editing, load service data
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const fetchOrganizations = async () => {
    const response = await fetch('/api/services/organizations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setOrganizations(data.organizations);
  };

  const fetchService = async () => {
    const response = await fetch(`/api/services/${serviceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setService(data.service);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = serviceId 
      ? `/api/services/${serviceId}` 
      : '/api/services';
    
    const method = serviceId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(service)
    });
    
    if (response.ok) {
      // Handle success
    } else {
      const error = await response.json();
      // Handle error - show permission error if 403
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!serviceId && (
        <select 
          value={service.organization} 
          onChange={(e) => setService({...service, organization: e.target.value})}
          required
        >
          <option value="">Select Organization</option>
          {organizations.map(orgId => {
            const org = user.organizations.find(o => o.organization._id === orgId);
            return (
              <option key={orgId} value={orgId}>
                {org?.organization.name}
              </option>
            );
          })}
        </select>
      )}
      
      {/* Rest of form fields */}
    </form>
  );
}
```

### 4. Permission-Based UI Rendering

```jsx
// PermissionGate.jsx
function PermissionGate({ orgId, permission, children, fallback = null }) {
  const { hasPermission } = useContext(UserContext);
  
  if (hasPermission(orgId, permission)) {
    return children;
  }
  
  return fallback;
}

// Usage
<PermissionGate orgId={service.organization._id} permission="services.update">
  <button>Edit Service</button>
</PermissionGate>

// ServiceActions.jsx
function ServiceActions({ service }) {
  const { hasPermission } = useContext(UserContext);
  const orgId = service.organization._id;
  
  return (
    <div className="service-actions">
      {hasPermission(orgId, 'services.update') && (
        <Link href={`/admin/services/${service._id}/edit`}>
          <button>Edit Details</button>
        </Link>
      )}
      
      {hasPermission(orgId, 'services.manage') && (
        <>
          <Link href={`/admin/services/${service._id}/events`}>
            <button>Manage Events</button>
          </Link>
          <Link href={`/admin/services/${service._id}/volunteers`}>
            <button>Manage Volunteers</button>
          </Link>
        </>
      )}
      
      {hasPermission(orgId, 'stories.create') && (
        <Link href={`/admin/stories/new?service=${service._id}`}>
          <button>Create Story</button>
        </Link>
      )}
      
      {hasPermission(orgId, 'services.delete') && (
        <button 
          className="danger" 
          onClick={() => handleArchive(service._id)}
        >
          Archive Service
        </button>
      )}
    </div>
  );
}
```

## Key Implementation Notes

### 1. Organization Context
- Services belong to exactly one organization
- Users can be assigned to multiple organizations with different roles
- Always check permissions against the specific organization that owns the content

### 2. Permission Scopes
- **No scope** (e.g., `services.manage`) - User must be in the same organization
- **:own** scope (e.g., `services.update:own`) - User must be directly assigned to that organization
- **:subordinate** scope (e.g., `services.manage:subordinate`) - User can manage child organizations

### 3. Status Management
- Services have status: `active`, `paused`, `archived`
- Only `active` services appear in public listings
- Users with appropriate permissions can see all statuses

### 4. Error Handling
```javascript
// API call with error handling
try {
  const response = await fetch('/api/services', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 403) {
      // Permission denied
      showError(`You don't have permission to ${error.required} for ${error.organization}`);
    } else if (response.status === 401) {
      // Not authenticated
      redirectToLogin();
    } else {
      // Other error
      showError(error.message || 'An error occurred');
    }
    return;
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  // Network error
  showError('Network error. Please try again.');
}
```

### 5. Caching Considerations
- Cache public service listings aggressively
- Invalidate cache when services are updated
- User permissions should be fetched fresh or with short TTL
- Consider using React Query, SWR, or similar for data fetching

## Mobile App Considerations

If building a React Native app:
1. Use the same API endpoints
2. Store auth token securely (AsyncStorage/Keychain)
3. Implement offline support for viewing cached services
4. Use geolocation for "services near me" feature
5. Consider push notifications for event reminders