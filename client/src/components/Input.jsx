export const Field = ({ label, error, children }) => (
  <label className="grid gap-1.5 text-sm font-medium text-slate-700">
    <span>{label}</span>
    {children}
    {error ? <span className="text-xs text-danger">{error}</span> : null}
  </label>
);

export const inputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100";
