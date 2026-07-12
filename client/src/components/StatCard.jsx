export const StatCard = ({ icon: Icon, label, value, tone = "text-primary" }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-950">{value ?? 0}</p>
      </div>
      {Icon ? <Icon className={`h-6 w-6 ${tone}`} /> : null}
    </div>
  </div>
);
