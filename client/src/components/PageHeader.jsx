export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div>
      <p className="text-sm font-medium text-primary">AssetFlow ERP</p>
      <h1 className="text-2xl font-bold tracking-normal text-slate-950">{title}</h1>
      {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);
