'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { teamTypeService, TeamType } from '@/lib/teamTypes';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamData: {
    name: string;
    type: string;
    description?: string;
    maxMembers: number;
  }) => Promise<void>;
}

export function CreateTeamModal({ open, onOpenChange, onSubmit }: CreateTeamModalProps) {
  const { currentOrganization } = usePermissions();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    maxMembers: 50,
  });
  const [loading, setLoading] = useState(false);
  const [teamTypes, setTeamTypes] = useState<TeamType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const loadTeamTypes = useCallback(async () => {
    if (!currentOrganization?._id) {
      return;
    }

    try {
      setLoadingTypes(true);
      const response = await teamTypeService.getOrganizationTeamTypes(currentOrganization._id);
      setTeamTypes(response.data || []);
      
      // If no team types exist, suggest initialization
      if (!response.data || response.data.length === 0) {
        toast({
          title: 'No Team Types Found',
          description: 'Contact your administrator to set up team types for your organization.',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load team types';
      toast({
        title: 'Error Loading Team Types',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingTypes(false);
    }
  }, [currentOrganization?._id]);

  // Load team types when modal opens and organization is available
  useEffect(() => {
    if (open && currentOrganization?._id) {
      loadTeamTypes();
    }
  }, [open, currentOrganization, loadTeamTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: 'Error',
        description: 'Team type is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        description: formData.description.trim() || undefined,
      });
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        description: '',
        maxMembers: 50,
      });
      
      onOpenChange(false);
    } catch (error: unknown) {
      // Error is handled in parent
      // Error is handled in parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      maxMembers: 50,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team for your organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
                disabled={loading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Team Type*</Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      loadingTypes 
                        ? "Loading types..." 
                        : teamTypes.length === 0 
                          ? "No team types available" 
                          : "Choose team type"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {teamTypes.length === 0 && !loadingTypes ? (
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>⚠️</span>
                        <div>No team types found. Contact your administrator.</div>
                      </div>
                    </SelectItem>
                  ) : (
                    teamTypes.map((teamType) => (
                      <SelectItem key={teamType._id} value={teamType.name}>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                            📋
                          </span>
                          <div>
                            <div className="font-medium">{teamType.name}</div>
                            {teamType.description && (
                              <div className="text-xs text-gray-500">{teamType.description}</div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter team description (optional)"
                rows={3}
                disabled={loading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxMembers">Max Members*</Label>
              <Input
                id="maxMembers"
                type="number"
                min="1"
                max="500"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 50 })}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of members allowed in this team
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}