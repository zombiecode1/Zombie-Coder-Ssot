"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, FileEdit } from "lucide-react"

export function UserFormList() {
  const [forms, setForms] = useState([
    { id: 1, title: "Application for Business License", date: "2023-06-15", status: "Pending" },
    { id: 2, title: "Request for Information", date: "2023-06-14", status: "Approved" },
    { id: 3, title: "Complaint about Service", date: "2023-06-12", status: "Rejected" },
    { id: 4, title: "Feedback on Website", date: "2023-06-10", status: "Running" },
    { id: 5, title: "Application for Permit", date: "2023-06-08", status: "Failed" },
  ])

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
    <Card>
      <CardHeader>
        <CardTitle>My Forms</CardTitle>
        <CardDescription>View and manage your form submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell>{form.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(form.status)}>{form.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/user/forms/${form.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      {form.status === "Pending" && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/user/forms/${form.id}/edit`}>
                            <FileEdit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
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
