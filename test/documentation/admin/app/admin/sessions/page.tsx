"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdmin } from "@/lib/context/admin"
import { Radio, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SessionsPage() {
  const { client } = useAdmin()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const data = await client.get<{ sessions: any[] }>("/api/admin/sessions")
      setSessions(data.sessions || [])
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
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground mt-2">Active editor and client sessions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Session ID</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Editor</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s: any) => (
                <tr key={s.session_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{s.session_id?.slice(0, 12)}...</td>
                  <td className="p-3">{s.editor_type || "unknown"}</td>
                  <td className="p-3">
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{s.last_seen_at || s.updated_at}</td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No active sessions</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
