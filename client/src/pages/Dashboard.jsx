import { FiArchive, FiCalendar, FiCheckCircle, FiRepeat, FiTool, FiTruck } from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { useApiResource } from "../hooks/useApiResource";
import { reportsApi } from "../services/resources";

const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#64748b", "#0f766e"];

export default function Dashboard() {
  const { data, loading, error } = useApiResource(reportsApi.dashboard, []);
  const cards = data?.cards || {};
  const statusData = data?.charts?.assetStatus?.map((item) => ({ name: item.status, value: item._count })) || [];
  const departmentData =
    data?.charts?.departmentCounts?.map((item, index) => ({
      name: item.departmentId ? `Dept ${index + 1}` : "Unassigned",
      value: item._count
    })) || [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational overview for assets, allocations, transfers, bookings, maintenance, and audit activity."
      />
      {error ? <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={FiCheckCircle}
          label="Assets Available"
          value={loading ? "..." : cards.assetsAvailable}
          tone="text-success"
        />
        <StatCard icon={FiArchive} label="Allocated" value={cards.allocated} />
        <StatCard icon={FiTool} label="Maintenance Today" value={cards.maintenanceToday} tone="text-warning" />
        <StatCard icon={FiTruck} label="Upcoming Returns" value={cards.upcomingReturns} />
        <StatCard icon={FiRepeat} label="Pending Transfers" value={cards.pendingTransfers} tone="text-warning" />
        <StatCard icon={FiCalendar} label="Bookings Today" value={cards.bookingsToday} tone="text-success" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="mb-4 text-sm font-bold text-slate-950">Assets by Status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={95} label>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="mb-4 text-sm font-bold text-slate-950">Department Allocation</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="mb-3 text-sm font-bold text-slate-950">Recent Activities</h2>
        <div className="grid gap-2">
          {(data?.recentActivities || []).map((item) => (
            <div key={item.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item.title}: {item.message}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
