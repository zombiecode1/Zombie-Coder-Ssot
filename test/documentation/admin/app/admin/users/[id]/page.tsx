"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AdminNavbar } from "@/components/admin-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Trash } from "lucide-react"

export default function UserDetails() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id

  // Mock user data - in a real app, you would fetch this from your API
  const [user, setUser] = useState({
    id: userId,
    name: "John Doe",
    email: "john@example.com",
    role: "User",
    status: "Active",
    createdAt: "2023-01-15",
    lastLogin: "2023-06-20",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Anytown, USA",
  })

  // Mock form submissions for this user
  const [userForms, setUserForms] = useState([
    { id: 1, title: "Application for Business License", date: "2023-06-15", status: "Pending" },
    { id: 2, title: "Request for Information", date: "2023-06-14", status: "Approved" },
    { id: 3, title: "Complaint about Service", date: "2023-06-12", status: "Rejected" },
  ])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save the user data to your backend
    alert("User data saved successfully!")
  }

  const handleDelete = () => {
    // In a real app, you would delete the user from your backend
    if (confirm("Are you sure you want to delete this user?")) {
      router.push("/admin/users")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Rejected":
        return "destructive"
      case "Pending":
        return "secondary"
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
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Users
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-muted-foreground">ID: {userId}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" />
              Delete User
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>View and edit user information</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={user.phone}
                        onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={user.address}
                        onChange={(e) => setUser({ ...user, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={user.role} onValueChange={(value) => setUser({ ...user, role: value })}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={user.status} onValueChange={(value) => setUser({ ...user, status: value })}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Created: {user.createdAt} | Last Login: {user.lastLogin}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="forms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Forms</CardTitle>
                <CardDescription>Forms submitted by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {userForms.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">Title</th>
                          <th className="p-3 text-left font-medium">Date</th>
                          <th className="p-3 text-left font-medium">Status</th>
                          <th className="p-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userForms.map((form) => (
                          <tr key={form.id} className="border-b">
                            <td className="p-3 font-medium">{form.title}</td>
                            <td className="p-3">{form.date}</td>
                            <td className="p-3">
                              <Badge variant={getStatusBadgeVariant(form.status)}>{form.status}</Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/documents/${form.id}`}>View</Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    This user has not submitted any forms yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent user activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">User logged in</p>
                      <p className="text-sm text-gray-500">User logged in from IP 192.168.1.1</p>
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">2023-06-20 14:32:45</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Form submitted</p>
                      <p className="text-sm text-gray-500">User submitted form "Application for Business License"</p>
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">2023-06-15 09:15:22</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile updated</p>
                      <p className="text-sm text-gray-500">User updated their profile information</p>
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">2023-06-10 16:45:30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
