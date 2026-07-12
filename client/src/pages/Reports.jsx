import { FiDownload, FiPieChart, FiRefreshCw } from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "../components/Button";
import { Alert } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { useApiResource } from "../hooks/useApiResource";
import { reportsApi } from "../services/resources";
import { formatDate } from "../utils/format";

const chartColors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#0f766e", "#7c3aed", "#64748b"];

const labelize = (value = "") =>
  String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const emptyMessage = (message) => (
  <div className="grid h-full min-h-56 place-items-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
    {message}
  </div>
);

const ChartPanel = ({ title, meta, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-sm font-bold text-slate-950">{title}</h2>
      {meta ? <span className="text-xs font-semibold text-slate-400">{meta}</span> : null}
    </div>
    <div className="h-72 sm:h-80">{children}</div>
  </section>
);

export default function Reports() {
  const { data, loading, error, refresh } = useApiResource(reportsApi.summary, []);
  const charts = data?.charts || {};
  const summary = data?.summary || {};

  const assetsByStatus =
    charts.assetsByStatus?.map((item) => ({
      name: labelize(item.status),
      count: item.count
    })) || [];
  const assetsByCategory =
    charts.assetsByCategory?.map((item) => ({
      name: item.category,
      count: item.count
    })) || [];
  const departmentUtilization =
    charts.departmentUtilization?.map((item) => ({
      name: item.code || item.department,
      department: item.department,
      assets: item.assets,
      allocated: item.allocated,
      maintenance: item.maintenance,
      employees: item.employees,
      utilization: item.utilization
    })) || [];
  const maintenanceTrend = charts.maintenanceTrend || [];
  const bookingTrend = charts.bookingTrend || [];

  const exportCsv = async () => {
    const blob = await reportsApi.exportReports();
    downloadBlob(blob, "assetflow-reports.csv");
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Asset status, category spread, department utilization, maintenance movement, booking movement, and CSV export."
        actions={
          <>
            <Button onClick={refresh} variant="secondary" disabled={loading}>
              <FiRefreshCw /> Refresh
            </Button>
            <Button onClick={exportCsv}>
              <FiDownload /> Export CSV
            </Button>
          </>
        }
      />

      <Alert tone="warning">{error}</Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FiPieChart} label="Total Assets" value={loading ? "..." : summary.totalAssets || 0} />
        <StatCard icon={FiPieChart} label="Categories" value={loading ? "..." : summary.categories || 0} />
        <StatCard icon={FiPieChart} label="Departments" value={loading ? "..." : summary.departments || 0} />
        <StatCard icon={FiPieChart} label="Maintenance" value={loading ? "..." : summary.maintenanceRequests || 0} />
        <StatCard icon={FiPieChart} label="Bookings" value={loading ? "..." : summary.bookings || 0} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Assets by Status" meta={formatDate(data?.meta?.generatedAt)}>
          {assetsByStatus.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetsByStatus} dataKey="count" nameKey="name" innerRadius={58} outerRadius={98} paddingAngle={2}>
                  {assetsByStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            emptyMessage("No status data available.")
          )}
        </ChartPanel>

        <ChartPanel title="Assets by Category" meta={`${assetsByCategory.length} categories`}>
          {assetsByCategory.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetsByCategory} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={72} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Assets" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            emptyMessage("No category data available.")
          )}
        </ChartPanel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartPanel title="Department Utilization" meta="Allocated assets by department">
          {departmentUtilization.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={departmentUtilization} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" unit="%" />
                <Tooltip
                  formatter={(value, name) => [name === "utilization" ? `${value}%` : value, labelize(name)]}
                  labelFormatter={(label) =>
                    departmentUtilization.find((item) => item.name === label)?.department || label
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="allocated" name="Allocated" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="maintenance" name="Maintenance" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="utilization" name="Utilization %" stroke="#7c3aed" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            emptyMessage("No department utilization data available.")
          )}
        </ChartPanel>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-950">Utilization Table</h2>
            <span className="text-xs font-semibold text-slate-400">{departmentUtilization.length} rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table w-full min-w-[520px]">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Assets</th>
                  <th>Allocated</th>
                  <th>Employees</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {departmentUtilization.length ? (
                  departmentUtilization.map((item) => (
                    <tr key={item.name}>
                      <td className="font-semibold text-slate-950">{item.department}</td>
                      <td>{item.assets}</td>
                      <td>{item.allocated}</td>
                      <td>{item.employees}</td>
                      <td>{item.utilization}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500">
                      No department data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Maintenance Trend" meta={`Last ${data?.meta?.trendMonths || 6} months`}>
          {maintenanceTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={maintenanceTrend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Requests" stroke="#d97706" fill="#fed7aa" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            emptyMessage("No maintenance trend data available.")
          )}
        </ChartPanel>

        <ChartPanel title="Booking Trend" meta={`Last ${data?.meta?.trendMonths || 6} months`}>
          {bookingTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingTrend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Bookings" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            emptyMessage("No booking trend data available.")
          )}
        </ChartPanel>
      </div>
    </div>
  );
}
