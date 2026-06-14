"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { Activity, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MonitorPage() {
  const { client } = useAdmin()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetchEvents()
    return () => { eventSourceRef.current?.close() }
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await client.get<{ events: any[] }>("/api/events")
      setEvents(data.events || [])
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
          <h1 className="text-3xl font-bold">Monitor</h1>
          <p className="text-muted-foreground mt-2">Real-time system events</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Live event stream from the server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((e: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm py-2 border-b border-border last:border-0">
                <Activity className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">{e.timestamp}</p>
                  <p className="truncate">{e.message || e.event || JSON.stringify(e)}</p>
                </div>
              </div>
            ))}
            {events.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8">No events recorded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
