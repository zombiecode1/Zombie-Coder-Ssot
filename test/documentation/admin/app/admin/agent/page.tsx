"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { Brain, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AgentPage() {
  const { client } = useAdmin()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStatus() }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const data = await client.get("/v1/agent/status")
      setStatus(data)
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
          <h1 className="text-3xl font-bold">Agent</h1>
          <p className="text-muted-foreground mt-2">Agent system status and configuration</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
          <CardDescription>Current agent system health</CardDescription>
        </CardHeader>
        <CardContent>
          {status ? (
            <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
