export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-primary">AssetFlow ERP</p>
      <h1 className="mt-1 truncate text-2xl font-bold tracking-normal text-slate-950 md:text-3xl">{title}</h1>
      {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
  </div>
);
