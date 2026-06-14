"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdmin } from "@/lib/context/admin"
import { Bot, Plug, Activity, BarChart3, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  models_count: number
  total_requests: number
  sessions_active: number
  conversations: number
  providers: number
  uptime_formatted: string
  usage_by_day: any[]
  models_by_provider: { provider: string; count: number }[]
}

export default function AdminDashboard() {
  const { client } = useAdmin()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await client.get<DashboardStats>("/api/admin/stats")
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: "Models",
      value: stats?.models_count || 0,
      icon: Bot,
      color: "text-blue-500",
    },
    {
      label: "Providers",
      value: stats?.providers || 0,
      icon: Plug,
      color: "text-green-500",
    },
    {
      label: "Sessions",
      value: stats?.sessions_active || 0,
      icon: Activity,
      color: "text-purple-500",
    },
    {
      label: "Conversations",
      value: stats?.conversations || 0,
      icon: BarChart3,
      color: "text-emerald-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Proxi Bridge admin panel</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "-" : card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">Live data</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">{stats?.uptime_formatted || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Requests</span>
                  <span className="text-sm text-muted-foreground">{stats?.total_requests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Models</span>
                  <span className="text-sm text-muted-foreground">{stats?.models_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Models by Provider</CardTitle>
              <CardDescription>Distribution across providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.models_by_provider || []).map((p) => (
                  <div key={p.provider} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{p.provider}</span>
                    <span className="text-sm text-muted-foreground">{p.count} models</span>
                  </div>
                ))}
                {(!stats?.models_by_provider || stats.models_by_provider.length === 0) && (
                  <p className="text-sm text-muted-foreground">No provider data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Component health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "API Server", status: "healthy" },
                  { name: "Database", status: "healthy" },
                  { name: "Provider Gateway", status: "healthy" },
                ].map((component) => (
                  <div key={component.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{component.name}</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${component.status === "healthy" ? "bg-green-500" : "bg-red-500"}`}></div>
                      <span className="text-xs text-muted-foreground capitalize">{component.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
