export const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "-";

export const statusTone = (status = "") => {
  if (["ACTIVE", "AVAILABLE", "APPROVED", "RESOLVED", "VERIFIED", "COMPLETED"].includes(status))
    return "bg-green-50 text-green-700";
  if (["PENDING", "UPCOMING", "ONGOING", "MAINTENANCE", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"].includes(status))
    return "bg-amber-50 text-amber-700";
  if (["INACTIVE", "REJECTED", "LOST", "MISSING", "OVERDUE"].includes(status)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-700";
};
