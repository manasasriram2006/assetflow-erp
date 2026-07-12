import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiAlertTriangle,
  FiBell,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiPaperclip,
  FiRefreshCw,
  FiRotateCcw,
  FiSend,
  FiTool,
  FiUpload,
  FiUserCheck,
  FiX
} from "react-icons/fi";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { Alert } from "../components/Feedback";
import { Field, inputClass } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";
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
  list: () => api.get("/users", { params: { limit: 100, status: "ACTIVE" } }).then((res) => res.data.items || [])
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

const bookingSchema = z
  .object({
    assetId: z.string().min(1, "Asset is required"),
    startsAt: z.string().min(1, "Start time is required"),
    endsAt: z.string().min(1, "End time is required"),
    purpose: z.string().trim().min(3, "Purpose is required").max(500)
  })
  .refine((data) => new Date(data.startsAt) > new Date(), {
    message: "Start must be in the future",
    path: ["startsAt"]
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End must be after start",
    path: ["endsAt"]
  });

const maintenanceSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  title: z.string().trim().min(3, "Title is required").max(160),
  description: z.string().trim().min(5, "Description is required").max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  scheduledAt: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional())
});

const auditSchema = z
  .object({
    name: z.string().trim().min(3, "Audit name is required").max(160),
    startsAt: z.string().min(1, "Start date is required"),
    endsAt: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
    assetIds: z.array(z.string()).min(1, "Select at least one asset")
  })
  .refine((data) => !data.endsAt || new Date(data.endsAt) >= new Date(data.startsAt), {
    message: "End must be after start",
    path: ["endsAt"]
  });

const canApprove = (role) => ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(role);

const toMonthInput = (date) => date.toISOString().slice(0, 7);
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
const publicUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${api.defaults.baseURL}${url}`;
};
const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

const ErrorList = ({ errors }) =>
  errors.filter(Boolean).map((error) => (
    <Alert key={error} tone="warning">
      {error}
    </Alert>
  ));

function AllocationModule({ initialTab = "allocations" }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [message, setMessage] = useState("");
  const assets = useApiResource(() => assetApi.list({ limit: 100 }), []);
  const users = useApiResource(userApi.list, []);
  const allocations = useApiResource(workflowApi.allocations, []);
  const transfers = useApiResource(workflowApi.transfers, []);
  const history = useApiResource(workflowApi.allocationHistory, []);

  const allocationForm = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: { assetId: "", userId: "", dueAt: "", notes: "" }
  });
  const transferForm = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: { assetId: "", receiverId: "", reason: "" }
  });

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
    {
      key: "asset",
      header: "Asset",
      render: (row) => `${row.asset?.assetTag || "-"} ${row.asset?.name ? `- ${row.asset.name}` : ""}`
    },
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
            <Button
              type="button"
              variant="danger"
              className="px-3 py-1.5"
              onClick={() => decideTransfer(row, "reject")}
            >
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
      <Alert tone="success">{message}</Alert>
      <ErrorList errors={[assets.error, allocations.error, transfers.error, history.error]} />

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
          <form
            onSubmit={allocationForm.handleSubmit(onAllocate)}
            className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-5"
          >
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
        <form
          onSubmit={transferForm.handleSubmit(onTransfer)}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-4"
        >
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

function BookingModule() {
  const { user } = useAuth();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const query = {
    from: monthStart.toISOString(),
    to: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59).toISOString(),
    status: status || undefined
  };

  const assets = useApiResource(() => assetApi.list({ limit: 100 }), []);
  const bookings = useApiResource(() => workflowApi.bookings(query), [month, status]);
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { assetId: "", startsAt: "", endsAt: "", purpose: "" }
  });

  const refreshAll = () => {
    assets.refresh();
    bookings.refresh();
  };

  const onBook = async (values) => {
    await workflowApi.book(values);
    form.reset();
    setMessage("Booking created");
    refreshAll();
  };

  const onCancel = async (booking) => {
    if (!window.confirm(`Cancel booking for ${booking.asset?.assetTag}?`)) return;
    await workflowApi.cancelBooking(booking.id);
    setMessage("Booking cancelled");
    refreshAll();
  };

  const sendReminders = async () => {
    const result = await workflowApi.sendBookingReminders();
    setMessage(`${result.sent} reminder${result.sent === 1 ? "" : "s"} sent`);
  };

  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const rows = bookings.data || [];
  const bookableAssets = (assets.data?.items || []).filter((asset) => ["AVAILABLE", "RESERVED"].includes(asset.status));
  const canSendReminders = canApprove(user?.role);

  const historyColumns = [
    { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag || "-" },
    { key: "user", header: "Booked By", render: (row) => row.user?.name || "-" },
    { key: "purpose", header: "Purpose" },
    { key: "startsAt", header: "Starts", render: (row) => formatDateTime(row.startsAt) },
    { key: "endsAt", header: "Ends", render: (row) => formatDateTime(row.endsAt) },
    { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
    {
      key: "actions",
      header: "",
      render: (row) =>
        ["UPCOMING", "ONGOING"].includes(row.status) ? (
          <Button type="button" variant="danger" className="px-3 py-1.5" onClick={() => onCancel(row)}>
            <FiX /> Cancel
          </Button>
        ) : null
    }
  ];

  return (
    <div>
      <PageHeader
        title="Booking"
        description="Book shared resources, validate overlapping windows, and track upcoming, ongoing, completed, and cancelled bookings."
        actions={
          <>
            {canSendReminders ? (
              <Button variant="secondary" onClick={sendReminders}>
                <FiBell /> Reminders
              </Button>
            ) : null}
            <Button variant="secondary" onClick={refreshAll}>
              <FiRefreshCw /> Refresh
            </Button>
          </>
        }
      />
      <Alert tone="success">{message}</Alert>
      <ErrorList errors={[assets.error, bookings.error]} />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form
          onSubmit={form.handleSubmit(onBook)}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft"
        >
          <Field label="Asset" error={form.formState.errors.assetId?.message}>
            <select className={inputClass} {...form.register("assetId")}>
              <option value="">Select asset</option>
              {bookableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetTag} - {asset.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Starts" error={form.formState.errors.startsAt?.message}>
            <input type="datetime-local" className={inputClass} {...form.register("startsAt")} />
          </Field>
          <Field label="Ends" error={form.formState.errors.endsAt?.message}>
            <input type="datetime-local" className={inputClass} {...form.register("endsAt")} />
          </Field>
          <Field label="Purpose" error={form.formState.errors.purpose?.message}>
            <textarea className={`${inputClass} min-h-24 resize-y`} {...form.register("purpose")} />
          </Field>
          <Button disabled={form.formState.isSubmitting}>Create Booking</Button>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setMonth(addMonths(month, -1))}
                title="Previous month"
              >
                <FiChevronLeft />
              </button>
              <input
                type="month"
                className={`${inputClass} w-44`}
                value={toMonthInput(month)}
                onChange={(event) => setMonth(startOfMonth(new Date(`${event.target.value}-01T00:00:00`)))}
              />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setMonth(addMonths(month, 1))}
                title="Next month"
              >
                <FiChevronRight />
              </button>
            </div>
            <select
              className={`${inputClass} md:max-w-48`}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-7 overflow-hidden rounded-md border border-slate-200 text-xs font-semibold uppercase tracking-normal text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="border-b border-slate-200 bg-slate-50 px-2 py-2">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayBookings = rows.filter((booking) => sameDay(new Date(booking.startsAt), day));
              const inMonth = day.getMonth() === month.getMonth();
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-28 border-b border-r border-slate-100 p-2 ${inMonth ? "bg-white" : "bg-slate-50 text-slate-300"}`}
                >
                  <div className="mb-2 text-sm font-bold text-slate-700">{day.getDate()}</div>
                  <div className="grid gap-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold normal-case text-primary"
                      >
                        {booking.asset?.assetTag}{" "}
                        {new Date(booking.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    ))}
                    {dayBookings.length > 3 ? (
                      <div className="text-[11px] normal-case text-slate-400">+{dayBookings.length - 3} more</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-4">
        <DataTable columns={historyColumns} rows={rows} empty="No bookings found" />
      </section>
    </div>
  );
}

function MaintenanceModule() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const assets = useApiResource(() => assetApi.list({ limit: 100 }), []);
  const users = useApiResource(userApi.list, []);
  const requests = useApiResource(workflowApi.maintenance, []);
  const history = useApiResource(workflowApi.maintenanceHistory, []);
  const form = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { assetId: "", title: "", description: "", priority: "MEDIUM", scheduledAt: "" }
  });

  const refreshAll = () => {
    assets.refresh();
    requests.refresh();
    history.refresh();
  };

  const canManage = canApprove(user?.role);
  const rows = requests.data || [];
  const selected = rows.find((row) => row.id === selectedId) || rows[0];
  const technicians = users.data || [];
  const maintainableAssets = (assets.data?.items || []).filter(
    (asset) => !["LOST", "RETIRED", "DISPOSED"].includes(asset.status)
  );

  const onCreate = async (values) => {
    await workflowApi.requestMaintenance({ ...values, scheduledAt: values.scheduledAt || undefined });
    form.reset({ assetId: "", title: "", description: "", priority: "MEDIUM", scheduledAt: "" });
    setMessage("Maintenance request created");
    refreshAll();
  };

  const updateStatus = async (request, status) => {
    await workflowApi.updateMaintenanceStatus(request.id, { status, notes: notes || undefined });
    setMessage(`Maintenance ${status.replaceAll("_", " ").toLowerCase()}`);
    setNotes("");
    refreshAll();
  };

  const assignTechnician = async () => {
    if (!selected || !technicianId) return;
    await workflowApi.assignMaintenanceTechnician(selected.id, {
      technicianId,
      scheduledAt: scheduledAt || undefined,
      notes: notes || undefined
    });
    setMessage("Technician assigned");
    setTechnicianId("");
    setScheduledAt("");
    setNotes("");
    refreshAll();
  };

  const uploadAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!selected || !file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Attachment must be smaller than 5MB");
      return;
    }
    const attachmentData = await readFileAsDataUrl(file);
    await workflowApi.uploadMaintenanceAttachment(selected.id, { fileName: file.name, attachmentData });
    setMessage("Attachment uploaded");
    refreshAll();
  };

  const requestColumns = [
    { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag || "-" },
    { key: "title", header: "Issue" },
    { key: "priority", header: "Priority", render: (row) => <Status value={row.priority} /> },
    { key: "requester", header: "Requester", render: (row) => row.requester?.name || "-" },
    { key: "technician", header: "Technician", render: (row) => row.technician?.name || "-" },
    { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setSelectedId(row.id)}>
          View
        </Button>
      )
    }
  ];

  const historyColumns = [
    { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag || "-" },
    { key: "action", header: "Action", render: (row) => row.action?.replaceAll("_", " ") },
    { key: "actor", header: "By", render: (row) => row.actor?.name || "System" },
    { key: "notes", header: "Notes", render: (row) => row.notes || "-" },
    { key: "createdAt", header: "Date", render: (row) => formatDateTime(row.createdAt) }
  ];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Review requests, approve work, assign technicians, track progress, resolve issues, and retain maintenance history."
        actions={
          <Button variant="secondary" onClick={refreshAll}>
            <FiRefreshCw /> Refresh
          </Button>
        }
      />
      <Alert tone="success">{message}</Alert>
      <ErrorList errors={[assets.error, users.error, requests.error, history.error]} />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form
          onSubmit={form.handleSubmit(onCreate)}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft"
        >
          <Field label="Asset" error={form.formState.errors.assetId?.message}>
            <select className={inputClass} {...form.register("assetId")}>
              <option value="">Select asset</option>
              {maintainableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetTag} - {asset.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority" error={form.formState.errors.priority?.message}>
            <select className={inputClass} {...form.register("priority")}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title" error={form.formState.errors.title?.message}>
            <input className={inputClass} {...form.register("title")} />
          </Field>
          <Field label="Description" error={form.formState.errors.description?.message}>
            <textarea className={`${inputClass} min-h-24 resize-y`} {...form.register("description")} />
          </Field>
          <Field label="Scheduled At" error={form.formState.errors.scheduledAt?.message}>
            <input type="datetime-local" className={inputClass} {...form.register("scheduledAt")} />
          </Field>
          <Button disabled={form.formState.isSubmitting}>
            <FiTool /> Request Maintenance
          </Button>
        </form>

        <section className="grid gap-4">
          <DataTable columns={requestColumns} rows={rows} empty="No maintenance requests found" />

          {selected ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">
                    {selected.asset?.assetTag}
                  </p>
                  <h2 className="text-lg font-bold text-slate-950">{selected.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Status value={selected.priority} />
                  <Status value={selected.status} />
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <Field label="Technician">
                  <select
                    className={inputClass}
                    value={technicianId}
                    onChange={(event) => setTechnicianId(event.target.value)}
                    disabled={!canManage}
                  >
                    <option value="">Select technician</option>
                    {technicians.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Scheduled At">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Notes">
                  <input
                    className={inputClass}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    disabled={!canManage}
                  />
                </Field>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {canManage && selected.status === "PENDING" ? (
                  <>
                    <Button type="button" onClick={() => updateStatus(selected, "APPROVED")}>
                      <FiCheck /> Approve
                    </Button>
                    <Button type="button" variant="danger" onClick={() => updateStatus(selected, "REJECTED")}>
                      <FiX /> Reject
                    </Button>
                  </>
                ) : null}
                {canManage && ["APPROVED", "TECHNICIAN_ASSIGNED"].includes(selected.status) ? (
                  <Button type="button" variant="secondary" onClick={assignTechnician}>
                    <FiTool /> Assign Technician
                  </Button>
                ) : null}
                {canManage && ["APPROVED", "TECHNICIAN_ASSIGNED"].includes(selected.status) ? (
                  <Button type="button" onClick={() => updateStatus(selected, "IN_PROGRESS")}>
                    In Progress
                  </Button>
                ) : null}
                {canManage && ["TECHNICIAN_ASSIGNED", "IN_PROGRESS"].includes(selected.status) ? (
                  <Button type="button" onClick={() => updateStatus(selected, "RESOLVED")}>
                    Resolve
                  </Button>
                ) : null}
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <FiUpload /> Attachment
                  <input type="file" className="hidden" onChange={uploadAttachment} />
                </label>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-950">Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {(selected.attachments || []).length ? (
                    selected.attachments.map((item) => (
                      <a
                        key={item.id || item.url}
                        href={publicUrl(item.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FiPaperclip /> {item.name}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No attachments uploaded</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-4">
        <DataTable columns={historyColumns} rows={history.data || []} empty="No maintenance history found" />
      </section>
    </div>
  );
}

function AuditModule() {
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [auditorByItem, setAuditorByItem] = useState({});
  const [notesByItem, setNotesByItem] = useState({});
  const [report, setReport] = useState(null);
  const assets = useApiResource(() => assetApi.list({ limit: 100 }), []);
  const users = useApiResource(userApi.list, []);
  const audits = useApiResource(workflowApi.audits, []);
  const history = useApiResource(workflowApi.auditHistory, []);
  const form = useForm({
    resolver: zodResolver(auditSchema),
    defaultValues: { name: "", startsAt: "", endsAt: "", assetIds: [] }
  });

  const rows = audits.data || [];
  const selected = rows.find((row) => row.id === selectedId) || rows[0];
  const auditItems = selected?.items || [];
  const auditors = users.data || [];
  const assetRows = assets.data?.items || [];
  const missingItems = auditItems.filter((item) => item.status === "MISSING");
  const damagedItems = auditItems.filter((item) => item.status === "DAMAGED");
  const uncheckedItems = auditItems.filter((item) => item.status === "UNCHECKED");

  const refreshAll = () => {
    assets.refresh();
    audits.refresh();
    history.refresh();
  };

  const onCreate = async (values) => {
    await workflowApi.createAudit({
      ...values,
      endsAt: values.endsAt || undefined,
      assetIds: Array.isArray(values.assetIds) ? values.assetIds : [values.assetIds]
    });
    form.reset({ name: "", startsAt: "", endsAt: "", assetIds: [] });
    setReport(null);
    setMessage("Audit cycle created");
    refreshAll();
  };

  const assignAuditor = async (item) => {
    const auditorId = auditorByItem[item.id];
    if (!auditorId) return;
    await workflowApi.assignAuditAuditor(item.id, { auditorId });
    setMessage("Auditor assigned");
    refreshAll();
  };

  const verifyItem = async (item, status) => {
    await workflowApi.verifyAuditItem(item.id, {
      status,
      notes: notesByItem[item.id] || undefined
    });
    setNotesByItem((current) => ({ ...current, [item.id]: "" }));
    setReport(null);
    setMessage(`Asset marked ${status.toLowerCase()}`);
    refreshAll();
  };

  const generateReport = async () => {
    if (!selected) return;
    const result = await workflowApi.auditDiscrepancies(selected.id);
    setReport(result);
    setMessage("Discrepancy report generated");
  };

  const closeAudit = async () => {
    if (!selected || !window.confirm(`Close audit cycle ${selected.name}?`)) return;
    await workflowApi.closeAudit(selected.id);
    setReport(null);
    setMessage("Audit closed");
    refreshAll();
  };

  const auditColumns = [
    { key: "name", header: "Cycle" },
    { key: "startsAt", header: "Starts", render: (row) => formatDate(row.startsAt) },
    { key: "endsAt", header: "Ends", render: (row) => formatDate(row.endsAt) },
    { key: "items", header: "Assets", render: (row) => row.items?.length || 0 },
    { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setSelectedId(row.id)}>
          View
        </Button>
      )
    }
  ];

  const historyColumns = [
    { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag || "-" },
    { key: "action", header: "Action", render: (row) => row.action?.replaceAll("_", " ") },
    { key: "actor", header: "By", render: (row) => row.actor?.name || "System" },
    { key: "notes", header: "Notes", render: (row) => row.notes || "-" },
    { key: "createdAt", header: "Date", render: (row) => formatDateTime(row.createdAt) }
  ];

  return (
    <div>
      <PageHeader
        title="Audit"
        description="Create audit cycles, assign auditors, verify assets, capture discrepancies, and close completed audits."
        actions={
          <Button variant="secondary" onClick={refreshAll}>
            <FiRefreshCw /> Refresh
          </Button>
        }
      />
      <Alert tone="success">{message}</Alert>
      <ErrorList errors={[assets.error, users.error, audits.error, history.error]} />

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={form.handleSubmit(onCreate)}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft"
        >
          <Field label="Audit Cycle" error={form.formState.errors.name?.message}>
            <input className={inputClass} {...form.register("name")} />
          </Field>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <Field label="Starts" error={form.formState.errors.startsAt?.message}>
              <input type="datetime-local" className={inputClass} {...form.register("startsAt")} />
            </Field>
            <Field label="Ends" error={form.formState.errors.endsAt?.message}>
              <input type="datetime-local" className={inputClass} {...form.register("endsAt")} />
            </Field>
          </div>
          <Field label="Assets" error={form.formState.errors.assetIds?.message}>
            <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
              {assetRows.map((asset) => (
                <label
                  key={asset.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-white"
                >
                  <input type="checkbox" value={asset.id} className="mt-1" {...form.register("assetIds")} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-800">{asset.assetTag}</span>
                    <span className="block truncate text-slate-500">{asset.name}</span>
                  </span>
                </label>
              ))}
              {!assetRows.length ? <p className="px-2 py-3 text-sm text-slate-500">No assets available</p> : null}
            </div>
          </Field>
          <Button disabled={form.formState.isSubmitting}>
            <FiClipboard /> Create Audit
          </Button>
        </form>

        <section className="grid gap-4">
          <DataTable columns={auditColumns} rows={rows} empty="No audit cycles found" />

          {selected ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">
                    {formatDate(selected.startsAt)} - {formatDate(selected.endsAt)}
                  </p>
                  <h2 className="text-lg font-bold text-slate-950">{selected.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {auditItems.length} assets, {uncheckedItems.length} unchecked, {missingItems.length} missing,{" "}
                    {damagedItems.length} damaged
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Status value={selected.status} />
                  <Button type="button" variant="secondary" onClick={generateReport}>
                    <FiFileText /> Report
                  </Button>
                  {selected.status !== "CLOSED" ? (
                    <Button type="button" onClick={closeAudit} disabled={uncheckedItems.length > 0}>
                      <FiCheck /> Close Audit
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">Verified</p>
                  <p className="text-2xl font-bold text-green-700">
                    {auditItems.filter((item) => item.status === "VERIFIED").length}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">Missing</p>
                  <p className="text-2xl font-bold text-red-700">{missingItems.length}</p>
                </div>
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">Damaged</p>
                  <p className="text-2xl font-bold text-amber-700">{damagedItems.length}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {auditItems.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 p-3">
                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {item.asset?.assetTag} - {item.asset?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Auditor: {item.auditor?.name || "Unassigned"} · Location: {item.asset?.location || "-"}
                        </p>
                      </div>
                      <Status value={item.status} />
                    </div>
                    {selected.status !== "CLOSED" ? (
                      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <select
                          className={inputClass}
                          value={auditorByItem[item.id] || item.auditorId || ""}
                          onChange={(event) =>
                            setAuditorByItem((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                        >
                          <option value="">Assign auditor</option>
                          {auditors.map((auditor) => (
                            <option key={auditor.id} value={auditor.id}>
                              {auditor.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className={inputClass}
                          placeholder="Notes"
                          value={notesByItem[item.id] || ""}
                          onChange={(event) =>
                            setNotesByItem((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-3 py-2"
                            onClick={() => assignAuditor(item)}
                          >
                            <FiUserCheck />
                          </Button>
                          <Button type="button" className="px-3 py-2" onClick={() => verifyItem(item, "VERIFIED")}>
                            <FiCheck />
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            className="px-3 py-2"
                            onClick={() => verifyItem(item, "MISSING")}
                          >
                            Missing
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-3 py-2"
                            onClick={() => verifyItem(item, "DAMAGED")}
                          >
                            Damaged
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {report ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-800">
                <FiAlertTriangle /> Discrepancy Report
              </div>
              <div className="mb-3 grid gap-2 text-sm md:grid-cols-4">
                <span>Total: {report.summary.total}</span>
                <span>Verified: {report.summary.verified}</span>
                <span>Missing: {report.summary.missing}</span>
                <span>Damaged: {report.summary.damaged}</span>
              </div>
              <div className="grid gap-2">
                {report.items.length ? (
                  report.items.map((item) => (
                    <div key={item.id} className="rounded-md bg-white px-3 py-2 text-sm">
                      <span className="font-semibold">{item.asset?.assetTag}</span> - {item.asset?.name} · {item.status}
                      {item.notes ? <span className="text-slate-500"> · {item.notes}</span> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-amber-800">No discrepancies found.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-4">
        <DataTable columns={historyColumns} rows={history.data || []} empty="No audit history found" />
      </section>
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
      <form
        onSubmit={form.handleSubmit(submit)}
        className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-4"
      >
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
      <Alert tone="warning">{records.error}</Alert>
      <DataTable columns={columns[type]} rows={records.data || []} />
    </div>
  );
}

export default function Workflows({ type = "allocation" }) {
  if (type === "allocation") return <AllocationModule initialTab="allocations" />;
  if (type === "transfers") return <AllocationModule initialTab="transfer" />;
  if (type === "bookings") return <BookingModule />;
  if (type === "maintenance") return <MaintenanceModule />;
  if (type === "audits") return <AuditModule />;
  return <GenericWorkflow type={type} />;
}
