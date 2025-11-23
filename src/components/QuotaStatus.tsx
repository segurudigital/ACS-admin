'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { teamService } from '@/lib/teams';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';

interface QuotaStatusData {
  role: {
    id: string;
    name: string;
    displayName: string;
    category: string;
  };
  quota: {
    allowed: boolean;
    current: number;
    max: number;
    remaining: number;
    nearLimit: boolean;
    percentage: number;
  };
}

export function QuotaStatus() {
  const [quotaData, setQuotaData] = useState<QuotaStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization, hasPermission } = usePermissions();

  const loadQuotaStatus = useCallback(async () => {
    if (!currentOrganization?._id) return;
    
    try {
      setLoading(true);
      const response = await teamService.getQuotaStatus(currentOrganization._id);
      setQuotaData(response.data.quotaStatuses || []);
    } catch (error) {
      console.error('Failed to load quota status:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?._id]);

  useEffect(() => {
    if (currentOrganization?._id && hasPermission('users.read')) {
      loadQuotaStatus();
    }
  }, [currentOrganization, hasPermission, loadQuotaStatus]);

  if (!hasPermission('users.read') || loading || quotaData.length === 0) {
    return null;
  }

  const criticalQuotas = quotaData.filter(q => !q.quota.allowed);
  const warningQuotas = quotaData.filter(q => q.quota.nearLimit && q.quota.allowed);

  return (
    <div className="space-y-4">
      {criticalQuotas.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {criticalQuotas.length} role{criticalQuotas.length > 1 ? 's have' : ' has'} reached the user limit.
          </AlertDescription>
        </Alert>
      )}

      {warningQuotas.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {warningQuotas.length} role{warningQuotas.length > 1 ? 's are' : ' is'} approaching the user limit.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Role Quotas
          </CardTitle>
          <CardDescription>
            User limits per role in {currentOrganization?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quotaData.map((item) => {
            const variant = !item.quota.allowed 
              ? 'destructive' 
              : item.quota.nearLimit 
              ? 'secondary' 
              : 'default';

            return (
              <div key={item.role.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.role.displayName}</span>
                    <Badge variant={variant} className="text-xs">
                      {item.quota.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.quota.current} / {item.quota.max}
                  </span>
                </div>
                <Progress 
                  value={item.quota.percentage} 
                  className="h-2"
                  indicatorClassName={
                    !item.quota.allowed 
                      ? 'bg-destructive' 
                      : item.quota.nearLimit 
                      ? 'bg-warning' 
                      : ''
                  }
                />
                {item.quota.remaining > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {item.quota.remaining} slot{item.quota.remaining > 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}