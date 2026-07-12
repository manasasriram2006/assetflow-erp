import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiDownload,
  FiEdit2,
  FiEye,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUpload
} from "react-icons/fi";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { Field, inputClass } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";
import { reportsApi, resourceApi } from "../services/resources";
import { formatDate } from "../utils/format";

const assetApi = {
  ...resourceApi("/assets"),
  get: (id) => api.get(`/assets/${id}`).then((res) => res.data),
  history: (id) => api.get(`/assets/${id}/history`).then((res) => res.data),
  uploadPhoto: (id, payload) => api.post(`/assets/${id}/photo`, payload).then((res) => res.data)
};
const categoryApi = resourceApi("/categories");
const departmentApi = resourceApi("/departments");

const statuses = ["AVAILABLE", "ALLOCATED", "RESERVED", "MAINTENANCE", "LOST", "RETIRED", "DISPOSED"];

const optionalText = (max) =>
  z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().max(max).optional());

const schema = z.object({
  name: z.string().trim().min(2, "Asset name is required").max(160),
  serialNo: optionalText(120),
  status: z.enum(statuses).default("AVAILABLE"),
  value: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().nonnegative().optional()),
  purchaseDate: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  location: optionalText(160),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional())
});

const blankAsset = {
  name: "",
  serialNo: "",
  status: "AVAILABLE",
  value: "",
  purchaseDate: "",
  location: "",
  categoryId: "",
  departmentId: ""
};

const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const publicUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${api.defaults.baseURL}${path}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });

export default function Assets({ initialTab = "directory" }) {
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [editingAsset, setEditingAsset] = useState(null);
  const [message, setMessage] = useState("");
  const [photoError, setPhotoError] = useState("");

  const query = useMemo(
    () => ({ page, limit: 10, search: search || undefined, status: status || undefined, categoryId: categoryId || undefined, departmentId: departmentId || undefined }),
    [page, search, status, categoryId, departmentId]
  );

  const { data, error, loading, refresh } = useApiResource(() => assetApi.list(query), [query]);
  const { data: categories } = useApiResource(() => categoryApi.list({ limit: 100 }), []);
  const { data: departments } = useApiResource(() => departmentApi.list({ limit: 100 }), []);
  const {
    data: selectedAsset,
    error: selectedError,
    refresh: refreshSelected
  } = useApiResource(() => (selectedId ? assetApi.get(selectedId) : Promise.resolve(null)), [selectedId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema), defaultValues: blankAsset });

  useEffect(() => {
    if (editingAsset) {
      reset({
        name: editingAsset.name || "",
        serialNo: editingAsset.serialNo || "",
        status: editingAsset.status || "AVAILABLE",
        value: editingAsset.value || "",
        purchaseDate: toInputDate(editingAsset.purchaseDate),
        location: editingAsset.location || "",
        categoryId: editingAsset.categoryId || "",
        departmentId: editingAsset.departmentId || ""
      });
    } else {
      reset(blankAsset);
    }
  }, [editingAsset, reset]);

  const rows = data?.items || [];
  const categoryOptions = categories?.items || [];
  const departmentOptions = departments?.items || [];

  const setFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const startCreate = () => {
    setEditingAsset(null);
    setTab("register");
    setMessage("");
  };

  const startEdit = (asset) => {
    setEditingAsset(asset);
    setSelectedId(asset.id);
    setTab("register");
    setMessage("");
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      serialNo: values.serialNo || undefined,
      value: values.value ?? undefined,
      purchaseDate: values.purchaseDate || undefined,
      location: values.location || undefined,
      departmentId: values.departmentId || undefined
    };

    const saved = editingAsset ? await assetApi.update(editingAsset.id, payload) : await assetApi.create(payload);
    setMessage(editingAsset ? "Asset updated" : `Asset registered as ${saved.assetTag}`);
    setSelectedId(saved.id);
    setEditingAsset(null);
    reset(blankAsset);
    setTab("directory");
    refresh();
    refreshSelected();
  };

  const onRemove = async (asset) => {
    if (!window.confirm(`Remove ${asset.assetTag} from the active register?`)) return;
    await assetApi.remove(asset.id);
    setMessage(`${asset.assetTag} removed`);
    if (selectedId === asset.id) setSelectedId("");
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

  const onPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!selectedId || !file) return;
    setPhotoError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setPhotoError("Use PNG, JPG, or WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be smaller than 5MB");
      return;
    }
    const photoData = await readFileAsDataUrl(file);
    await assetApi.uploadPhoto(selectedId, { fileName: file.name, photoData });
    refresh();
    refreshSelected();
  };

  const columns = [
    { key: "assetTag", header: "Tag" },
    { key: "name", header: "Asset" },
    { key: "category", header: "Category", render: (row) => row.category?.name || "-" },
    { key: "serialNo", header: "Serial", render: (row) => row.serialNo || "-" },
    { key: "location", header: "Location", render: (row) => row.location || "-" },
    { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" title="View" onClick={() => setSelectedId(row.id)}>
            <FiEye />
          </button>
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" title="Edit" onClick={() => startEdit(row)}>
            <FiEdit2 />
          </button>
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50" title="Remove" onClick={() => onRemove(row)}>
            <FiTrash2 />
          </button>
        </div>
      )
    }
  ];

  const history = selectedAsset?.history || [];

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
            <Button onClick={startCreate}>
              <FiPlus /> Register
            </Button>
          </>
        }
      />

      {message ? <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab("directory")} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "directory" ? "bg-primary text-white" : "bg-white text-slate-600"}`}>
          Directory
        </button>
        <button onClick={startCreate} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "register" ? "bg-primary text-white" : "bg-white text-slate-600"}`}>
          Registration
        </button>
      </div>

      {tab === "directory" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-3 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-soft md:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
              <label className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setFilter(setSearch)(event.target.value)} placeholder="Search tag, name, serial, location" />
              </label>
              <select className={inputClass} value={status} onChange={(event) => setFilter(setStatus)(event.target.value)}>
                <option value="">All statuses</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <select className={inputClass} value={categoryId} onChange={(event) => setFilter(setCategoryId)(event.target.value)}>
                <option value="">All categories</option>
                {categoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select className={inputClass} value={departmentId} onChange={(event) => setFilter(setDepartmentId)(event.target.value)}>
                <option value="">All departments</option>
                {departmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <DataTable columns={columns} rows={rows} empty={loading ? "Loading assets" : "No assets found"} />
            <Pagination meta={data?.meta} onPage={setPage} />
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            {selectedError ? <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{selectedError}</div> : null}
            {selectedAsset ? (
              <div className="grid gap-4">
                <div className="aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {selectedAsset.photoUrl ? (
                    <img src={publicUrl(selectedAsset.photoUrl)} alt={selectedAsset.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <FiImage className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">{selectedAsset.assetTag}</p>
                      <h2 className="text-lg font-bold text-slate-950">{selectedAsset.name}</h2>
                    </div>
                    <Status value={selectedAsset.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-400">Category</dt>
                      <dd className="font-medium text-slate-700">{selectedAsset.category?.name || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Department</dt>
                      <dd className="font-medium text-slate-700">{selectedAsset.department?.name || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Serial</dt>
                      <dd className="font-medium text-slate-700">{selectedAsset.serialNo || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Purchase</dt>
                      <dd className="font-medium text-slate-700">{formatDate(selectedAsset.purchaseDate)}</dd>
                    </div>
                  </dl>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <FiUpload /> Upload Photo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPhoto} />
                </label>
                {photoError ? <p className="text-sm text-danger">{photoError}</p> : null}
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-950">History</h3>
                  <div className="grid max-h-80 gap-2 overflow-auto pr-1">
                    {history.length ? (
                      history.map((item) => (
                        <div key={item.id} className="rounded-md border border-slate-100 p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-slate-800">{item.action.replaceAll("_", " ")}</p>
                            <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-slate-500">{item.notes || "No notes"}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.actor?.name || "System"}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No history yet</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">Select an asset to view photo and history</div>
            )}
          </aside>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2">
          <Field label="Asset Name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select className={inputClass} {...register("status")}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Serial No" error={errors.serialNo?.message}>
            <input className={inputClass} {...register("serialNo")} />
          </Field>
          <Field label="Value" error={errors.value?.message}>
            <input type="number" min="0" step="0.01" className={inputClass} {...register("value")} />
          </Field>
          <Field label="Purchase Date" error={errors.purchaseDate?.message}>
            <input type="date" className={inputClass} {...register("purchaseDate")} />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <input className={inputClass} {...register("location")} />
          </Field>
          <Field label="Category" error={errors.categoryId?.message}>
            <select className={inputClass} {...register("categoryId")}>
              <option value="">Select</option>
              {categoryOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department" error={errors.departmentId?.message}>
            <select className={inputClass} {...register("departmentId")}>
              <option value="">Unassigned</option>
              {departmentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button disabled={isSubmitting}>{editingAsset ? "Update Asset" : "Create Asset"}</Button>
            <Button type="button" variant="secondary" onClick={() => { setEditingAsset(null); setTab("directory"); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
