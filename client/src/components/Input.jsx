export const Field = ({ label, error, children }) => (
  <label className="grid gap-1.5 text-sm font-medium text-slate-700">
    <span className="text-slate-700">{label}</span>
    {children}
    {error ? <span className="text-xs font-semibold text-danger">{error}</span> : null}
  </label>
);

export const inputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-blue-100";
