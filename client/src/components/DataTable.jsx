import { statusTone } from "../utils/format";

export const Status = ({ value }) => (
  <span className={`status-pill ${statusTone(value)}`}>{String(value || "-").replaceAll("_", " ")}</span>
);

export const DataTable = ({ columns, rows, empty = "No records found" }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="overflow-x-auto">
      <table className="erp-table min-w-full">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.length ? (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-slate-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
