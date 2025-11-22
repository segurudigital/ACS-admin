'use client';

import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, Building2, Activity, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QuotaStatus } from '@/components/QuotaStatus';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions, useCurrentTeam, useUserTeams } from '@/contexts/HierarchicalPermissionContext';

export default function Dashboard() {
  const router = useRouter();
  const { user, role, currentOrganization } = usePermissions();
  const { currentTeam, teamRole } = useCurrentTeam();
  const teams = useUserTeams();

  return (
    <AdminLayout 
      title="Dashboard" 
      description="Overview of your Adventist Community Services admin panel"
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {user?.name}!</CardTitle>
            <CardDescription>
              {currentOrganization?.name} • {role && (
                <Badge variant="outline" className="ml-2">
                  {role.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Team Information */}
        {currentTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentTeam.name}</p>
                  <p className="text-sm text-gray-500">
                    Your role: <Badge variant="secondary">{teamRole}</Badge>
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/teams/${currentTeam._id}`)}
                >
                  View Team
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PermissionGate permission="users.read">
            <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push('/users')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage user accounts
                </p>
              </CardContent>
            </Card>
          </PermissionGate>

          <PermissionGate permission="teams.read">
            <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push('/teams')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Manage Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage teams
                </p>
              </CardContent>
            </Card>
          </PermissionGate>

          <PermissionGate permission="organizations.read">
            <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push('/organizations')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage organization structure
                </p>
              </CardContent>
            </Card>
          </PermissionGate>

          <PermissionGate permission="services.read">
            <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push('/services')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage community services
                </p>
              </CardContent>
            </Card>
          </PermissionGate>
        </div>

        {/* User Teams */}
        {teams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Teams</CardTitle>
              <CardDescription>
                Teams you are a member of
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teams.map((assignment) => assignment.team && (
                  <div 
                    key={assignment.teamId} 
                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{assignment.team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.team.type.toUpperCase()} Team
                      </p>
                    </div>
                    <Badge variant={assignment.role === 'leader' ? 'default' : 'secondary'}>
                      {assignment.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quota Status */}
        <PermissionGate permission="users.create">
          <QuotaStatus />
        </PermissionGate>
      </div>
    </AdminLayout>
  );
}