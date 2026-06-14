"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AdminNavbar } from "@/components/admin-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, CheckCircle, XCircle, MessageSquare } from "lucide-react"

export default function DocumentDetails() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id

  // Mock document data - in a real app, you would fetch this from your API
  const [document, setDocument] = useState({
    id: documentId,
    title: "Application for Business License",
    user: "John Doe",
    userId: "user123",
    date: "2023-06-15",
    status: "Pending",
    content:
      "This is a detailed application for a business license for my new startup company. I am planning to open a retail store in the downtown area.",
    attachments: [
      { name: "business_plan.pdf", size: "2.4 MB" },
      { name: "id_proof.jpg", size: "1.1 MB" },
    ],
  })

  // Mock comments
  const [comments, setComments] = useState([
    {
      id: 1,
      user: "Admin",
      text: "Please provide additional information about your business location.",
      date: "2023-06-16",
    },
    {
      id: 2,
      user: "John Doe",
      text: "I have updated the application with the requested information.",
      date: "2023-06-17",
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [newStatus, setNewStatus] = useState(document.status)

  const handleStatusChange = () => {
    setDocument({ ...document, status: newStatus })
    // In a real app, you would update the status in your backend
    alert(`Status updated to ${newStatus}`)
  }

  const handleAddComment = () => {
    if (newComment.trim() === "") return

    const comment = {
      id: comments.length + 1,
      user: "Admin",
      text: newComment,
      date: new Date().toISOString().split("T")[0],
    }

    setComments([...comments, comment])
    setNewComment("")
  }

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

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNavbar />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/admin/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Documents
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{document.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">ID: {documentId}</p>
              <Badge variant={getStatusBadgeVariant(document.status)}>{document.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/users/${document.userId}`}>View User</Link>
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Document Details</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Content</CardTitle>
                    <CardDescription>
                      Submitted on {document.date} by {document.user}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-md bg-muted/50">
                      <p className="whitespace-pre-wrap">{document.content}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="attachments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                    <CardDescription>Files submitted with this document</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {document.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <p className="text-sm text-muted-foreground">{attachment.size}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Document History</CardTitle>
                    <CardDescription>Status changes and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 rounded-lg border p-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Document submitted</p>
                          <p className="text-sm text-gray-500">Initial submission by {document.user}</p>
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">{document.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 rounded-lg border p-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Status changed to Pending</p>
                          <p className="text-sm text-gray-500">Document is awaiting review</p>
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">{document.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
                <CardDescription>Change the document status</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
              <CardFooter>
                <Button onClick={handleStatusChange} className="w-full">
                  Update Status
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus("Approved")
                    setDocument({ ...document, status: "Approved" })
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Document
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus("Rejected")
                    setDocument({ ...document, status: "Rejected" })
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Document
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
                <CardDescription>Communication history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex flex-col gap-2 p-3 border rounded-md">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{comment.user}</p>
                        <p className="text-xs text-muted-foreground">{comment.date}</p>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment} className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
