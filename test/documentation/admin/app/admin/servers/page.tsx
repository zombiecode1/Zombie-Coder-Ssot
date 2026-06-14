'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Activity, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/lib/context/admin';

// Mock data - replace with API call
const mockServers = [
  {
    id: '1',
    name: 'Primary Workstation',
    host: 'api.example.com',
    port: 3000,
    status: 'online' as const,
    health: 98,
    cpuUsage: 45,
    memoryUsage: 62,
    lastChecked: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Processing Server',
    host: 'processor.example.com',
    port: 8000,
    status: 'online' as const,
    health: 92,
    cpuUsage: 72,
    memoryUsage: 85,
    lastChecked: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Backup Server',
    host: 'backup.example.com',
    port: 3001,
    status: 'offline' as const,
    health: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    lastChecked: new Date().toISOString(),
  },
];

export default function ServersPage() {
  const { client } = useAdmin();
  const [search, setSearch] = useState('');
  const [servers, setServers] = useState(mockServers);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      // Try to fetch from backend, fallback to mock data
      try {
        const data = await client.get('/servers');
        setServers(data);
      } catch {
        setServers(mockServers);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServers();
    setRefreshing(false);
  };

  const filteredServers = servers.filter(
    server =>
      server.name.toLowerCase().includes(search.toLowerCase()) ||
      server.host.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
      case 'offline':
        return 'bg-red-500/10 text-red-700 hover:bg-red-500/20';
      case 'error':
        return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servers</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage connected servers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Server
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Servers</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockServers.filter(s => s.status === 'online').length}
            </div>
            <p className="text-xs text-muted-foreground">Out of {mockServers.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CPU Usage</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                mockServers.reduce((sum, s) => sum + s.cpuUsage, 0) / mockServers.filter(s => s.status === 'online').length
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across online servers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                mockServers.reduce((sum, s) => sum + s.memoryUsage, 0) / mockServers.filter(s => s.status === 'online').length
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across online servers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server Status</CardTitle>
          <CardDescription>Real-time status and metrics for all servers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search servers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Memory</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No servers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServers.map(server => (
                    <TableRow key={server.id}>
                      <TableCell className="font-medium">{server.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {server.host}:{server.port}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(server.status)}>
                          {server.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${getHealthColor(server.health)}`}>
                        {server.health}%
                      </TableCell>
                      <TableCell className="text-sm">{server.cpuUsage}%</TableCell>
                      <TableCell className="text-sm">{server.memoryUsage}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
