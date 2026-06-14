"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/lib/context/admin"
import { Plug, RefreshCw, TestTube, Trash2, Power, Plus, Eye, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Provider {
  id: string
  name: string
  type: string
  base_url: string
  is_active: number
  priority: number
  health_status: string
  model_count: number
  models: any[]
  capabilities: any
}

interface ProvidersResponse {
  providers: Provider[]
  models: any[]
  costs: any[]
}

export default function ProvidersPage() {
  const { client } = useAdmin()
  const router = useRouter()
  const [data, setData] = useState<ProvidersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await client.get<ProvidersResponse>("/api/admin/providers")
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers")
    } finally {
      setLoading(false)
    }
  }

  const testProvider = async (id: string) => {
    try {
      setTestingId(id)
      const result = await client.post<{ ok: boolean; latency_ms?: number; model?: string }>(
        `/api/admin/providers/${id}/test`
      )
      if (result.ok) {
        alert(`Provider ${id} is working! Latency: ${result.latency_ms}ms, Model: ${result.model}`)
      }
    } catch (err) {
      alert(`Provider ${id} test failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setTestingId(null)
    }
  }

  const toggleProvider = async (id: string, isActive: boolean) => {
    try {
      await client.post(`/api/admin/providers/${id}/toggle`, { is_active: !isActive })
      fetchProviders()
    } catch (err) {
      alert(`Failed to toggle provider: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const deleteProvider = async (id: string) => {
    if (!confirm(`Delete provider ${id}?`)) return
    try {
      await client.delete(`/api/admin/providers/${id}`)
      fetchProviders()
    } catch (err) {
      alert(`Failed to delete provider: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const getProviderBadge = (type: string) => {
    const l = type.toLowerCase()
    if (l.includes("opencode")) return <Badge className="rounded-none bg-purple-500/20 text-purple-400 border-purple-500/30">OpenCode</Badge>
    if (l.includes("groq")) return <Badge className="rounded-none bg-green-500/20 text-green-400 border-green-500/30">Groq</Badge>
    if (l.includes("openai")) return <Badge className="rounded-none bg-emerald-500/20 text-emerald-400 border-emerald-500/30">OpenAI</Badge>
    if (l.includes("gemini")) return <Badge className="rounded-none bg-blue-500/20 text-blue-400 border-blue-500/30">Gemini</Badge>
    if (l.includes("anthropic")) return <Badge className="rounded-none bg-orange-500/20 text-orange-400 border-orange-500/30">Anthropic</Badge>
    if (l.includes("ollama")) return <Badge className="rounded-none bg-amber-500/20 text-amber-400 border-amber-500/30">Ollama</Badge>
    return <Badge variant="secondary" className="rounded-none">{type}</Badge>
  }

  const getHealthBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="rounded-none bg-green-500/20 text-green-400 border-green-500/30">Healthy</Badge>
      case "unhealthy":
        return <Badge className="rounded-none bg-red-500/20 text-red-400 border-red-500/30">Unhealthy</Badge>
      case "unknown":
        return <Badge variant="secondary" className="rounded-none">Unknown</Badge>
      default:
        return <Badge variant="secondary" className="rounded-none">{status || "Unknown"}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Providers</h1>
          <p className="text-muted-foreground mt-2">Manage LLM provider connections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-none" onClick={fetchProviders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="rounded-none" onClick={() => router.push("/admin/providers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Provider
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="border rounded-none p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading providers...</p>
        </div>
      ) : !data?.providers || data.providers.length === 0 ? (
        <div className="border rounded-none p-12 text-center">
          <Plug className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No providers configured</p>
          <Button className="rounded-none" onClick={() => router.push("/admin/providers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Provider
          </Button>
        </div>
      ) : (
        <div className="border rounded-none overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">URL</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Health</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Priority</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Models</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.providers.map((provider) => (
                <tr key={provider.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{provider.name}</span>
                    </div>
                  </td>
                  <td className="p-3">{getProviderBadge(provider.type)}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground max-w-[200px] truncate">{provider.base_url}</td>
                  <td className="p-3">
                    <Badge variant={provider.is_active ? "default" : "secondary"} className="rounded-none">
                      {provider.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">{getHealthBadge(provider.health_status)}</td>
                  <td className="p-3 text-center">{provider.priority}</td>
                  <td className="p-3 text-center">{provider.model_count || provider.models?.length || 0}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-none h-8 px-2"
                        onClick={() => router.push(`/admin/providers/${provider.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-none h-8 px-2"
                        onClick={() => testProvider(provider.id)}
                        disabled={testingId === provider.id}
                      >
                        {testingId === provider.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-none h-8 px-2"
                        onClick={() => toggleProvider(provider.id, !!provider.is_active)}
                      >
                        <Power className={`h-4 w-4 ${provider.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-none h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => deleteProvider(provider.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
