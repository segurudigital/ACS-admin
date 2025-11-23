'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
   ArrowLeft,
   Save,
   Users,
   Shield,
   MessageSquare,
   UserPlus,
   UserX,
   User,
   Trash,
   Info,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { teamService, Team, TeamStatistics, TeamMember } from '@/lib/teams';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';
import { AddTeamMemberModal } from '@/components/teams/AddTeamMemberModal';

export default function TeamDetailPage() {
   const params = useParams();
   const teamId = params?.teamId as string;
   const router = useRouter();
   const { hasPermission } = usePermissions();
   const [team, setTeam] = useState<Team | null>(null);
   const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
   const [members, setMembers] = useState<TeamMember[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [addMemberOpen, setAddMemberOpen] = useState(false);
   const [activeSection, setActiveSection] = useState('overview');
   const [formData, setFormData] = useState({
      name: '',
      description: '',
      maxMembers: 50,
      settings: {
         allowSelfJoin: false,
         requireApproval: false,
         visibility: 'organization' as 'organization' | 'private' | 'public',
      },
   });

   const loadTeamData = useCallback(async () => {
      try {
         setLoading(true);
         const [teamResponse, statsResponse, membersResponse] =
            await Promise.all([
               teamService.getTeamDetails(teamId as string),
               teamService.getTeamStatistics(teamId as string),
               teamService.getTeamMembers(teamId as string),
            ]);

         const teamData = teamResponse.data;
         setTeam(teamData);
         setStatistics(statsResponse.data);
         setMembers(membersResponse.data);

         // Initialize form with team data
         setFormData({
            name: teamData.name,
            description: teamData.description || '',
            maxMembers: teamData.maxMembers,
            settings: {
               allowSelfJoin: teamData.settings.allowSelfJoin,
               requireApproval: teamData.settings.requireApproval,
               visibility: teamData.settings.visibility,
            },
         });
      } catch (error: unknown) {
         const errorMessage =
            error instanceof Error
               ? error.message
               : 'Failed to load team details';
         toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
         });
      } finally {
         setLoading(false);
      }
   }, [teamId]);

   useEffect(() => {
      if (teamId) {
         loadTeamData();
      }
   }, [teamId, loadTeamData]);

   const handleSave = async () => {
      try {
         setSaving(true);
         await teamService.updateTeam(teamId as string, formData);
         toast({
            title: 'Success',
            description: 'Team updated successfully',
         });
         loadTeamData();
      } catch (error: unknown) {
         const errorMessage =
            error instanceof Error ? error.message : 'Failed to update team';
         toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
         });
      } finally {
         setSaving(false);
      }
   };

   const handleAddMember = async (
      userId: string,
      role: 'leader' | 'member' | 'communications'
   ) => {
      try {
         await teamService.addTeamMember(teamId, userId, role);
         toast({
            title: 'Success',
            description: 'Member added successfully',
         });
         setAddMemberOpen(false);
         loadTeamData();
      } catch (error: unknown) {
         toast({
            title: 'Error',
            description:
               error instanceof Error ? error.message : 'Failed to add member',
            variant: 'destructive',
         });
      }
   };

   const handleUpdateRole = async (
      userId: string,
      newRole: 'leader' | 'member' | 'communications'
   ) => {
      try {
         await teamService.updateMemberRole(teamId, userId, newRole);
         toast({
            title: 'Success',
            description: 'Member role updated successfully',
         });
         loadTeamData();
      } catch (error: unknown) {
         toast({
            title: 'Error',
            description:
               error instanceof Error
                  ? error.message
                  : 'Failed to update member role',
            variant: 'destructive',
         });
      }
   };

   const handleRemoveMember = async (userId: string) => {
      if (
         !confirm('Are you sure you want to remove this member from the team?')
      )
         return;

      try {
         await teamService.removeTeamMember(teamId, userId);
         toast({
            title: 'Success',
            description: 'Member removed successfully',
         });
         loadTeamData();
      } catch (error: unknown) {
         toast({
            title: 'Error',
            description:
               error instanceof Error
                  ? error.message
                  : 'Failed to remove member',
            variant: 'destructive',
         });
      }
   };

   const handleDeleteTeam = async () => {
      if (
         !confirm(
            'Are you sure you want to delete this team? This action cannot be undone.'
         )
      )
         return;

      try {
         await teamService.deleteTeam(teamId);
         toast({
            title: 'Success',
            description: 'Team deleted successfully',
         });
         router.push('/teams');
      } catch (error: unknown) {
         toast({
            title: 'Error',
            description:
               error instanceof Error ? error.message : 'Failed to delete team',
            variant: 'destructive',
         });
      }
   };

   const getTeamTypeIcon = (type: string) => {
      switch (type) {
         case 'acs':
            return <Shield className="w-5 h-5" />;
         case 'communications':
            return <MessageSquare className="w-5 h-5" />;
         default:
            return <Users className="w-5 h-5" />;
      }
   };

   const getRoleIcon = (role: string) => {
      switch (role) {
         case 'leader':
            return <Shield className="w-4 h-4" />;
         case 'communications':
            return <MessageSquare className="w-4 h-4" />;
         default:
            return <User className="w-4 h-4" />;
      }
   };

   const getRoleBadgeVariant = (
      role: string
   ): 'default' | 'secondary' | 'outline' => {
      switch (role) {
         case 'leader':
            return 'default';
         case 'communications':
            return 'secondary';
         default:
            return 'outline';
      }
   };

   const teamNavigation = [
      {
         id: 'overview',
         title: 'Overview',
         description: 'Team statistics and quick info',
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
               />
            </svg>
         ),
      },
      {
         id: 'details',
         title: 'Team Details',
         description: 'Basic information and settings',
         icon: <Info className="w-5 h-5" />,
      },
      {
         id: 'members',
         title: 'Team Members',
         description: 'Manage team membership',
         icon: <Users className="w-5 h-5" />,
      },
   ];

   const renderContent = () => {
      switch (activeSection) {
         case 'overview':
            return (
               <div className="space-y-6">
                  <div>
                     <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {team?.name}
                     </h2>
                     <div className="flex items-center gap-2 mb-4">
                        {getTeamTypeIcon(team?.type || 'general')}
                        <Badge
                           variant={team?.isActive ? 'default' : 'secondary'}
                        >
                           {team?.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                     </div>
                     {team?.description && (
                        <p className="text-gray-600 mb-6">
                           {team?.description}
                        </p>
                     )}
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                     <Card>
                        <CardHeader className="pb-3">
                           <CardTitle className="text-base">Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="text-2xl font-bold">
                              {statistics?.memberCount}
                           </div>
                           <p className="text-sm text-muted-foreground">
                              of {statistics?.maxMembers} max
                           </p>
                           <Progress
                              value={statistics?.capacity || 0}
                              className="mt-2"
                           />
                        </CardContent>
                     </Card>

                     <Card>
                        <CardHeader className="pb-3">
                           <CardTitle className="text-base">Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="text-2xl font-bold">
                              {statistics?.serviceCount}
                           </div>
                           <p className="text-sm text-muted-foreground">
                              Active services
                           </p>
                        </CardContent>
                     </Card>

                     <Card>
                        <CardHeader className="pb-3">
                           <CardTitle className="text-base">
                              Role Distribution
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                 <span>Leaders</span>
                                 <span className="font-medium">
                                    {statistics?.roleDistribution?.leader || 0}
                                 </span>
                              </div>
                              <div className="flex justify-between">
                                 <span>Members</span>
                                 <span className="font-medium">
                                    {statistics?.roleDistribution?.member || 0}
                                 </span>
                              </div>
                              <div className="flex justify-between">
                                 <span>Communications</span>
                                 <span className="font-medium">
                                    {statistics?.roleDistribution
                                       ?.communications || 0}
                                 </span>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  </div>
               </div>
            );

         case 'details':
            return (
               <div className="space-y-6">
                  <div>
                     <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Team Details
                     </h2>
                     <p className="text-gray-600">
                        Manage team information and settings
                     </p>
                  </div>

                  <Card>
                     <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-2">
                           <Label htmlFor="name">Team Name</Label>
                           <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    name: e.target.value,
                                 })
                              }
                              disabled={!hasPermission('teams.update')}
                           />
                        </div>

                        <div className="grid gap-2">
                           <Label htmlFor="description">Description</Label>
                           <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    description: e.target.value,
                                 })
                              }
                              rows={3}
                              disabled={!hasPermission('teams.update')}
                           />
                        </div>

                        <div className="grid gap-2">
                           <Label htmlFor="maxMembers">Maximum Members</Label>
                           <Input
                              id="maxMembers"
                              type="number"
                              min="1"
                              max="500"
                              value={formData.maxMembers}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    maxMembers: parseInt(e.target.value) || 50,
                                 })
                              }
                              disabled={!hasPermission('teams.update')}
                           />
                        </div>
                     </CardContent>
                  </Card>
               </div>
            );

         case 'members':
            return (
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                           Team Members
                        </h2>
                        <p className="text-gray-600">
                           {members.length} of {team?.maxMembers || 'unlimited'}{' '}
                           members
                        </p>
                     </div>
                     <PermissionGate permission="teams.manage_members">
                        <Button
                           onClick={() => setAddMemberOpen(true)}
                           disabled={
                              (team?.maxMembers ?? 0) > 0 &&
                              members.length >= (team?.maxMembers ?? 0)
                           }
                        >
                           <UserPlus className="w-4 h-4 mr-2" />
                           Add Member
                        </Button>
                     </PermissionGate>
                  </div>

                  <Card>
                     <CardContent className="pt-6">
                        {members.length === 0 ? (
                           <div className="text-center py-8">
                              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">
                                 No members in this team yet
                              </p>
                           </div>
                        ) : (
                           <div className="grid gap-4">
                              {members.map((member) => (
                                 <div
                                    key={member._id}
                                    className="border rounded-lg p-4"
                                 >
                                    <div className="flex items-start justify-between">
                                       <div className="flex items-center gap-4">
                                          <Avatar className="w-12 h-12">
                                             <AvatarImage src={member.avatar} />
                                             <AvatarFallback>
                                                {member.name
                                                   .split(' ')
                                                   .map((n) => n[0])
                                                   .join('')
                                                   .toUpperCase()}
                                             </AvatarFallback>
                                          </Avatar>
                                          <div>
                                             <h4 className="font-semibold">
                                                {member.name}
                                             </h4>
                                             <p className="text-sm text-gray-500">
                                                {member.email}
                                             </p>
                                             <Badge
                                                variant={getRoleBadgeVariant(
                                                   member.teamRole
                                                )}
                                                className="mt-2"
                                             >
                                                {getRoleIcon(member.teamRole)}
                                                <span className="ml-1">
                                                   {member.teamRole}
                                                </span>
                                             </Badge>
                                          </div>
                                       </div>

                                       <PermissionGate permission="teams.manage_members">
                                          <div className="flex items-center gap-2">
                                             <Select
                                                value={member.teamRole}
                                                onValueChange={(value) =>
                                                   handleUpdateRole(
                                                      member._id,
                                                      value as 'leader' | 'member' | 'communications'
                                                   )
                                                }
                                             >
                                                <SelectTrigger className="w-40">
                                                   <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                   <SelectItem value="leader">
                                                      Leader
                                                   </SelectItem>
                                                   <SelectItem value="member">
                                                      Member
                                                   </SelectItem>
                                                   <SelectItem value="communications">
                                                      Communications
                                                   </SelectItem>
                                                </SelectContent>
                                             </Select>

                                             <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                   handleRemoveMember(
                                                      member._id
                                                   )
                                                }
                                                className="text-red-600 hover:text-red-700"
                                             >
                                                <UserX className="w-4 h-4" />
                                             </Button>
                                          </div>
                                       </PermissionGate>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>
            );

         default:
            return null;
      }
   };

   if (loading || !team || !statistics) {
      return (
         <AdminLayout title="Loading..." description="Loading team details...">
            <div className="animate-pulse">
               <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
               <div className="h-64 bg-gray-200 rounded"></div>
            </div>
         </AdminLayout>
      );
   }

   return (
      <AdminLayout
         title={team?.name || 'Team'}
         description={`Team details and member management for ${
            team?.name || 'this team'
         }`}
      >
         <div className="mb-6">
            <div className="flex items-center justify-between">
               <Button variant="ghost" onClick={() => router.push('/teams')}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Teams
               </Button>

               <div className="flex items-center gap-2">
                  <PermissionGate permission="teams.update">
                     <Button onClick={handleSave} disabled={saving} size="sm">
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? 'Saving...' : 'Save Changes'}
                     </Button>
                  </PermissionGate>
                  <PermissionGate permission="teams.delete">
                     <Button
                        variant="destructive"
                        onClick={handleDeleteTeam}
                        size="sm"
                     >
                        <Trash className="w-4 h-4 mr-1" />
                        Delete Team
                     </Button>
                  </PermissionGate>
               </div>
            </div>
         </div>

         <div className="flex h-[calc(100vh-200px)] bg-gray-50">
            {/* Team Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
               <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                     Team Management
                  </h2>

                  <nav className="space-y-2">
                     {teamNavigation.map((item) => (
                        <button
                           key={item.id}
                           onClick={() => setActiveSection(item.id)}
                           className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                              activeSection === item.id
                                 ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                 : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                           }`}
                        >
                           <div
                              className={`mr-3 flex-shrink-0 ${
                                 activeSection === item.id
                                    ? 'text-blue-700'
                                    : 'text-gray-400'
                              }`}
                           >
                              {item.icon}
                           </div>
                           <div className="flex-1">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                 {item.description}
                              </div>
                           </div>
                        </button>
                     ))}
                  </nav>
               </div>
            </div>

            {/* Team Content */}
            <div className="flex-1 overflow-y-auto">
               <div className="p-8">{renderContent()}</div>
            </div>
         </div>

         {/* Add Team Member Modal */}
         <AddTeamMemberModal
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
            onSubmit={handleAddMember}
            currentMembers={members.map((m) => m._id)}
         />
      </AdminLayout>
   );
}
