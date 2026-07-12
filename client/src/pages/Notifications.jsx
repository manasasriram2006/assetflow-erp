import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { useApiResource } from "../hooks/useApiResource";
import { notificationApi } from "../services/resources";
import { formatDate } from "../utils/format";

export default function Notifications() {
  const notifications = useApiResource(notificationApi.list, []);

  const markRead = async (id) => {
    await notificationApi.markRead(id);
    notifications.refresh();
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${notifications.data?.unread || 0} unread notifications across assignments, approvals, reminders, overdue returns, and audits.`}
      />
      <div className="grid gap-3">
        {(notifications.data?.notifications || []).map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-sm font-bold text-slate-950">{item.title}</div>
              <p className="text-sm text-slate-600">{item.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {item.type.replaceAll("_", " ")} - {formatDate(item.createdAt)}
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
      </div>
    </div>
  );
}
