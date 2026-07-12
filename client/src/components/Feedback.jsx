import { FiAlertTriangle, FiCheckCircle, FiInbox, FiInfo, FiX } from "react-icons/fi";
import { Button } from "./Button";

const tones = {
  success: {
    icon: FiCheckCircle,
    className: "border-green-200 bg-green-50 text-green-800"
  },
  error: {
    icon: FiAlertTriangle,
    className: "border-red-200 bg-red-50 text-red-800"
  },
  warning: {
    icon: FiAlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-800"
  },
  info: {
    icon: FiInfo,
    className: "border-blue-200 bg-blue-50 text-blue-800"
  }
};

export function Alert({ tone = "info", children, className = "" }) {
  const config = tones[tone] || tones.info;
  const Icon = config.icon;

  if (!children) return null;

  return (
    <div className={`animate-enter mb-4 flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium ${config.className} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({ title = "No records found", description, action }) {
  return (
    <div className="grid min-h-44 place-items-center px-4 py-10 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400">
          <FiInbox className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-800">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function Modal({ open, title, description, children, onClose, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-3 py-4 backdrop-blur-sm sm:items-center">
      <section className="animate-enter max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            title="Close"
          >
            <FiX />
          </button>
        </div>
        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-slate-100 px-5 py-4">{footer}</div> : null}
      </section>
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", onConfirm, onClose, tone = "danger" }) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={null}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
