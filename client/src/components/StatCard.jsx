export const StatCard = ({ icon: Icon, label, value, tone = "text-primary" }) => (
  <div className="surface animate-enter p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 truncate text-3xl font-bold text-slate-950">{value ?? 0}</p>
      </div>
      {Icon ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-50">
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
      ) : null}
    </div>
  </div>
);
