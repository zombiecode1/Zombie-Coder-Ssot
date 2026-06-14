'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function MCPPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MCP Servers</h1>
          <p className="text-muted-foreground mt-1">Configure and manage Model Context Protocol servers</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add MCP Server
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MCP Configuration</CardTitle>
          <CardDescription>Manage your Model Context Protocol servers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>No MCP servers configured yet.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
