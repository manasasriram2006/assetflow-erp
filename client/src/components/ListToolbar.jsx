import { Button } from "./Button";
import { inputClass } from "./Input";
import { FiPlus, FiSearch } from "react-icons/fi";

export function ListToolbar({ search, onSearch, status, onStatus, extra, onAdd, addLabel = "Add" }) {
  return (
    <div className="surface animate-enter mb-4 flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search"
          />
        </label>
        <select className={`${inputClass} sm:max-w-44`} value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {extra}
      </div>
      {onAdd ? (
        <Button type="button" onClick={onAdd}>
          <FiPlus /> {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
