'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-1">Manage AI agents and their configurations</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Management</CardTitle>
          <CardDescription>View and manage all configured agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>No agents configured yet. Create one to get started.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
