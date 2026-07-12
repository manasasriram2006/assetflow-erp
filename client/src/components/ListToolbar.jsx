import { Button } from "./Button";
import { inputClass } from "./Input";

export function ListToolbar({ search, onSearch, status, onStatus, extra, onAdd, addLabel = "Add" }) {
  return (
    <div className="mb-3 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <input
          className={inputClass}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search"
        />
        <select className={`${inputClass} sm:max-w-44`} value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {extra}
      </div>
      {onAdd ? (
        <Button type="button" onClick={onAdd}>
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
