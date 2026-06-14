"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Plus, Trash, Settings, RefreshCw } from "lucide-react"

export default function StatusManagement() {
  const [statuses, setStatuses] = useState([
    { id: 1, name: "Pending", description: "Document is awaiting review", color: "secondary" },
    { id: 2, name: "Running", description: "Document is being processed", color: "default" },
    { id: 3, name: "Approved", description: "Document has been approved", color: "default" },
    { id: 4, name: "Rejected", description: "Document has been rejected", color: "destructive" },
    { id: 5, name: "Failed", description: "Document processing failed", color: "outline" },
  ])

  const [isAddStatusOpen, setIsAddStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState({ name: "", description: "", color: "default" })
  const [editingStatus, setEditingStatus] = useState<{ id: number; name: string; description: string; color: string } | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault()
    setStatuses([...statuses, { id: statuses.length + 1, ...newStatus }])
    setNewStatus({ name: "", description: "", color: "default" })
    setIsAddStatusOpen(false)
  }

  const handleEditStatus = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStatus) {
      setStatuses(statuses.map((status) => (status.id === editingStatus.id ? { ...editingStatus } : status)))
      setEditingStatus(null)
    }
  }

  const handleDeleteStatus = (id: number) => {
    if (confirm("Are you sure you want to delete this status?")) {
      setStatuses(statuses.filter((status) => status.id !== id))
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setRefreshing(false)
  }

  const getBadgeVariant = (color: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    const validVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "default": "default",
      "secondary": "secondary",
      "destructive": "destructive",
      "outline": "outline",
    }
    return validVariants[color] || "default"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/admin/documents">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Document Statuses</h1>
          </div>
          <p className="text-muted-foreground ml-10">Create and manage document processing statuses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isAddStatusOpen} onOpenChange={setIsAddStatusOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Status</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Status</DialogTitle>
                <DialogDescription>Create a new document status for your workflow</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStatus} className="space-y-4">
                <div>
                  <Label htmlFor="name">Status Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., In Review"
                    value={newStatus.name}
                    onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="What does this status mean?"
                    value={newStatus.description}
                    onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Badge Color</Label>
                  <select
                    id="color"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newStatus.color}
                    onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  >
                    <option value="default">Default</option>
                    <option value="secondary">Secondary</option>
                    <option value="destructive">Destructive</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Status</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Statuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statuses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Status Configuration</CardTitle>
          <CardDescription>Manage and customize document processing statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium">{status.name}</TableCell>
                    <TableCell className="text-muted-foreground">{status.description}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(status.color)}>{status.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setEditingStatus(status)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {editingStatus && editingStatus.id === status.id && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Status</DialogTitle>
                                <DialogDescription>Update status details</DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleEditStatus} className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Status Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editingStatus.name}
                                    onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Input
                                    id="edit-description"
                                    value={editingStatus.description}
                                    onChange={(e) =>
                                      setEditingStatus({ ...editingStatus, description: e.target.value })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-color">Badge Color</Label>
                                  <select
                                    id="edit-color"
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editingStatus.color}
                                    onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                                  >
                                    <option value="default">Default</option>
                                    <option value="secondary">Secondary</option>
                                    <option value="destructive">Destructive</option>
                                    <option value="outline">Outline</option>
                                  </select>
                                </div>
                                <DialogFooter>
                                  <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          )}
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteStatus(status.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {statuses.map(status => (
              <Card key={status.id} className="border">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{status.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{status.description}</p>
                    </div>
                    <Badge variant={getBadgeVariant(status.color)}>
                      {status.name}
                    </Badge>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingStatus(status)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      {editingStatus && editingStatus.id === status.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Status</DialogTitle>
                            <DialogDescription>Update status details</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEditStatus} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-name">Status Name</Label>
                              <Input
                                id="edit-name"
                                value={editingStatus.name}
                                onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Input
                                id="edit-description"
                                value={editingStatus.description}
                                onChange={(e) =>
                                  setEditingStatus({ ...editingStatus, description: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-color">Badge Color</Label>
                              <select
                                id="edit-color"
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editingStatus.color}
                                onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                              >
                                <option value="default">Default</option>
                                <option value="secondary">Secondary</option>
                                <option value="destructive">Destructive</option>
                                <option value="outline">Outline</option>
                              </select>
                            </div>
                            <DialogFooter>
                              <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      )}
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteStatus(status.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {statuses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No statuses configured. Create one to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
