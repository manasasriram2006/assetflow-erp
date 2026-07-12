import { useState } from "react";
import { FiArchive, FiBell, FiCalendar, FiCheck, FiClipboard, FiRefreshCw, FiRepeat, FiTool } from "react-icons/fi";
import { Button } from "../components/Button";
import { Status } from "../components/DataTable";
import { Alert, EmptyState } from "../components/Feedback";
import { inputClass } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { useApiResource } from "../hooks/useApiResource";
import { notificationApi } from "../services/resources";
import { formatDate } from "../utils/format";

const categories = [
  ["", "All", FiBell],
  ["ALLOCATION", "Allocation", FiArchive],
  ["BOOKING", "Booking", FiCalendar],
  ["MAINTENANCE", "Maintenance", FiTool],
  ["AUDIT", "Audit", FiClipboard],
  ["TRANSFER", "Transfer", FiRepeat]
];

const typeLabels = {
  ASSET_ASSIGNED: "Asset Assigned",
  TRANSFER_APPROVED: "Transfer",
  MAINTENANCE_APPROVED: "Maintenance",
  BOOKING_REMINDER: "Booking",
  OVERDUE_RETURN: "Overdue Return",
  AUDIT_DISCREPANCY: "Audit"
};

const labelize = (value = "") =>
  String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Notifications() {
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [message, setMessage] = useState("");
  const notifications = useApiResource(
    () =>
      notificationApi.list({
        category: category || undefined,
        type: type || undefined,
        unread: unreadOnly ? "true" : undefined
      }),
    [category, type, unreadOnly]
  );

  const markRead = async (id) => {
    await notificationApi.markRead(id);
    setMessage("Notification marked read");
    notifications.refresh();
  };

  const markAllRead = async () => {
    const result = await notificationApi.markAllRead();
    setMessage(`${result.updated} notification${result.updated === 1 ? "" : "s"} marked read`);
    notifications.refresh();
  };

  const refresh = () => {
    setMessage("");
    notifications.refresh();
  };

  const rows = notifications.data?.notifications || [];
  const countsByCategory = notifications.data?.countsByCategory || {};
  const countsByType = notifications.data?.countsByType || {};
  const types = notifications.data?.types || [];

  return (
    <div>
      <PageHeader
        title="Notification Center"
        description={`${notifications.data?.unread || 0} unread notifications across allocation, booking, maintenance, audit, and transfer workflows.`}
        actions={
          <>
            <Button variant="secondary" onClick={refresh}>
              <FiRefreshCw /> Refresh
            </Button>
            <Button onClick={markAllRead} disabled={!notifications.data?.unread}>
              <FiCheck /> Mark All Read
            </Button>
          </>
        }
      />

      <Alert tone="success">{message}</Alert>
      <Alert tone="warning">{notifications.error}</Alert>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {categories.map(([key, label, Icon]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setCategory(key);
              setType("");
            }}
            className={`focus-ring rounded-lg border p-4 text-left shadow-soft transition hover:-translate-y-0.5 ${
              category === key ? "border-blue-200 bg-blue-50 text-primary" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-5 w-5" />
            <p className="mt-3 text-sm font-bold">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {key ? countsByCategory[key] || 0 : Object.values(countsByCategory).reduce((sum, count) => sum + count, 0)}
            </p>
          </button>
        ))}
      </section>

      <div className="surface animate-enter mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <select className={`${inputClass} md:max-w-64`} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">All notification types</option>
          {types
            .filter((item) => !category || item.category === category)
            .map((item) => (
              <option key={item.type} value={item.type}>
                {typeLabels[item.type] || labelize(item.type)} ({countsByType[item.type] || 0})
              </option>
            ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
          Unread only
        </label>
        <div className="md:ml-auto">
          <Status value={`${notifications.data?.unread || 0} UNREAD`} />
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map((item) => (
          <article
            key={item.id}
            className={`flex flex-col gap-3 rounded-lg border p-4 shadow-soft md:flex-row md:items-center md:justify-between ${
              item.readAt ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-bold text-slate-950">{item.title}</div>
                {!item.readAt ? <Status value="UNREAD" /> : null}
              </div>
              <p className="text-sm text-slate-600">{item.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {typeLabels[item.type] || labelize(item.type)} - {formatDate(item.createdAt)}
              </p>
            </div>
            {!item.readAt ? (
              <Button variant="secondary" onClick={() => markRead(item.id)}>
                Mark Read
              </Button>
            ) : (
              <span className="text-sm text-slate-400">Read</span>
            )}
          </article>
        ))}
        {!rows.length ? (
          <div className="surface">
            <EmptyState title="No notifications found." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
