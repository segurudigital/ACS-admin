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
    description: "Full-featured service management for ACS programs",
    date: "2024-11-07",
    version: "1.3.0",
    type: "feature",
    details: [
      "Built service types (op_shop, food_pantry, soup_kitchen, etc.)",
      "Added geographic location with coordinate mapping",
      "Implemented service hours and contact management",
      "Created image gallery upload system",
      "Added eligibility requirements and capacity tracking",
      "Built service discovery with location-based search"
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
    description: "Event management system for community programs",
    date: "2024-11-11",
    version: "1.5.0",
    type: "feature",
    details: [
      "Created event types (workshop, training, fundraiser, etc.)",
      "Implemented event scheduling with start/end times",
      "Added recurring event patterns",
      "Built registration system with capacity limits",
      "Created location management for events",
      "Added event-service relationship management"
    ],
    impact: "medium"
  },
  {
    id: "9",
    title: "Volunteer Management System",
    description: "Comprehensive volunteer role and requirement management",
    date: "2024-11-12",
    version: "1.6.0",
    type: "feature",
    details: [
      "Created volunteer roles with skill requirements",
      "Added background check and age restriction management",
      "Implemented training requirement tracking",
      "Built time commitment and scheduling system",
      "Created volunteer application process",
      "Added volunteer-service assignment interface"
    ],
    impact: "medium"
  },
  {
    id: "10",
    title: "Stories & Content Management",
    description: "Impact story system with rich content and publication workflow",
    date: "2024-11-13",
    version: "1.7.0",
    type: "feature",
    details: [
      "Built story types (beneficiary, volunteer, donor, community)",
      "Implemented rich content editor with images and videos",
      "Created publication workflow (draft → review → published)",
      "Added featured stories with expiration management",
      "Built SEO metadata and related content linking",
      "Created story archiving and version control"
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

        {/* Implementation Timeline */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Implementation Timeline</h2>
            <p className="text-gray-600 mt-1">Detailed history of system updates and features</p>
          </div>
          
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