import { Button } from "./Button";

export function Pagination({ meta, onPage }) {
  if (!meta) return null;
  const page = meta.page || 1;
  const pages = meta.pages || 1;

  return (
    <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {page} of {pages} - {meta.total || 0} records
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button type="button" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
