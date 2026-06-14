"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAdmin } from "@/lib/context/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react"

const PROVIDER_TYPES = [
  { value: "openai-compatible", label: "OpenAI Compatible" },
  { value: "groq", label: "Groq" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "anthropic", label: "Anthropic" },
  { value: "ollama", label: "Ollama" },
]

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

export default function EditProviderPage() {
  const params = useParams()
  const router = useRouter()
  const { client } = useAdmin()
  const providerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    id: "",
    name: "",
    type: "openai-compatible",
    base_url: "",
    api_key_env: "",
    priority: 1,
  })

  useEffect(() => {
    fetchProvider()
  }, [providerId])

  const fetchProvider = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await client.get<ProvidersResponse>("/api/admin/providers")
      const found = result.providers.find((p) => p.id === providerId)
      if (found) {
        setForm({
          id: found.id,
          name: found.name,
          type: found.type,
          base_url: found.base_url,
          api_key_env: (found as any).api_key_env || "",
          priority: found.priority,
        })
      } else {
        setError(`Provider "${providerId}" not found`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load provider")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.id || !form.name || !form.base_url) {
      setError("ID, Name, and Base URL are required")
      return
    }
    try {
      setSaving(true)
      setError(null)
      await client.post("/api/admin/providers", form)
      router.push(`/admin/providers/${providerId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update provider")
      setSaving(false)
    }
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

  if (error && !form.id) {
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
          <p className="text-destructive mb-4">{error}</p>
          <Button className="rounded-none" onClick={() => router.push("/admin/providers")}>
            Go to Providers List
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="rounded-none pl-0" asChild>
        <Link href={`/admin/providers/${providerId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Provider
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Edit Provider</h1>
        <p className="text-muted-foreground mt-2">Update provider configuration</p>
      </div>

      {error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border rounded-none p-6 space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="id">Provider ID</Label>
          <Input
            id="id"
            className="rounded-none bg-muted"
            value={form.id}
            disabled
          />
          <p className="text-xs text-muted-foreground">Cannot be changed after creation</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            className="rounded-none"
            placeholder="e.g. My OpenAI Provider"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            className="w-full rounded-none border border-border bg-background px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {PROVIDER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_url">Base URL</Label>
          <Input
            id="base_url"
            className="rounded-none"
            placeholder="https://api.openai.com/v1"
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="api_key_env">API Key Environment Variable</Label>
          <Input
            id="api_key_env"
            className="rounded-none"
            placeholder="e.g. OPENAI_API_KEY"
            value={form.api_key_env}
            onChange={(e) => setForm({ ...form, api_key_env: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Environment variable name containing the API key</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            className="rounded-none"
            min={0}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground">Lower number = higher priority</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="rounded-none" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" className="rounded-none" onClick={() => router.push(`/admin/providers/${providerId}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
