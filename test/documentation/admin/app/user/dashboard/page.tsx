"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UserNavbar } from "@/components/user-navbar"
import { UserFormList } from "@/components/user-form-list"

export default function UserDashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <UserNavbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">User Dashboard</h1>
          <Button asChild>
            <Link href="/user/profile">My Profile</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="forms" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forms">My Forms</TabsTrigger>
            <TabsTrigger value="new">New Submission</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="forms" className="mt-6">
            <UserFormList />
          </TabsContent>
          <TabsContent value="new" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>New Form Submission</CardTitle>
                <CardDescription>Fill out the form to submit a new request</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/user/forms/new">
                  <Button>Start New Form</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Your recent notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Your form has been approved</p>
                      <p className="text-sm text-gray-500">Form #1234 has been approved by the administrator.</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline">Form #1234</Badge>
                        <span className="text-xs text-gray-500">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Additional information required</p>
                      <p className="text-sm text-gray-500">Please provide additional information for Form #5678.</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline">Form #5678</Badge>
                        <span className="text-xs text-gray-500">1 day ago</span>
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
