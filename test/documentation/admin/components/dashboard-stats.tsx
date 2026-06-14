export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">245</div>
          <p className="text-xs text-muted-foreground">+12% from last month</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Active Forms</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">132</div>
          <p className="text-xs text-muted-foreground">+4% from last month</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Pending Approvals</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">-8% from last month</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Completion Rate</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">89%</div>
          <p className="text-xs text-muted-foreground">+2% from last month</p>
        </div>
      </div>
    </div>
  )
}
