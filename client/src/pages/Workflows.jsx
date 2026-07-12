import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiCheck, FiRefreshCw, FiRotateCcw, FiSend, FiX } from "react-icons/fi";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { Field, inputClass } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useApiResource } from "../hooks/useApiResource";
import { resourceApi, workflowApi } from "../services/resources";
import { formatDate } from "../utils/format";

const titles = {
  allocation: ["Allocation", "Allocate, return, transfer, approve, and audit asset custody."],
  transfers: ["Transfer Request", "Request and approve asset handovers between employees or departments."],
  bookings: ["Booking", "Book shared resources and prevent overlapping reservations."],
  maintenance: ["Maintenance", "Track maintenance workflow from request to resolution."],
  audits: ["Audit", "Create audit cycles, verify assets, and report discrepancies."]
};

const assetApi = resourceApi("/assets");
const userApi = {
  list: () =>
    import("../services/api").then(({ api }) =>
      api.get("/users", { params: { limit: 100, status: "ACTIVE" } }).then((res) => res.data.items || [])
    )
};

const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().max(500).optional());

const allocationSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  userId: z.string().min(1, "Employee is required"),
  dueAt: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
  notes: optionalText
});

const transferSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  receiverId: z.string().min(1, "Receiver is required"),
  reason: z.string().trim().min(5, "Reason is required").max(500)
});

const canApprove = (role) => ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(role);

function AllocationModule({ initialTab = "allocations" }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [message, setMessage] = useState("");
  const assets = useApiResource(() => assetApi.list({ limit: 100 }), []);
  const users = useApiResource(userApi.list, []);
  const allocations = useApiResource(workflowApi.allocations, []);
  const transfers = useApiResource(workflowApi.transfers, []);
  const history = useApiResource(workflowApi.allocationHistory, []);

  const allocationForm = useForm({ resolver: zodResolver(allocationSchema), defaultValues: { assetId: "", userId: "", dueAt: "", notes: "" } });
  const transferForm = useForm({ resolver: zodResolver(transferSchema), defaultValues: { assetId: "", receiverId: "", reason: "" } });

  const refreshAll = () => {
    assets.refresh();
    allocations.refresh();
    transfers.refresh();
    history.refresh();
  };

  const onAllocate = async (values) => {
    await workflowApi.allocate({ ...values, dueAt: values.dueAt || undefined, notes: values.notes || undefined });
    allocationForm.reset();
    setMessage("Asset allocated");
    refreshAll();
  };

  const onTransfer = async (values) => {
    await workflowApi.requestTransfer(values);
    transferForm.reset();
    setMessage("Transfer request submitted");
    refreshAll();
  };

  const returnAsset = async (allocation) => {
    if (!window.confirm(`Return ${allocation.asset?.assetTag}?`)) return;
    await workflowApi.returnAsset(allocation.id);
    setMessage(`${allocation.asset?.assetTag} returned`);
    refreshAll();
  };

  const decideTransfer = async (transfer, action) => {
    const label = action === "approve" ? "approve" : "reject";
    if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} transfer for ${transfer.asset?.assetTag}?`)) return;
    if (action === "approve") await workflowApi.approveTransfer(transfer.id);
    else await workflowApi.rejectTransfer(transfer.id);
    setMessage(`Transfer ${action === "approve" ? "approved" : "rejected"}`);
    refreshAll();
  };

  const assetOptions = assets.data?.items || [];
  const userOptions = users.data || [];
  const availableAssets = assetOptions.filter((asset) => asset.status === "AVAILABLE");
  const allocatedAssets = assetOptions.filter((asset) => asset.status === "ALLOCATED");

  const allocationColumns = [
    { key: "asset", header: "Asset", render: (row) => `${row.asset?.assetTag || "-"} ${row.asset?.name ? `- ${row.asset.name}` : ""}` },
    { key: "user", header: "Holder", render: (row) => row.user?.name || "-" },
    { key: "issuedAt", header: "Issued", render: (row) => formatDate(row.issuedAt) },
    { key: "dueAt", header: "Due", render: (row) => formatDate(row.dueAt) },
    { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "ACTIVE" ? (
          <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => returnAsset(row)}>
            <FiRotateCcw /> Return
          </Button>
        ) : null
    }
  ];

  const transferColumns = [
    { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag || "-" },
    { key: "requester", header: "Requester", render: (row) => row.requester?.name || "-" },
    { key: "receiver", header: "Receiver", render: (row) => row.receiver?.name || "-" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "PENDING" && canApprove(user?.role) ? (
          <div className="flex justify-end gap-1">
            <Button type="button" className="px-3 py-1.5" onClick={() => decideTransfer(row, "approve")}>
              <FiCheck /> Approve
            </Button>
            <Button type="button" variant="danger" className="px-3 py-1.5" onClick={() => decideTransfer(row, "reject")}>
              <FiX /> Reject
            </Button>
          </div>
        ) : null
    }
  ];

  const historyColumns = [
    { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag || "-" },
    { key: "action", header: "Action", render: (row) => row.action?.replaceAll("_", " ") },
    { key: "actor", header: "By", render: (row) => row.actor?.name || "System" },
    { key: "notes", header: "Notes", render: (row) => row.notes || "-" },
    { key: "createdAt", header: "Date", render: (row) => formatDate(row.createdAt) }
  ];

  return (
    <div>
      <PageHeader
        title="Allocation"
        description="Allocate available assets, return active assignments, and approve custody transfers."
        actions={
          <Button variant="secondary" onClick={refreshAll}>
            <FiRefreshCw /> Refresh
          </Button>
        }
      />
      {message ? <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div> : null}
      {[assets.error, allocations.error, transfers.error, history.error].filter(Boolean).map((error) => (
        <div key={error} className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ))}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["allocations", "Allocations"],
          ["transfer", "Transfer Request"],
          ["approvals", "Approvals"],
          ["history", "History"]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === key ? "bg-primary text-white" : "bg-white text-slate-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "allocations" ? (
        <>
          <form onSubmit={allocationForm.handleSubmit(onAllocate)} className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-5">
            <Field label="Available Asset" error={allocationForm.formState.errors.assetId?.message}>
              <select className={inputClass} {...allocationForm.register("assetId")}>
                <option value="">Select asset</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetTag} - {asset.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Employee" error={allocationForm.formState.errors.userId?.message}>
              <select className={inputClass} {...allocationForm.register("userId")}>
                <option value="">Select employee</option>
                {userOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due Date" error={allocationForm.formState.errors.dueAt?.message}>
              <input type="datetime-local" className={inputClass} {...allocationForm.register("dueAt")} />
            </Field>
            <Field label="Notes" error={allocationForm.formState.errors.notes?.message}>
              <input className={inputClass} {...allocationForm.register("notes")} />
            </Field>
            <div className="flex items-end">
              <Button disabled={allocationForm.formState.isSubmitting}>Allocate Asset</Button>
            </div>
          </form>
          <DataTable columns={allocationColumns} rows={allocations.data || []} />
        </>
      ) : null}

      {tab === "transfer" ? (
        <form onSubmit={transferForm.handleSubmit(onTransfer)} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-4">
          <Field label="Allocated Asset" error={transferForm.formState.errors.assetId?.message}>
            <select className={inputClass} {...transferForm.register("assetId")}>
              <option value="">Select asset</option>
              {allocatedAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetTag} - {asset.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Receiver" error={transferForm.formState.errors.receiverId?.message}>
            <select className={inputClass} {...transferForm.register("receiverId")}>
              <option value="">Select receiver</option>
              {userOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reason" error={transferForm.formState.errors.reason?.message}>
            <input className={inputClass} {...transferForm.register("reason")} />
          </Field>
          <div className="flex items-end">
            <Button disabled={transferForm.formState.isSubmitting}>
              <FiSend /> Request Transfer
            </Button>
          </div>
        </form>
      ) : null}

      {tab === "approvals" ? <DataTable columns={transferColumns} rows={transfers.data || []} /> : null}
      {tab === "history" ? <DataTable columns={historyColumns} rows={history.data || []} /> : null}
    </div>
  );
}

function GenericWorkflow({ type }) {
  const [title, description] = titles[type] || titles.allocation;
  const assets = useApiResource(() => assetApi.list({ limit: 100 }), []);
  const form = useForm();

  const loaders = {
    bookings: workflowApi.bookings,
    maintenance: workflowApi.maintenance,
    audits: workflowApi.audits
  };
  const records = useApiResource(loaders[type], [type]);

  const submit = async (values) => {
    const action = {
      bookings: () => workflowApi.book(values),
      maintenance: () => workflowApi.requestMaintenance(values),
      audits: () =>
        workflowApi.createAudit({
          name: values.name,
          startsAt: values.startsAt,
          endsAt: values.endsAt || undefined,
          assetIds: values.assetId ? [values.assetId] : []
        })
    }[type];
    await action();
    form.reset();
    records.refresh();
  };

  const assetSelect = (
    <select className={inputClass} {...form.register("assetId", { required: true })}>
      <option value="">Select asset</option>
      {(assets.data?.items || []).map((asset) => (
        <option key={asset.id} value={asset.id}>
          {asset.assetTag} - {asset.name}
        </option>
      ))}
    </select>
  );

  const columns = {
    bookings: [
      { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag },
      { key: "purpose", header: "Purpose" },
      { key: "startsAt", header: "Starts", render: (row) => formatDate(row.startsAt) },
      { key: "status", header: "Status", render: (row) => <Status value={row.status} /> }
    ],
    maintenance: [
      { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag },
      { key: "title", header: "Issue" },
      { key: "requester", header: "Requester", render: (row) => row.requester?.name },
      { key: "status", header: "Status", render: (row) => <Status value={row.status} /> }
    ],
    audits: [
      { key: "name", header: "Cycle" },
      { key: "startsAt", header: "Starts", render: (row) => formatDate(row.startsAt) },
      { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
      { key: "items", header: "Items", render: (row) => row.items?.length || 0 }
    ]
  };

  return (
    <div>
      <PageHeader title={title} description={description} />
      <form onSubmit={form.handleSubmit(submit)} className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-4">
        {type !== "audits" ? (
          <Field label="Asset">{assetSelect}</Field>
        ) : (
          <Field label="Audit Name">
            <input className={inputClass} {...form.register("name", { required: true })} />
          </Field>
        )}
        {type === "bookings" ? (
          <>
            <Field label="Starts">
              <input type="datetime-local" className={inputClass} {...form.register("startsAt", { required: true })} />
            </Field>
            <Field label="Ends">
              <input type="datetime-local" className={inputClass} {...form.register("endsAt", { required: true })} />
            </Field>
            <Field label="Purpose">
              <input className={inputClass} {...form.register("purpose", { required: true })} />
            </Field>
          </>
        ) : null}
        {type === "maintenance" ? (
          <>
            <Field label="Title">
              <input className={inputClass} {...form.register("title", { required: true })} />
            </Field>
            <Field label="Description">
              <input className={inputClass} {...form.register("description", { required: true })} />
            </Field>
          </>
        ) : null}
        {type === "audits" ? (
          <>
            <Field label="Starts">
              <input type="datetime-local" className={inputClass} {...form.register("startsAt", { required: true })} />
            </Field>
            <Field label="Include Asset">{assetSelect}</Field>
          </>
        ) : null}
        <div className="flex items-end">
          <Button>Create</Button>
        </div>
      </form>
      {records.error ? <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">{records.error}</div> : null}
      <DataTable columns={columns[type]} rows={records.data || []} />
    </div>
  );
}

export default function Workflows({ type = "allocation" }) {
  if (type === "allocation") return <AllocationModule initialTab="allocations" />;
  if (type === "transfers") return <AllocationModule initialTab="transfer" />;
  return <GenericWorkflow type={type} />;
}
