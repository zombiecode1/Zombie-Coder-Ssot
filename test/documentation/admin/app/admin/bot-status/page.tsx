"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AdminNavbar } from "@/components/admin-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, Pause, RefreshCw, AlertTriangle } from "lucide-react"

export default function BotStatus() {
  const [bots, setBots] = useState([
    {
      id: 1,
      name: "Form Processing Bot",
      status: "Running",
      lastRun: "2023-06-20 14:30:22",
      processedItems: 1245,
      failedItems: 12,
      cpuUsage: 32,
      memoryUsage: 45,
      uptime: "5d 12h 30m",
    },
    {
      id: 2,
      name: "Email Notification Bot",
      status: "Running",
      lastRun: "2023-06-20 14:15:10",
      processedItems: 3456,
      failedItems: 23,
      cpuUsage: 28,
      memoryUsage: 38,
      uptime: "3d 8h 15m",
    },
    {
      id: 3,
      name: "Data Synchronization Bot",
      status: "Stopped",
      lastRun: "2023-06-19 09:45:33",
      processedItems: 8765,
      failedItems: 45,
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: "0d 0h 0m",
    },
    {
      id: 4,
      name: "Document Validation Bot",
      status: "Error",
      lastRun: "2023-06-20 10:22:15",
      processedItems: 567,
      failedItems: 89,
      cpuUsage: 65,
      memoryUsage: 72,
      uptime: "0d 4h 12m",
    },
  ])

  const [logs, setLogs] = useState([
    {
      id: 1,
      botId: 1,
      timestamp: "2023-06-20 14:30:22",
      level: "INFO",
      message: "Processing batch #45 completed successfully",
    },
    {
      id: 2,
      botId: 1,
      timestamp: "2023-06-20 14:25:15",
      level: "INFO",
      message: "Processing batch #44 completed successfully",
    },
    { id: 3, botId: 2, timestamp: "2023-06-20 14:15:10", level: "INFO", message: "Sent 120 email notifications" },
    { id: 4, botId: 3, timestamp: "2023-06-19 09:45:33", level: "INFO", message: "Data synchronization completed" },
    { id: 5, botId: 4, timestamp: "2023-06-20 10:22:15", level: "ERROR", message: "Failed to connect to database" },
    { id: 6, botId: 4, timestamp: "2023-06-20 10:20:05", level: "WARNING", message: "Database connection timeout" },
    { id: 7, botId: 1, timestamp: "2023-06-20 14:20:10", level: "WARNING", message: "Slow processing detected" },
    { id: 8, botId: 2, timestamp: "2023-06-20 14:10:22", level: "ERROR", message: "Failed to send 5 emails" },
  ])

  const [selectedBot, setSelectedBot] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Running":
        return "default"
      case "Stopped":
        return "secondary"
      case "Error":
        return "destructive"
      default:
        return "default"
    }
  }

  const getLogLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "INFO":
        return "default"
      case "WARNING":
        return "secondary"
      case "ERROR":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const toggleBotStatus = (id: number) => {
    setBots(
      bots.map((bot) => {
        if (bot.id === id) {
          const newStatus = bot.status === "Running" ? "Stopped" : "Running"
          return { ...bot, status: newStatus }
        }
        return bot
      }),
    )
  }

  const restartBot = (id: number) => {
    setBots(
      bots.map((bot) => {
        if (bot.id === id) {
          return { ...bot, status: "Running" }
        }
        return bot
      }),
    )
    alert(`Bot #${id} restarted successfully`)
  }

  const filteredLogs = selectedBot ? logs.filter((log) => log.botId === selectedBot) : logs

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNavbar />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Bot Status</h1>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Current status of the automation system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Bots</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {bots.filter((bot) => bot.status === "Running").length}/{bots.length}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">System Load</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">66%</p>
                    </div>
                    <Progress value={progress} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Items Processed (24h)</p>
                  <p className="text-2xl font-bold">{bots.reduce((sum, bot) => sum + bot.processedItems, 0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Failed Items (24h)</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{bots.reduce((sum, bot) => sum + bot.failedItems, 0)}</p>
                    {bots.reduce((sum, bot) => sum + bot.failedItems, 0) > 0 && (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bots" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bots">Bots</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="bots" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bot Management</CardTitle>
                <CardDescription>View and control automation bots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead>CPU</TableHead>
                        <TableHead>Memory</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bots.map((bot) => (
                        <TableRow key={bot.id}>
                          <TableCell className="font-medium">{bot.name}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(bot.status)}>{bot.status}</Badge>
                          </TableCell>
                          <TableCell>{bot.lastRun}</TableCell>
                          <TableCell>{bot.status === "Running" ? `${bot.cpuUsage}%` : "-"}</TableCell>
                          <TableCell>{bot.status === "Running" ? `${bot.memoryUsage}%` : "-"}</TableCell>
                          <TableCell>{bot.uptime}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => toggleBotStatus(bot.id)}>
                                {bot.status === "Running" ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                <span className="sr-only">{bot.status === "Running" ? "Stop" : "Start"}</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => restartBot(bot.id)}>
                                <RefreshCw className="h-4 w-4" />
                                <span className="sr-only">Restart</span>
                              </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBotStatus(bot.id)}
                      >
                                {bot.status === "Running" ? "Stop" : "Start"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>
                  {selectedBot
                    ? `Showing logs for ${bots.find((bot) => bot.id === selectedBot)?.name}`
                    : "All system logs"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div>
                    {selectedBot && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedBot(null)}>
                        Show All Logs
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Export Logs
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Bot</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                          <TableCell>{bots.find((bot) => bot.id === log.botId)?.name}</TableCell>
                          <TableCell>
                            <Badge variant={getLogLevelBadgeVariant(log.level)}>{log.level}</Badge>
                          </TableCell>
                          <TableCell>{log.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
