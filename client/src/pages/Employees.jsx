import { useState } from "react";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { useApiResource } from "../hooks/useApiResource";

export default function Employees() {
  const [error, setError] = useState("");
  const users = useApiResource(() => api.get("/users").then((res) => res.data), []);

  const promote = async (id, role) => {
    try {
      setError("");
      await api.patch(`/users/${id}/role`, { role });
      users.refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Review employees and promote roles. Signup always creates Employee accounts; only Admin can promote users."
      />
      {error ? <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-danger">{error}</div> : null}
      <DataTable
        rows={users.data || []}
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role", render: (row) => <Status value={row.role} /> },
          { key: "department", header: "Department", render: (row) => row.department?.name || "-" },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <Button variant="secondary" onClick={() => promote(row.id, "ASSET_MANAGER")}>
                Promote
              </Button>
            )
          }
        ]}
      />
    </div>
  );
}
