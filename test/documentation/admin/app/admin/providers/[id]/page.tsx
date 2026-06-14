"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAdmin } from "@/lib/context/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plug, RefreshCw, TestTube, Trash2, Power, Pencil, Loader2, AlertCircle } from "lucide-react"

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
  rate_limits: any
}

interface ProvidersResponse {
  providers: Provider[]
  models: any[]
  costs: any[]
}

export default function ProviderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { client } = useAdmin()
  const providerId = params.id as string

  const [provider, setProvider] = useState<Provider | null>(null)
  const [allProviders, setAllProviders] = useState<Provider[]>([])
  const [costs, setCosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProvider()
  }, [providerId])

  const fetchProvider = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await client.get<ProvidersResponse>("/api/admin/providers")
      setAllProviders(result.providers)
      setCosts(result.costs || [])
      const found = result.providers.find((p) => p.id === providerId)
      if (found) {
        setProvider(found)
      } else {
        setError(`Provider "${providerId}" not found`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load provider")
    } finally {
      setLoading(false)
    }
  }

  const testProvider = async () => {
    if (!provider) return
    try {
      setTesting(true)
      const result = await client.post<{ ok: boolean; latency_ms?: number; model?: string }>(
        `/api/admin/providers/${provider.id}/test`
      )
      if (result.ok) {
        alert(`Provider is working! Latency: ${result.latency_ms}ms, Model: ${result.model}`)
      }
    } catch (err) {
      alert(`Test failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setTesting(false)
    }
  }

  const toggleProvider = async () => {
    if (!provider) return
    try {
      setToggling(true)
      await client.post(`/api/admin/providers/${provider.id}/toggle`, { is_active: !provider.is_active })
      setProvider({ ...provider, is_active: provider.is_active ? 0 : 1 } as any)
    } catch (err) {
      alert(`Failed to toggle: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setToggling(false)
    }
  }

  const deleteProvider = async () => {
    if (!provider) return
    if (!confirm(`Delete provider "${provider.name}"?`)) return
    try {
      setDeleting(true)
      await client.delete(`/api/admin/providers/${provider.id}`)
      router.push("/admin/providers")
    } catch (err) {
      alert(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`)
      setDeleting(false)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="rounded-none pl-0" asChild>
          <Link href="/admin/providers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Providers
          </Link>
        </Button>
        <div className="border rounded-none p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading provider...</p>
        </div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="rounded-none pl-0" asChild>
          <Link href="/admin/providers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Providers
          </Link>
        </Button>
        <div className="border rounded-none p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error || "Provider not found"}</p>
          <Button className="rounded-none" onClick={() => router.push("/admin/providers")}>
            Go to Providers List
          </Button>
        </div>
      </div>
    )
  }

  const providerCosts = costs.filter((c) => c.provider_id === provider.id || c.provider === provider.id)

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="rounded-none pl-0" asChild>
        <Link href="/admin/providers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Providers
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plug className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{provider.name}</h1>
              {getProviderBadge(provider.type)}
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm">{provider.base_url}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-none" onClick={fetchProvider}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="rounded-none" onClick={testProvider} disabled={testing}>
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? "Testing..." : "Test"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-none" onClick={toggleProvider} disabled={toggling}>
            <Power className="h-4 w-4 mr-2" />
            {provider.is_active ? "Disable" : "Enable"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-none" onClick={() => router.push(`/admin/providers/${provider.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" className="rounded-none" onClick={deleteProvider} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-none p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">General</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{provider.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{provider.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              {getProviderBadge(provider.type)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base URL</span>
              <span className="font-mono text-xs">{provider.base_url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <span>{provider.priority}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-none p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active</span>
              <Badge variant={provider.is_active ? "default" : "secondary"} className="rounded-none">
                {provider.is_active ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Health</span>
              <Badge
                variant={provider.health_status === "healthy" ? "default" : provider.health_status === "unhealthy" ? "destructive" : "secondary"}
                className="rounded-none"
              >
                {provider.health_status || "Unknown"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Models</span>
              <span>{provider.model_count || provider.models?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {provider.capabilities && Object.keys(provider.capabilities).length > 0 && (
        <div className="border rounded-none p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(provider.capabilities).map(([key, value]) =>
              value ? (
                <Badge key={key} variant="outline" className="rounded-none">
                  {key}
                </Badge>
              ) : null
            )}
          </div>
        </div>
      )}

      {provider.rate_limits && Object.keys(provider.rate_limits).length > 0 && (
        <div className="border rounded-none p-4 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Rate Limits</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {Object.entries(provider.rate_limits).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{key}</span>
                <span className="font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-none overflow-hidden">
        <div className="bg-muted/50 p-3 border-b">
          <h3 className="font-semibold text-sm">Models ({provider.models?.length || 0})</h3>
        </div>
        {provider.models && provider.models.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Model ID</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Context Window</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Max Tokens</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Features</th>
              </tr>
            </thead>
            <tbody>
              {provider.models.map((model: any, idx: number) => (
                <tr key={model.id || idx} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{model.model_id || model.id}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="rounded-none capitalize">{model.category || "N/A"}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{model.context_window?.toLocaleString() || "N/A"}</td>
                  <td className="p-3 text-muted-foreground">{model.max_tokens?.toLocaleString() || "N/A"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {model.supports_tools && <Badge variant="secondary" className="rounded-none text-xs">Tools</Badge>}
                      {model.supports_vision && <Badge variant="secondary" className="rounded-none text-xs">Vision</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-muted-foreground">No models configured for this provider</div>
        )}
      </div>

      {providerCosts.length > 0 && (
        <div className="border rounded-none overflow-hidden">
          <div className="bg-muted/50 p-3 border-b">
            <h3 className="font-semibold text-sm">Cost Information</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Model</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Input ($/1M tokens)</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Output ($/1M tokens)</th>
              </tr>
            </thead>
            <tbody>
              {providerCosts.map((cost: any, idx: number) => (
                <tr key={idx} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{cost.model || cost.model_id}</td>
                  <td className="p-3">${cost.input_cost || cost.input || "N/A"}</td>
                  <td className="p-3">${cost.output_cost || cost.output || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
