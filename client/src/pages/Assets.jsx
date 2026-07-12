import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiDownload, FiPlus, FiRefreshCw } from "react-icons/fi";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { Field, inputClass } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { useApiResource } from "../hooks/useApiResource";
import { reportsApi, resourceApi } from "../services/resources";

const assetApi = resourceApi("/assets");
const categoryApi = resourceApi("/categories");
const departmentApi = resourceApi("/departments");

const schema = z.object({
  name: z.string().min(2),
  serialNo: z.string().optional(),
  value: z.coerce.number().optional(),
  location: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.string().optional()
});

export default function Assets({ initialTab = "directory" }) {
  const [tab, setTab] = useState(initialTab);
  const { data, error, refresh } = useApiResource(() => assetApi.list({ limit: 50 }), []);
  const { data: categories } = useApiResource(() => categoryApi.list({ limit: 50 }), []);
  const { data: departments } = useApiResource(() => departmentApi.list({ limit: 50 }), []);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    await assetApi.create({ ...values, departmentId: values.departmentId || undefined });
    reset();
    setTab("directory");
    refresh();
  };

  const exportCsv = async () => {
    const blob = await reportsApi.exportAssets();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assetflow-assets.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const rows = data?.items || [];
  const columns = [
    { key: "assetTag", header: "Tag" },
    { key: "name", header: "Asset" },
    { key: "serialNo", header: "Serial" },
    { key: "location", header: "Location" },
    { key: "status", header: "Status", render: (row) => <Status value={row.status} /> }
  ];

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Register, search, track, allocate, retire, and report enterprise assets."
        actions={
          <>
            <Button variant="secondary" onClick={refresh}>
              <FiRefreshCw /> Refresh
            </Button>
            <Button variant="secondary" onClick={exportCsv}>
              <FiDownload /> CSV
            </Button>
            <Button onClick={() => setTab("register")}>
              <FiPlus /> Register
            </Button>
          </>
        }
      />
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("directory")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "directory" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
        >
          Directory
        </button>
        <button
          onClick={() => setTab("register")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "register" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
        >
          Registration
        </button>
      </div>
      {error ? <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}
      {tab === "directory" ? (
        <DataTable columns={columns} rows={rows} />
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2"
        >
          <Field label="Asset Name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} />
          </Field>
          <Field label="Serial No" error={errors.serialNo?.message}>
            <input className={inputClass} {...register("serialNo")} />
          </Field>
          <Field label="Value" error={errors.value?.message}>
            <input type="number" className={inputClass} {...register("value")} />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <input className={inputClass} {...register("location")} />
          </Field>
          <Field label="Category" error={errors.categoryId?.message}>
            <select className={inputClass} {...register("categoryId")}>
              <option value="">Select</option>
              {(categories?.items || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department" error={errors.departmentId?.message}>
            <select className={inputClass} {...register("departmentId")}>
              <option value="">Unassigned</option>
              {(departments?.items || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Button disabled={isSubmitting}>Create Asset</Button>
          </div>
        </form>
      )}
    </div>
  );
}
