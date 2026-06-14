'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw, Code } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/lib/context/admin';

interface PromptVersion {
  id: string;
  name: string;
  version: string;
  content: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  createdBy: string;
  changeLog?: string;
}

export default function PromptVersionsPage() {
  const { client } = useAdmin();
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptVersion | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      // Try to fetch from backend
      try {
        const data = await client.get<PromptVersion[]>('/prompts');
        setPrompts(data);
      } catch {
        setPrompts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrompts();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prompt Versions</h1>
          <p className="text-muted-foreground mt-1">Manage prompt versions with full version history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompts List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Prompts</CardTitle>
            <CardDescription>{prompts.length} total prompts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : prompts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No prompts yet</p>
            ) : (
              prompts.map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedPrompt?.id === prompt.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent'
                  }`}
                >
                  <p className="font-medium text-sm">{prompt.name}</p>
                  <p className="text-xs text-muted-foreground">{prompt.version}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Prompt Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Prompt Details</CardTitle>
            <CardDescription>View and manage prompt versions</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPrompt ? (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="versions">History</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      {selectedPrompt.name}
                    </h3>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{selectedPrompt.content}</pre>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Edit</Button>
                    <Button variant="outline">Clone</Button>
                  </div>
                </TabsContent>

                <TabsContent value="versions" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current version: {selectedPrompt.version}</p>
                    {selectedPrompt.changeLog && (
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Changes:</p>
                        <p className="text-muted-foreground">{selectedPrompt.changeLog}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge className={getStatusColor(selectedPrompt.status)}>
                        {selectedPrompt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Created By</span>
                      <span className="text-sm text-muted-foreground">{selectedPrompt.createdBy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Created At</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(selectedPrompt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Select a prompt to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
