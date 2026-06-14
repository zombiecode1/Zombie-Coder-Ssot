"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { BarChart3, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UsagePage() {
  const { client } = useAdmin()
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsage() }, [])

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const data = await client.get("/api/admin/usage")
      setUsage(data)
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
          <h1 className="text-3xl font-bold">Usage</h1>
          <p className="text-muted-foreground mt-2">API usage statistics and costs</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsage} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Token usage and request counts by model</CardDescription>
        </CardHeader>
        <CardContent>
          {usage ? (
            <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
              {JSON.stringify(usage, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
