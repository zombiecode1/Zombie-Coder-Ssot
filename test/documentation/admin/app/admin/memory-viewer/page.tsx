'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/lib/context/admin';

interface Memory {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, string>;
  similarity?: number;
  createdAt: string;
}

export default function MemoryViewerPage() {
  const { client } = useAdmin();
  const [search, setSearch] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      // Try to fetch from backend, fallback to empty
      try {
        const data = await client.get<Memory[]>('/memories');
        setMemories(data);
      } catch {
        // Demo mode - no memories yet
        setMemories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setFilteredMemories(memories);
      return;
    }

    try {
      // Try semantic search via backend
      const results = await client.post<Memory[]>('/memories/search', { query });
      setFilteredMemories(results);
    } catch {
      // Fallback to simple text search
      setFilteredMemories(
        memories.filter(m =>
          m.content.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(m.metadata).toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMemories();
    setRefreshing(false);
  };

  const displayMemories = search ? filteredMemories : memories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Memory Viewer</h1>
          <p className="text-muted-foreground mt-1">Browse and search vector database entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Memory
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vector Database</CardTitle>
          <CardDescription>Search and explore stored memory embeddings with semantic similarity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories by content or semantic similarity..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          {loading ? (
            <div className="border rounded-lg p-8 flex items-center justify-center text-muted-foreground">
              <p>Loading memories...</p>
            </div>
          ) : displayMemories.length === 0 ? (
            <div className="border rounded-lg p-8 flex items-center justify-center text-muted-foreground">
              <p>{search ? 'No matching memories found.' : 'No memories found. Memories will appear here as they are created.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayMemories.map(memory => (
                <div key={memory.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium line-clamp-2">{memory.content}</p>
                    {memory.similarity !== undefined && (
                      <Badge variant="secondary" className="ml-2">{(memory.similarity * 100).toFixed(0)}%</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(memory.metadata).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(memory.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
