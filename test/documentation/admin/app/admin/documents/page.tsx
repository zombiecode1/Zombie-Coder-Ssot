"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, CheckCircle, XCircle, RefreshCw, Plus, Search, FileText } from "lucide-react"
import { useAdmin } from "@/lib/context/admin"

export default function DocumentsPage() {
  const { client } = useAdmin()
  const [documents, setDocuments] = useState([
    { id: 1, title: "Application for Business License", user: "John Doe", date: "2024-04-15", status: "Pending" },
    { id: 2, title: "Request for Information", user: "Jane Smith", date: "2024-04-14", status: "Approved" },
    { id: 3, title: "Complaint about Service", user: "Robert Johnson", date: "2024-04-12", status: "Rejected" },
    { id: 4, title: "Feedback on Website", user: "Emily Davis", date: "2024-04-10", status: "Running" },
    { id: 5, title: "Application for Permit", user: "Michael Wilson", date: "2024-04-08", status: "Failed" },
    { id: 6, title: "Request for Refund", user: "Sarah Brown", date: "2024-04-07", status: "Pending" },
    { id: 7, title: "Product Registration", user: "David Lee", date: "2024-04-05", status: "Approved" },
    { id: 8, title: "Support Ticket", user: "Lisa Wang", date: "2024-04-03", status: "Running" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)

  const filteredDocuments = documents.filter(
    (document) =>
      (document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.user.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || document.status.toLowerCase() === statusFilter.toLowerCase()),
  )

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Rejected":
        return "destructive"
      case "Pending":
        return "secondary"
      case "Running":
        return "default"
      case "Failed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const handleApprove = (id: number) => {
    setDocuments(documents.map((document) => (document.id === id ? { ...document, status: "Approved" } : document)))
  }

  const handleReject = (id: number) => {
    setDocuments(documents.map((document) => (document.id === id ? { ...document, status: "Rejected" } : document)))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setRefreshing(false)
  }

  const docStats = {
    total: documents.length,
    pending: documents.filter(d => d.status === "Pending").length,
    approved: documents.filter(d => d.status === "Approved").length,
    rejected: documents.filter(d => d.status === "Rejected").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-2">Manage document submissions and status tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild className="gap-2">
            <Link href="/admin/documents/status">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{docStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{docStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{docStats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{docStats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Documents List</CardTitle>
              <CardDescription>View all document submissions</CardDescription>
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="flex items-center gap-2 relative">
                <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.title}</TableCell>
                    <TableCell>{document.user}</TableCell>
                    <TableCell className="text-muted-foreground">{document.date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(document.status)}>{document.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/documents/${document.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        {document.status === "Pending" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleApprove(document.id)}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleReject(document.id)}>
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredDocuments.map(document => (
              <Card key={document.id} className="border">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{document.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{document.user}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                    <span>{document.date}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/documents/${document.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {document.status === "Pending" && (
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(document.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No documents found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
