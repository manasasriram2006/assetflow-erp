import { Link } from "react-router-dom";
import {
  FiArchive,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiPlusCircle,
  FiRepeat,
  FiTool,
  FiTruck,
  FiUsers
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { useApiResource } from "../hooks/useApiResource";
import { reportsApi } from "../services/resources";
import { formatDate, statusTone } from "../utils/format";

const chartColors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#0f766e", "#7c3aed", "#64748b"];

const labelize = (value = "") =>
  String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const emptyMessage = (message) => (
  <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
    {message}
  </div>
);

export default function Dashboard() {
  const { data, loading, error } = useApiResource(reportsApi.dashboard, []);
  const cards = data?.cards || {};
  const assetsByStatus =
    data?.charts?.assetsByStatus?.map((item) => ({
      name: labelize(item.status),
      value: item.count
    })) || [];
  const departmentSummary = data?.charts?.departmentSummary || [];
  const recentActivities = data?.recentActivities || [];
  const notifications = data?.notifications?.items || [];

  const quickActions = [
    { to: "/asset-registration", label: "Register Asset", icon: FiPlusCircle },
    { to: "/allocation", label: "Allocate Asset", icon: FiArchive },
    { to: "/transfer-request", label: "Transfer Request", icon: FiRepeat },
    { to: "/maintenance", label: "Maintenance", icon: FiTool },
    { to: "/booking", label: "Book Asset", icon: FiCalendar },
    { to: "/reports", label: "Reports", icon: FiClipboard }
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live operational view of asset availability, allocations, bookings, returns, maintenance, transfers, and notifications."
        actions={
          <Button as={Link} to="/notifications" variant="secondary">
            <FiBell /> {data?.notifications?.unread || 0} Unread
          </Button>
        }
      />

      {error ? <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={FiCheckCircle}
          label="Assets Available"
          value={loading ? "..." : cards.assetsAvailable}
          tone="text-success"
        />
        <StatCard icon={FiArchive} label="Assets Allocated" value={loading ? "..." : cards.assetsAllocated} />
        <StatCard
          icon={FiTool}
          label="Pending Maintenance"
          value={loading ? "..." : cards.pendingMaintenance}
          tone="text-warning"
        />
        <StatCard
          icon={FiCalendar}
          label="Bookings"
          value={loading ? "..." : cards.bookings}
          tone="text-success"
        />
        <StatCard
          icon={FiRepeat}
          label="Pending Transfers"
          value={loading ? "..." : cards.pendingTransfers}
          tone="text-warning"
        />
        <StatCard icon={FiTruck} label="Upcoming Returns" value={loading ? "..." : cards.upcomingReturns} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-950">Assets by Status</h2>
            <span className="text-xs font-semibold text-slate-400">{formatDate(data?.meta?.generatedAt)}</span>
          </div>
          <div className="h-72">
            {assetsByStatus.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetsByStatus} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={2}>
                    {assetsByStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              emptyMessage("No asset status data yet.")
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-950">Quick Actions</h2>
            <span className="text-xs font-semibold text-slate-400">Workflow shortcuts</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-primary"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <action.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{action.label}</span>
                </span>
                <span className="text-xs text-slate-400">Open</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-slate-950">Department Summary</h2>
          <span className="text-xs font-semibold text-slate-400">Assets and employees by department</span>
        </div>
        <div className="h-80">
          {departmentSummary.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-10} height={56} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assets" name="Assets" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="employees" name="Employees" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            emptyMessage("No department summary data yet.")
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-950">Recent Activities</h2>
            <FiClipboard className="h-4 w-4 text-slate-400" />
          </div>
          <div className="grid gap-3">
            {recentActivities.length
              ? recentActivities.map((item) => (
                  <article key={item.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase text-primary">{item.type}</span>
                          <span className={`status-pill ${statusTone(item.status)}`}>{labelize(item.status)}</span>
                        </div>
                        <h3 className="mt-1 truncate text-sm font-bold text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-400">{formatDate(item.createdAt)}</span>
                    </div>
                  </article>
                ))
              : emptyMessage("No recent activity yet.")}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-950">Notifications</h2>
            <Link to="/notifications" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="grid gap-3">
            {notifications.length
              ? notifications.map((item) => (
                  <article key={item.id} className="rounded-md border border-slate-100 px-3 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-primary">
                        <FiBell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-slate-950">{item.title}</h3>
                          {!item.readAt ? <span className="status-pill bg-amber-50 text-amber-700">Unread</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {labelize(item.type)} - {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              : emptyMessage("No notifications yet.")}
          </div>
        </section>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <FiUsers className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Department Rows</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{departmentSummary.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <FiBell className="h-5 w-5 text-warning" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Unread Notifications</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{data?.notifications?.unread || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <FiCalendar className="h-5 w-5 text-success" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Bookings Today</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{data?.meta?.bookingsToday || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <FiTruck className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Return Window</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{data?.meta?.upcomingReturnsWindowDays || 7} days</p>
        </div>
      </section>
    </div>
  );
}
