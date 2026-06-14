"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { Bot, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Model {
  id: string
  model_id: string
  provider: string
  category: string
  context_window: number
  max_tokens: number
  is_active: boolean
  is_free: boolean
  supports_tools: boolean
  supports_vision: boolean
}

export default function ModelsPage() {
  const { client } = useAdmin()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await client.get<{ models: Model[] }>("/api/admin/models")
      setModels(result.models || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models")
    } finally {
      setLoading(false)
    }
  }

  const filteredModels = models.filter((m) => {
    const matchesSearch = !filter || m.model_id.toLowerCase().includes(filter.toLowerCase()) || m.provider?.toLowerCase().includes(filter.toLowerCase())
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Models</h1>
          <p className="text-muted-foreground mt-2">Available AI models across providers</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchModels} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search models..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md bg-background text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-sm"
        >
          <option value="all">All Categories</option>
          <option value="fast">Fast</option>
          <option value="balanced">Balanced</option>
          <option value="powerful">Powerful</option>
        </select>
      </div>

      {/* Models Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Model</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Provider</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Context</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => (
                  <tr key={model.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{model.model_id}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className="capitalize">{model.provider}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={model.category === "powerful" ? "default" : "outline"} className="capitalize">{model.category}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{model.context_window?.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant={model.is_active ? "default" : "secondary"}>
                        {model.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredModels.length === 0 && !loading && (
            <div className="py-12 text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No models found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
