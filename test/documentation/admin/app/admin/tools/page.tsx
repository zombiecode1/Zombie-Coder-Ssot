'use client';

import { useAdmin } from '@/lib/context/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { Wrench, RefreshCw, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProviderTool {
  id: number;
  provider_id: string;
  tool_type: string;
  tool_name: string;
  config: string;
  enabled: number;
}

export default function ToolsPage() {
  const { client } = useAdmin();
  const [tools, setTools] = useState<ProviderTool[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const params = selectedProvider !== 'all' ? `?provider_id=${selectedProvider}` : '';
      const data = await client.get<{ tools: ProviderTool[] }>(`/provider-tools${params}`);
      setTools(data.tools || []);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    }
    setLoading(false);
  };

  const fetchProviders = async () => {
    try {
      const data = await client.get<{ providers: any[] }>('/providers');
      setProviders(data.providers || []);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    fetchTools();
  }, [selectedProvider]);

  const testTool = async (providerId: string, toolType: string) => {
    const key = `${providerId}:${toolType}`;
    setTesting(key);
    try {
      await client.post(`/providers/${providerId}/tools/${toolType}/test`, {
        message: 'Hello, this is a test.',
      });
    } catch (err) {
      console.error('Tool test failed:', err);
    }
    setTesting(null);
  };

  // Group tools by provider
  const toolsByProvider: Record<string, ProviderTool[]> = {};
  for (const tool of tools) {
    if (!toolsByProvider[tool.provider_id]) toolsByProvider[tool.provider_id] = [];
    toolsByProvider[tool.provider_id].push(tool);
  }

  const toolTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      chat: 'bg-blue-500/10 text-blue-500',
      code: 'bg-green-500/10 text-green-500',
      embedding: 'bg-purple-500/10 text-purple-500',
      audio: 'bg-orange-500/10 text-orange-500',
      image: 'bg-pink-500/10 text-pink-500',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Provider Tools
          </h1>
          <p className="text-muted-foreground mt-1">Manage and test tools for each provider</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchTools} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(toolsByProvider).length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <p>No tools configured. Run provider sync to register tools.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(toolsByProvider).map(([providerId, providerTools]) => (
          <Card key={providerId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                {providerId}
              </CardTitle>
              <CardDescription>{providerTools.length} tool(s) configured</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {providerTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={toolTypeBadge(tool.tool_type)} variant="secondary">
                        {tool.tool_type}
                      </Badge>
                      <div>
                        <p className="font-medium">{tool.tool_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tool.enabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testTool(providerId, tool.tool_type)}
                      disabled={testing === `${providerId}:${tool.tool_type}`}
                    >
                      {testing === `${providerId}:${tool.tool_type}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Test
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
