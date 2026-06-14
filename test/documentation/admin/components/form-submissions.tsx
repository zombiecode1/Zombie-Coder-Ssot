"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, CheckCircle, XCircle } from "lucide-react"

export function FormSubmissions() {
  const [submissions, setSubmissions] = useState([
    { id: 1, title: "Application for Business License", user: "John Doe", date: "2023-06-15", status: "Pending" },
    { id: 2, title: "Request for Information", user: "Jane Smith", date: "2023-06-14", status: "Approved" },
    { id: 3, title: "Complaint about Service", user: "Robert Johnson", date: "2023-06-12", status: "Rejected" },
    { id: 4, title: "Feedback on Website", user: "Emily Davis", date: "2023-06-10", status: "Running" },
    { id: 5, title: "Application for Permit", user: "Michael Wilson", date: "2023-06-08", status: "Failed" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredSubmissions = submissions.filter(
    (submission) =>
      (submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.user.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || submission.status.toLowerCase() === statusFilter.toLowerCase()),
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
    setSubmissions(
      submissions.map((submission) => (submission.id === id ? { ...submission, status: "Approved" } : submission)),
    )
  }

  const handleReject = (id: number) => {
    setSubmissions(
      submissions.map((submission) => (submission.id === id ? { ...submission, status: "Rejected" } : submission)),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Submissions</CardTitle>
        <CardDescription>View and manage form submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
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

        <div className="rounded-md border">
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
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.title}</TableCell>
                  <TableCell>{submission.user}</TableCell>
                  <TableCell>{submission.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(submission.status)}>{submission.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      {submission.status === "Pending" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(submission.id)}>
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Approve</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReject(submission.id)}>
                            <XCircle className="h-4 w-4" />
                            <span className="sr-only">Reject</span>
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
      </CardContent>
    </Card>
  )
}
