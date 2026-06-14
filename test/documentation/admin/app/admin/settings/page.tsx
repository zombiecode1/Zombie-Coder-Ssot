'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/lib/context/admin';
import { AlertCircle, CheckCircle2, Toggle } from 'lucide-react';

interface FeatureSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const { apiUrl, setApiUrl } = useAdmin();
  const [formApiUrl, setFormApiUrl] = useState(apiUrl);
  const [isSaved, setIsSaved] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [features, setFeatures] = useState<FeatureSetting[]>([
    {
      id: 'real-time-logs',
      name: 'Real-time Logs',
      description: 'Stream logs from your backend in real-time',
      enabled: true,
    },
    {
      id: 'memory-viewer',
      name: 'Memory Viewer',
      description: 'Browse and search vector database entries',
      enabled: true,
    },
    {
      id: 'api-testing',
      name: 'API Testing',
      description: 'Test API endpoints directly from the admin panel',
      enabled: true,
    },
    {
      id: 'chat-interface',
      name: 'Chat Interface',
      description: 'Interactive chat with your AI workstation',
      enabled: true,
    },
    {
      id: 'memory-export',
      name: 'Memory Export',
      description: 'Export memory and vector embeddings',
      enabled: true,
    },
  ]);

  const handleSave = async () => {
    setApiUrl(formApiUrl);
    // Test connection
    try {
      const response = await fetch(`${formApiUrl}/health`, { method: 'HEAD' });
      setApiConnected(response.ok);
    } catch {
      setApiConnected(false);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleFeature = (id: string) => {
    setFeatures(prev =>
      prev.map(f => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your admin panel and backend integration</p>
      </div>

      <Tabs defaultValue="backend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backend">Backend</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="backend">
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Backend Configuration</CardTitle>
                <CardDescription>Set up your backend API connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">API Base URL</Label>
                  <Input
                    id="api-url"
                    placeholder="http://localhost:3001"
                    value={formApiUrl}
                    onChange={e => setFormApiUrl(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL for your backend API. This will be used for all admin panel requests.
                  </p>
                </div>

                {apiConnected && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-700 dark:text-green-300">Connected to backend API</p>
                  </div>
                )}

                {isSaved && !apiConnected && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Could not connect to API. Check the URL and try again.</p>
                  </div>
                )}

                <Button onClick={handleSave} className="w-full">
                  {isSaved ? 'Configuration Saved' : 'Save Configuration'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Status</CardTitle>
                <CardDescription>Connection and performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={apiConnected ? 'default' : 'secondary'}>
                    {apiConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current URL</span>
                  <span className="text-sm font-mono text-muted-foreground break-all">{apiUrl}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Response Time</span>
                  <span className="text-sm text-muted-foreground">142ms avg</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable admin features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map(feature => (
                <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{feature.name}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    className={`ml-4 h-6 w-11 rounded-full transition-colors ${
                      feature.enabled ? 'bg-primary' : 'bg-gray-300'
                    } flex-shrink-0`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        feature.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Version Information</CardTitle>
                <CardDescription>Admin panel details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Admin Panel Version</span>
                  <span className="font-mono text-sm">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Release Date</span>
                  <span className="text-sm text-muted-foreground">April 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Environment</span>
                  <span className="font-mono text-sm capitalize">{process.env.NODE_ENV || 'development'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>Available modules and capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Comprehensive Dashboard with Real-time Stats
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    AI Models & Servers Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Memory Viewer with Semantic Search
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Prompt Versioning & History
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    API Testing & Debugging Tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Real-time Logs with Filtering
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
