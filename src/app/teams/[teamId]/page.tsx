'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '../../../components/AdminLayout';
import { StatusBadge } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { teamService, Team, TeamMember } from '@/lib/teams';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';
import { AddTeamMemberModal } from '@/components/teams/AddTeamMemberModal';
import {
   MapPinIcon,
   XMarkIcon,
   UserGroupIcon,
   HomeIcon,
   UserPlusIcon,
   UserMinusIcon,
   UserIcon,
} from '@heroicons/react/24/outline';
import {
   ShieldCheckIcon,
   ChatBubbleLeftEllipsisIcon,
   UsersIcon,
} from '@heroicons/react/24/outline';

interface TeamDetails {
   team: Team;
   permissions: {
      canUpdate: boolean;
      canDelete: boolean;
      canManage: boolean;
   };
}

function TeamBannerImage({ team }: { team: Team }) {
   const [imageError, setImageError] = useState(false);

   if (!team.banner?.url || imageError) {
      return <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600"></div>;
   }

   return (
      <Image
         src={team.banner.url}
         alt={team.banner.alt || team.name}
         fill
         className="object-cover opacity-50"
         priority
         onError={() => {
            console.error('Banner image failed to load:', team.banner?.url);
            setImageError(true);
         }}
         onLoad={() => console.log('Banner image loaded successfully')}
      />
   );
}

export default function TeamDetailPage() {
   const params = useParams();
   const teamId = params?.teamId as string;
   const router = useRouter();
   const { hasPermission } = usePermissions();
   const [teamData, setTeamData] = useState<TeamDetails | null>(null);
   const [members, setMembers] = useState<TeamMember[]>([]);
   const [loading, setLoading] = useState(true);
   const [addMemberOpen, setAddMemberOpen] = useState(false);

   const loadTeamData = useCallback(async () => {
      try {
         setLoading(true);
         const [teamResponse, membersResponse] =
            await Promise.all([
               teamService.getTeamDetails(teamId as string),
               teamService.getTeamMembers(teamId as string),
            ]);

         const team = teamResponse.data;
         setTeamData({
            team,
            permissions: {
               canUpdate: hasPermission('teams.update'),
               canDelete: hasPermission('teams.delete'),
               canManage: hasPermission('teams.manage_members'),
            }
         });
         setMembers(membersResponse.data);
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
   }, [teamId, hasPermission]);

   useEffect(() => {
      if (teamId) {
         loadTeamData();
      }
   }, [teamId, loadTeamData]);

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


   const getRoleIcon = (role: string) => {
      switch (role) {
         case 'leader':
            return <ShieldCheckIcon className="w-4 h-4" />;
         case 'communications':
            return <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />;
         default:
            return <UserIcon className="w-4 h-4" />;
      }
   };

   const getTeamTypeBadgeText = (type: string | undefined) => {
      switch (type) {
         case 'acs':
            return 'ACS Service';
         case 'communications':
            return 'Communications';
         default:
            return 'General';
      }
   };

   if (loading) {
      return (
         <AdminLayout title="Loading..." description="Please wait">
            <div className="flex items-center justify-center h-64">
               <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                     Loading team details...
                  </p>
               </div>
            </div>
         </AdminLayout>
      );
   }

   if (!teamData) {
      return (
         <AdminLayout
            title="Team Not Found"
            description="The requested team could not be found"
         >
            <div className="text-center py-12">
               <p className="text-gray-600 mb-4">
                  The team you&apos;re looking for doesn&apos;t exist or has
                  been removed.
               </p>
               <Button
                  onClick={() => router.push('/teams')}
               >
                  Back to Teams
               </Button>
            </div>
         </AdminLayout>
      );
   }

   const { team } = teamData;

   return (
      <AdminLayout
         title={team.name}
         description={`Team • ${team.churchId ? (typeof team.churchId === 'object' && team.churchId?.name ? team.churchId.name : 'Church Team') : 'Team'}`}
         hideTitle={true}
         hideHeader={true}
      >
         {/* Hero Banner Section */}
         <div className="relative h-80 md:h-96 bg-gray-900 -mx-6 -mt-6">
            <TeamBannerImage team={team} />

            {/* User Profile Overlay */}
            <div className="absolute top-8 right-4 z-20">
               <div className="flex items-center space-x-4">
                  {/* User Profile */}
                  <div className="flex items-center space-x-3">
                     <div className="text-right">
                        <p className="text-sm font-medium text-white drop-shadow-lg">
                           Bemee
                        </p>
                        <p className="text-xs text-white/90 drop-shadow-lg">
                           bem@gyocc.org
                        </p>
                     </div>

                     <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: '#454545' }}
                     >
                        <span className="text-white text-sm font-medium">
                           B
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 flex items-end">
               <div className="w-full p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="max-w-6xl mx-auto">
                     <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                           <span className="px-3 py-1 bg-orange-600 text-white text-sm font-medium rounded-full">
                              {getTeamTypeBadgeText(team.category || team.type)}
                           </span>
                           <StatusBadge
                              status={team.isActive}
                              trueLabel="Active"
                              falseLabel="Inactive"
                              trueColor="green"
                              falseColor="red"
                           />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                           {team.name}
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
                           {team.churchId && (
                              <p className="text-lg text-gray-200">
                                 {typeof team.churchId === 'object' && team.churchId?.name 
                                    ? team.churchId.name 
                                    : 'Church Team'}
                              </p>
                           )}
                           {team.location && (
                              <p className="text-lg text-gray-200 flex items-center">
                                 <MapPinIcon className="h-5 w-5 mr-1" />
                                 {team.location}
                              </p>
                           )}
                        </div>
                        {team.description && (
                           <p className="text-gray-200 mt-2 max-w-2xl">
                              {team.description}
                           </p>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Back Button */}
            <button
               onClick={() => router.push('/teams')}
               className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
               <XMarkIcon className="h-6 w-6" />
            </button>
         </div>

         <div className="mt-8">
            {/* Main Content Container */}
            <div className="max-w-6xl mx-auto">
               
               {/* Team Details Section */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                     Team Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Basic Information */}
                     <div>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                           <HomeIcon className="h-5 w-5 text-gray-400 mr-2" />
                           Basic Information
                        </h3>
                        <div className="space-y-3">
                           <div className="flex justify-between">
                              <span className="text-gray-600">Team Name:</span>
                              <span className="font-medium">{team.name}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium">{getTeamTypeBadgeText(team.category || team.type)}</span>
                           </div>
                           {team.location && (
                              <div className="flex justify-between">
                                 <span className="text-gray-600">Location:</span>
                                 <span className="font-medium">{team.location}</span>
                              </div>
                           )}
                           <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <StatusBadge
                                 status={team.isActive}
                                 trueLabel="Active"
                                 falseLabel="Inactive"
                                 trueColor="green"
                                 falseColor="red"
                              />
                           </div>
                        </div>
                     </div>

                     {/* Leadership Information */}
                     <div>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                           <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                           Leadership
                        </h3>
                        <div className="space-y-3">
                           {team.leaderId ? (
                              <div>
                                 <span className="text-gray-600">Team Leader:</span>
                                 <div className="mt-1">
                                    {(() => {
                                       const leaderId = team.leaderId;
                                       const leader = members.find(m => m._id === leaderId);
                                       
                                       if (leader) {
                                          return (
                                             <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6">
                                                   <AvatarImage src={leader.avatar} />
                                                   <AvatarFallback>
                                                      {leader.name
                                                         .split(' ')
                                                         .map((n) => n[0])
                                                         .join('')
                                                         .toUpperCase()}
                                                   </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">
                                                   {leader.name}
                                                </span>
                                             </div>
                                          );
                                       } else if (typeof team.leaderId === 'object' && team.leaderId?.name) {
                                          return (
                                             <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6">
                                                   <AvatarFallback>
                                                      {team.leaderId.name
                                                         .split(' ')
                                                         .map((n: string) => n[0])
                                                         .join('')
                                                         .toUpperCase()}
                                                   </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">
                                                   {team.leaderId.name}
                                                </span>
                                             </div>
                                          );
                                       } else {
                                          return <span className="text-gray-500">Leader not found</span>;
                                       }
                                    })()}
                                 </div>
                              </div>
                           ) : (
                              <div>
                                 <span className="text-gray-600">Team Leader:</span>
                                 <span className="text-gray-500 ml-2">No leader assigned</span>
                              </div>
                           )}
                           <div className="flex justify-between">
                              <span className="text-gray-600">Total Leaders:</span>
                              <span className="font-medium">{members.filter(m => m.teamRole === 'leader').length}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {team.description && (
                     <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600">{team.description}</p>
                     </div>
                  )}
               </div>

               {/* Team Members Section */}
               <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <UserGroupIcon className="h-6 w-6 text-gray-400 mr-2" />
                        Team Members ({members.length})
                     </h2>
                     <PermissionGate permission="teams.manage_members">
                        <Button
                           onClick={() => setAddMemberOpen(true)}
                           size="sm"
                        >
                           <UserPlusIcon className="w-4 h-4 mr-2" />
                           Add Member
                        </Button>
                     </PermissionGate>
                  </div>

                  {members.length === 0 ? (
                     <div className="text-center py-8">
                        <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No members in this team yet</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((member) => (
                           <div
                              key={member._id}
                              className="bg-gray-50 p-4 rounded-lg"
                           >
                              <div className="flex items-start justify-between mb-3">
                                 <div className="flex items-center gap-3">
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
                                       <h4 className="font-semibold text-gray-900">
                                          {member.name}
                                       </h4>
                                       <p className="text-sm text-gray-600">
                                          {member.email}
                                       </p>
                                    </div>
                                 </div>
                                 <PermissionGate permission="teams.manage_members">
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => handleRemoveMember(member._id)}
                                       className="text-red-600 hover:text-red-700"
                                    >
                                       <UserMinusIcon className="w-4 h-4" />
                                    </Button>
                                 </PermissionGate>
                              </div>
                              <div className="flex items-center justify-between">
                                 <Badge
                                    variant={member.teamRole === 'leader' ? 'default' : 'secondary'}
                                    className="flex items-center gap-1"
                                 >
                                    {getRoleIcon(member.teamRole)}
                                    {member.teamRole}
                                 </Badge>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>


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