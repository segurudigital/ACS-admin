"use client"

import Card from "@/components/Card"
import AdminLayout from "@/components/AdminLayout"
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  CircleStackIcon, 
  PaintBrushIcon, 
  ArrowPathIcon, 
  ShieldCheckIcon, 
  BoltIcon
} from "@heroicons/react/24/outline"

interface Update {
  id: string
  title: string
  description: string
  date: string
  version?: string
  type: 'feature' | 'infrastructure' | 'security' | 'bugfix' | 'enhancement'
  details: string[]
  impact: 'low' | 'medium' | 'high'
}

const updates: Update[] = [
  {
    id: "1",
    title: "Authentication & User System",
    description: "Complete user authentication with JWT and email verification",
    date: "2024-11-04",
    version: "1.0.0",
    type: "feature",
    details: [
      "Implemented JWT-based authentication system",
      "Added user registration and login functionality", 
      "Created email verification with token system",
      "Built password reset flow with secure tokens",
      "Added bcrypt password hashing",
      "Implemented session validation middleware"
    ],
    impact: "high"
  },
  {
    id: "2",
    title: "Admin Dashboard & UI Framework",
    description: "Complete admin interface with responsive design",
    date: "2024-11-04",
    version: "1.0.1",
    type: "infrastructure",
    details: [
      "Built responsive admin dashboard with Next.js 14",
      "Created custom component library (Card, Modal, DataTable)",
      "Implemented Tailwind CSS design system",
      "Added permission-based navigation sidebar",
      "Created toast notification system",
      "Built search and filtering components"
    ],
    impact: "high"
  },
  {
    id: "3",
    title: "Security & Validation Framework",
    description: "Comprehensive security measures and input validation",
    date: "2024-11-04",
    version: "1.0.2",
    type: "security",
    details: [
      "Implemented express-validator for input validation",
      "Added CORS security configuration",
      "Integrated Helmet for security headers",
      "Created authentication middleware",
      "Added file upload validation and security",
      "Implemented error handling and logging"
    ],
    impact: "high"
  },
  {
    id: "4",
    title: "Hierarchical Organization Structure",
    description: "Three-tier ACS organization management (Union > Conference > Church)",
    date: "2024-11-05",
    version: "1.1.0",
    type: "feature",
    details: [
      "Created Union, Conference, and Church hierarchy",
      "Implemented parent-child organization relationships",
      "Built organization creation with validation",
      "Added organization management UI",
      "Created hierarchical permission inheritance",
      "Implemented organization-scoped data access"
    ],
    impact: "high"
  },
  {
    id: "5",
    title: "RBAC Permission System",
    description: "Comprehensive role-based access control with scoped permissions",
    date: "2024-11-06",
    version: "1.2.0",
    type: "infrastructure",
    details: [
      "Designed fine-grained permission system",
      "Created system roles (super_admin, union_admin, conference_admin, etc.)",
      "Implemented permission scopes (self, own, subordinate, all)",
      "Built PermissionGate component for UI access control",
      "Added permission categories and management",
      "Created role assignment interface"
    ],
    impact: "high"
  },
  {
    id: "6",
    title: "Community Services Management",
    description: "Comprehensive service management system for ACS programs with advanced features",
    date: "2024-11-07",
    version: "1.3.0",
    type: "feature",
    details: [
      "Built comprehensive service CRUD operations with soft delete",
      "Implemented service status management (active/paused/archived)",
      "Added geographic location with coordinate mapping and multiple locations",
      "Created contact management with social media integration",
      "Built banner image and gallery management (max 20 images per service)",
      "Added eligibility requirements and capacity tracking with notes",
      "Implemented service discovery with location-based and text search",
      "Created featured services with expiration management",
      "Added service tags and categorization system",
      "Integrated cloud storage for image uploads with thumbnail generation"
    ],
    impact: "high"
  },
  {
    id: "7",
    title: "User Management Interface",
    description: "Complete user administration with role assignments",
    date: "2024-11-08",
    version: "1.4.0",
    type: "feature",
    details: [
      "Created user listing with search and pagination",
      "Built user creation and editing modals",
      "Implemented multi-organization role assignment",
      "Added email verification management",
      "Created user profile management interface",
      "Added user deletion with confirmation"
    ],
    impact: "medium"
  },
  {
    id: "8",
    title: "Service Events & Scheduling",
    description: "Comprehensive event management system with advanced scheduling and registration",
    date: "2024-11-11",
    version: "1.5.0",
    type: "feature",
    details: [
      "Created comprehensive event types (workshop, training, fundraiser, community_meal, distribution, health_screening)",
      "Implemented advanced scheduling with recurring patterns (daily, weekly, monthly)",
      "Built registration system with capacity limits and external link integration",
      "Added flexible location management (service location or custom)",
      "Created event status workflow (draft, published, cancelled, completed)",
      "Implemented visibility controls (public, members_only, private)",
      "Added event cancellation tracking with reason documentation",
      "Built event-service relationship management with permission controls"
    ],
    impact: "medium"
  },
  {
    id: "9",
    title: "Volunteer Management System",
    description: "Advanced volunteer role management with detailed requirements and tracking",
    date: "2024-11-12",
    version: "1.6.0",
    type: "feature",
    details: [
      "Created comprehensive volunteer role categories (administration, direct_service, fundraising, etc.)",
      "Built detailed requirement specification (skills, experience, background checks)",
      "Added working with children check and age restriction management",
      "Implemented training requirement tracking with descriptions",
      "Created flexible time commitment options (one_time, occasional, regular, flexible)",
      "Built location types (on_site, remote, hybrid) with benefits listing",
      "Added position management (tracking needed vs filled positions)",
      "Created application process configuration (email, phone, online form, in-person)",
      "Implemented status tracking (draft, open, closed, filled, paused)"
    ],
    impact: "medium"
  },
  {
    id: "10",
    title: "Stories & Content Management",
    description: "Comprehensive story system with rich content, media, and service integration",
    date: "2024-11-13",
    version: "1.7.0",
    type: "feature",
    details: [
      "Built comprehensive story types (beneficiary, volunteer, donor, community, organization)",
      "Created rich content editor with body text, summaries, and titles",
      "Implemented media integration (featured images, galleries, video embeds)",
      "Added impact metrics tracking and highlighted quotes system",
      "Built publication workflow (draft → review → published → archived)",
      "Created story categories (success_story, news, update, testimonial, case_study, annual_report)",
      "Implemented service-story relationship linking",
      "Added SEO optimization with meta titles, descriptions, and keywords",
      "Created author attribution and call-to-action configuration",
      "Built view and share count tracking with featured story management"
    ],
    impact: "medium"
  },
  {
    id: "11",
    title: "Email Service Integration",
    description: "Automated email system for notifications and verification",
    date: "2025-11-18",
    version: "1.8.0",
    type: "infrastructure",
    details: [
      "Integrated email service for user communications",
      "Created welcome email templates",
      "Built email verification system",
      "Added password reset email flow",
      "Implemented notification email system",
      "Created email template management"
    ],
    impact: "medium"
  },
  {
    id: "12",
    title: "Advanced Image Management System",
    description: "Comprehensive image upload, storage, and management for services",
    date: "2025-11-18",
    version: "1.8.1",
    type: "feature",
    details: [
      "Built banner image management with minimum dimension validation (800x200)",
      "Created comprehensive gallery system (max 20 images per service)",
      "Implemented cloud storage integration (S3/Wasabi) with secure deletion",
      "Added thumbnail generation and image optimization",
      "Created image captions and alt text support for accessibility",
      "Built dedicated image management pages with upload progress tracking",
      "Implemented image validation and multiple format support",
      "Added individual image removal from galleries"
    ],
    impact: "medium"
  },
  {
    id: "13",
    title: "Service Types Management",
    description: "Comprehensive service type configuration and management system",
    date: "2025-11-19",
    version: "1.9.0",
    type: "feature",
    details: [
      "Created service types configuration in admin settings",
      "Implemented auto-generation of values from service type names",
      "Added validation for lowercase letters and underscores pattern",
      "Built service type CRUD operations with soft delete",
      "Integrated service types dropdown in service creation modal",
      "Added display order management for service types",
      "Created default service types seed (op shop, food pantry, etc.)",
      "Implemented usage tracking to prevent deletion of active types"
    ],
    impact: "medium"
  },
  {
    id: "14",
    title: "Dedicated Events Management System",
    description: "Comprehensive events administration with centralized management and advanced features",
    date: "2025-11-19",
    version: "1.10.0",
    type: "feature",
    details: [
      "Created dedicated Events page with consistent design matching services and users pages",
      "Implemented centralized event management across all services and organizations",
      "Built advanced event creation modal with service selection and enhanced time controls",
      "Added comprehensive event listing with search, filtering, and status indicators",
      "Created event status system (upcoming, active, completed) with visual badges",
      "Implemented multi-organization event management with proper permission controls",
      "Added enhanced date/time displays with Australian formatting and time ranges",
      "Built service-specific filtering and cross-service event visibility",
      "Created event CRUD operations with validation and error handling",
      "Added delete confirmation modals and comprehensive event management workflow"
    ],
    impact: "high"
  },
  {
    id: "15",
    title: "Team Management System",
    description: "Comprehensive team structure with roles, permissions, and organizational management",
    date: "2025-11-20",
    version: "1.11.0",
    type: "feature",
    details: [
      "Created hierarchical team system with Leader, Member, and Communications roles",
      "Built team creation and membership management with organization scoping",
      "Implemented team search and discovery across organizations",
      "Added team statistics tracking and reporting capabilities",
      "Created team type configuration system for organizational customization",
      "Built user-team assignment management with primary team designation",
      "Implemented team-based permission inheritance and access control",
      "Added team deletion with soft delete and member reassignment",
      "Created team initialization with default types for new organizations",
      "Integrated team context into user management and service operations"
    ],
    impact: "high"
  },
  {
    id: "16",
    title: "User Quota Management System",
    description: "Role-based user limits with quota enforcement and resource management",
    date: "2025-11-20",
    version: "1.11.1",
    type: "infrastructure",
    details: [
      "Implemented role-based user quotas with configurable limits per organization",
      "Built quota enforcement middleware preventing user creation when limits exceeded",
      "Created admin interface for viewing and updating role limits",
      "Added real-time quota status monitoring and reporting",
      "Implemented quota validation during user role assignment",
      "Built comprehensive quota statistics with current usage counts",
      "Created automatic quota checking across user management operations",
      "Added quota warnings and notifications for approaching limits",
      "Implemented organization-specific quota management",
      "Built quota override capabilities for super administrators"
    ],
    impact: "medium"
  },
  {
    id: "17",
    title: "Advanced File Storage Integration",
    description: "Enterprise-grade cloud storage with Wasabi S3 and advanced image processing",
    date: "2025-11-20",
    version: "1.11.2",
    type: "infrastructure",
    details: [
      "Integrated Wasabi S3-compatible cloud storage for scalable file management",
      "Implemented Sharp image processing with automatic resize and optimization",
      "Built comprehensive thumbnail generation for all image uploads",
      "Added multi-format image support (JPEG, PNG, WebP) with automatic conversion",
      "Created presigned URL system for secure file access and uploads",
      "Implemented image validation with size limits and format checking",
      "Built secure file deletion with storage cleanup",
      "Added image metadata extraction and storage",
      "Created progressive image loading with thumbnail fallbacks",
      "Implemented CDN integration for optimized image delivery"
    ],
    impact: "high"
  },
  {
    id: "18",
    title: "Profile Management System",
    description: "Comprehensive user profile management with avatar support and personal settings",
    date: "2025-11-20",
    version: "1.11.3",
    type: "feature",
    details: [
      "Built comprehensive user profile management interface",
      "Implemented avatar upload and management with image processing",
      "Created profile picture cropping and optimization tools",
      "Added profile information update capabilities",
      "Built avatar removal and reset functionality",
      "Implemented secure profile image storage and retrieval",
      "Added profile validation and error handling",
      "Created responsive profile management UI components",
      "Built profile change tracking and audit trail",
      "Integrated profile updates with authentication system"
    ],
    impact: "medium"
  },
  {
    id: "19",
    title: "Audit & Logging Framework",
    description: "Comprehensive system monitoring, audit trails, and security logging infrastructure",
    date: "2025-11-20",
    version: "1.11.4",
    type: "security",
    details: [
      "Implemented comprehensive audit logging for all system operations",
      "Built security event tracking and monitoring system",
      "Created action logging with user attribution and timestamps",
      "Added request/response logging with sensitive data filtering",
      "Implemented error logging with stack trace capture",
      "Built log rotation and retention management",
      "Created audit trail visualization and reporting tools",
      "Added compliance logging for regulatory requirements",
      "Implemented real-time security alerts and notifications",
      "Built log analysis and suspicious activity detection"
    ],
    impact: "high"
  },
  {
    id: "20",
    title: "Token Management System",
    description: "Advanced JWT management with blacklisting, refresh tokens, and security controls",
    date: "2025-11-20",
    version: "1.11.5",
    type: "security",
    details: [
      "Implemented advanced JWT token management and validation system",
      "Built token blacklisting for secure logout and revocation",
      "Created refresh token system with automatic rotation",
      "Added token expiration tracking and renewal notifications",
      "Implemented secure token storage and retrieval mechanisms",
      "Built token introspection and validation middleware",
      "Created session management with concurrent session limits",
      "Added token-based device tracking and management",
      "Implemented suspicious token activity detection and alerts",
      "Built comprehensive token lifecycle management and cleanup"
    ],
    impact: "high"
  }
]

const typeConfig = {
  feature: { icon: BoltIcon, color: "bg-blue-100 text-blue-800", label: "Feature" },
  infrastructure: { icon: CircleStackIcon, color: "bg-purple-100 text-purple-800", label: "Infrastructure" },
  security: { icon: ShieldCheckIcon, color: "bg-red-100 text-red-800", label: "Security" },
  bugfix: { icon: ArrowPathIcon, color: "bg-orange-100 text-orange-800", label: "Bug Fix" },
  enhancement: { icon: PaintBrushIcon, color: "bg-green-100 text-green-800", label: "Enhancement" }
}

const impactConfig = {
  low: { color: "bg-gray-100 text-gray-800", label: "Low Impact" },
  medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium Impact" },
  high: { color: "bg-red-100 text-red-800", label: "High Impact" }
}

export default function UpdatesPage() {
  const sortedUpdates = updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <AdminLayout 
      title="System Updates & Features"
      description="Comprehensive overview of all features, infrastructure improvements, and updates implemented in the system."
    >
      <div className="space-y-6">

        <div className="space-y-6">
            {sortedUpdates.map((update) => {
              return (
                <Card key={update.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">{update.title}</h3>
                          {update.version && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              v{update.version}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-base">
                          {update.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig[update.type].color}`}>
                          {typeConfig[update.type].label}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${impactConfig[update.impact].color}`}>
                          {impactConfig[update.impact].label}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(update.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 border-t pt-4">
                      <h4 className="font-medium text-sm uppercase tracking-wide text-gray-500">
                        Implementation Details
                      </h4>
                      <ul className="space-y-2">
                        {update.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-3">
                            <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )
            })}
        </div>

        {/* Development Journey */}
        <Card>
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Development Journey</h3>
              <p className="text-gray-600 mt-1">From authentication foundation to comprehensive ACS management platform</p>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                This Adventist Community Services platform began with essential authentication and user management 
                capabilities in early November 2025. We&apos;ve systematically built upon each core feature to create 
                a comprehensive community service management system tailored specifically for ACS operations.
              </p>
              <p className="text-gray-700">
                Each feature has been carefully designed with the ACS organizational structure in mind, implementing 
                hierarchical permissions, service-specific functionality, and volunteer coordination tools. The 
                platform now supports the full spectrum of ACS operations from op shops and food pantries to 
                disaster response and community outreach programs.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}