"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { GitBranch, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function RoutingPage() {
  const { client } = useAdmin()
  const [mappings, setMappings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMappings() }, [])

  const fetchMappings = async () => {
    try {
      setLoading(true)
      const data = await client.get<{ mappings: any[] }>("/api/admin/mapping")
      setMappings(data.mappings || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Routing</h1>
          <p className="text-muted-foreground mt-2">Model-to-provider routing rules</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMappings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Pattern</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Provider</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Priority</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m: any, i: number) => (
                <tr key={i} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{m.model_pattern}</td>
                  <td className="p-3"><Badge variant="secondary">{m.provider_name}</Badge></td>
                  <td className="p-3">{m.priority}</td>
                  <td className="p-3">
                    <Badge variant={m.is_active ? "default" : "secondary"}>
                      {m.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {mappings.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No routing rules configured</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
