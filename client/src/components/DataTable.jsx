import { statusTone } from "../utils/format";
import { EmptyState } from "./Feedback";

const TableSkeleton = ({ columns }) => (
  <>
    {Array.from({ length: 5 }, (_, rowIndex) => (
      <tr key={rowIndex}>
        {columns.map((column, columnIndex) => (
          <td key={`${column.key}-${columnIndex}`}>
            <div className="skeleton h-4 w-full max-w-32" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const Status = ({ value }) => (
  <span className={`status-pill ${statusTone(value)}`}>{String(value || "-").replaceAll("_", " ")}</span>
);

export const DataTable = ({ columns, rows, empty = "No records found", loading = false }) => (
  <div className="surface animate-enter overflow-hidden">
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
          {loading ? (
            <TableSkeleton columns={columns} />
          ) : rows?.length ? (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <EmptyState title={empty} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
