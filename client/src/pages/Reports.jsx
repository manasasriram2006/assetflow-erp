import { FiDownload } from "react-icons/fi";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { useApiResource } from "../hooks/useApiResource";
import { reportsApi } from "../services/resources";

export default function Reports() {
  const { data } = useApiResource(reportsApi.dashboard, []);
  const exportCsv = async () => {
    const blob = await reportsApi.exportAssets();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assetflow-assets.csv";
    link.click();
  };
  const statusData = data?.charts?.assetStatus?.map((row) => ({ name: row.status, count: row._count })) || [];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Asset utilization, maintenance frequency, department summaries, booking statistics, and CSV exports."
        actions={
          <Button onClick={exportCsv}>
            <FiDownload /> Export CSV
          </Button>
        }
      />
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="mb-4 text-sm font-bold">Asset Status Distribution</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
