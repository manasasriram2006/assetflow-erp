import { useForm } from "react-hook-form";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { Field, inputClass } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { useApiResource } from "../hooks/useApiResource";
import { resourceApi, workflowApi } from "../services/resources";
import { formatDate } from "../utils/format";

const titles = {
  allocation: ["Allocation", "Allocate assets, return assets, and detect active/overdue assignments."],
  transfers: ["Transfer Request", "Request and approve asset handovers between employees or departments."],
  bookings: ["Booking", "Book shared resources and prevent overlapping reservations."],
  maintenance: ["Maintenance", "Track maintenance workflow from request to resolution."],
  audits: ["Audit", "Create audit cycles, verify assets, and report discrepancies."]
};

const assetApi = resourceApi("/assets");
const userApi = { list: () => import("../services/api").then(({ api }) => api.get("/users").then((res) => res.data)) };

export default function Workflows({ type = "allocation" }) {
  const [title, description] = titles[type] || titles.allocation;
  const assets = useApiResource(() => assetApi.list({ limit: 100 }), []);
  const users = useApiResource(userApi.list, []);
  const form = useForm();

  const loaders = {
    allocation: workflowApi.allocations,
    transfers: workflowApi.transfers,
    bookings: workflowApi.bookings,
    maintenance: workflowApi.maintenance,
    audits: workflowApi.audits
  };
  const records = useApiResource(loaders[type], [type]);

  const submit = async (values) => {
    const action = {
      allocation: () => workflowApi.allocate({ ...values, dueAt: values.dueAt || undefined }),
      transfers: () => workflowApi.requestTransfer(values),
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
  const userSelect = (
    <select
      className={inputClass}
      {...form.register(type === "transfers" ? "receiverId" : "userId", { required: type === "allocation" })}
    >
      <option value="">Select user</option>
      {(users.data || []).map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );

  const columns = {
    allocation: [
      { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag },
      { key: "user", header: "Holder", render: (row) => row.user?.name },
      { key: "dueAt", header: "Due", render: (row) => formatDate(row.dueAt) },
      { key: "status", header: "Status", render: (row) => <Status value={row.status} /> }
    ],
    transfers: [
      { key: "asset", header: "Asset", render: (row) => row.asset?.assetTag },
      { key: "requester", header: "Requester", render: (row) => row.requester?.name },
      { key: "receiver", header: "Receiver", render: (row) => row.receiver?.name || "-" },
      { key: "status", header: "Status", render: (row) => <Status value={row.status} /> }
    ],
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
        {type === "allocation" ? <Field label="Employee">{userSelect}</Field> : null}
        {type === "transfers" ? (
          <>
            <Field label="Receiver">{userSelect}</Field>
            <Field label="Reason">
              <input className={inputClass} {...form.register("reason", { required: true })} />
            </Field>
          </>
        ) : null}
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
        {type === "allocation" ? (
          <Field label="Due Date">
            <input type="datetime-local" className={inputClass} {...form.register("dueAt")} />
          </Field>
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
      {records.error ? (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">{records.error}</div>
      ) : null}
      <DataTable columns={columns[type]} rows={records.data || []} />
    </div>
  );
}
