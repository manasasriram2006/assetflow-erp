import { useMemo, useState } from "react";
import { z } from "zod";
import { FiEdit2, FiPower, FiUserCheck } from "react-icons/fi";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { EntityForm } from "../components/EntityForm";
import { ListToolbar } from "../components/ListToolbar";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { inputClass } from "../components/Input";
import { useApiResource } from "../hooks/useApiResource";
import { organizationApi } from "../services/resources";

const roles = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];
const optionalUuid = z.preprocess((value) => (value === "" ? null : value), z.string().uuid().nullable().optional());

const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: passwordRule,
  role: z.enum(roles),
  departmentId: optionalUuid,
  status: z.enum(["ACTIVE", "INACTIVE"])
});

const updateSchema = createSchema.extend({ password: z.union([passwordRule, z.literal("")]).optional() });

const blankEmployee = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  departmentId: "",
  status: "ACTIVE"
};

const labelize = (value = "") => String(value).replaceAll("_", " ");

export default function Employees() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const employees = useApiResource(
    () => organizationApi.employees.list({ page, limit: 10, search, status, role, departmentId }),
    [page, search, status, role, departmentId]
  );
  const departments = useApiResource(() => organizationApi.departments.list({ limit: 100, status: "ACTIVE" }), []);

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "No department" },
      ...(departments.data?.items || []).map((department) => ({
        value: department.id,
        label: `${department.name} (${department.code})`
      }))
    ],
    [departments.data?.items]
  );

  const roleOptions = roles.map((item) => ({ value: item, label: labelize(item) }));
  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" }
  ];

  const fields = [
    { name: "name", label: "Name" },
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: editing ? "New Password" : "Password", type: "password" },
    { name: "departmentId", label: "Department", type: "select", options: departmentOptions },
    { name: "role", label: "Role", type: "select", options: roleOptions },
    { name: "status", label: "Status", type: "select", options: statusOptions }
  ];

  const refresh = () => {
    employees.refresh();
    departments.refresh();
  };

  const saveEmployee = async (values) => {
    try {
      setError("");
      const payload = {
        ...values,
        departmentId: values.departmentId || null,
        email: values.email.toLowerCase()
      };
      if (!payload.password) delete payload.password;

      if (editing) await organizationApi.employees.update(editing.id, payload);
      else await organizationApi.employees.create(payload);

      setEditing(null);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateEmployee = async (row, patch) => {
    try {
      setError("");
      await organizationApi.employees.update(row.id, patch);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleEmployee = async (row) => {
    try {
      setError("");
      if (row.status === "ACTIVE") await organizationApi.employees.deactivate(row.id);
      else await organizationApi.employees.activate(row.id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Create employees, assign departments, update roles, and activate or deactivate access."
      />
      {error ? <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-danger">{error}</div> : null}

      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        status={status}
        onStatus={(value) => {
          setStatus(value);
          setPage(1);
        }}
        extra={
          <>
            <select
              className={`${inputClass} sm:max-w-56`}
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={`${inputClass} sm:max-w-64`}
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All departments</option>
              {departmentOptions.slice(1).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        }
        onAdd={() => {
          setEditing(null);
          setShowForm(true);
        }}
        addLabel="Add Employee"
      />

      {showForm ? (
        <div className="mb-4">
          <EntityForm
            schema={editing ? updateSchema : createSchema}
            fields={fields}
            defaultValues={
              editing
                ? {
                    name: editing.name || "",
                    email: editing.email || "",
                    password: "",
                    departmentId: editing.departmentId || "",
                    role: editing.role || "EMPLOYEE",
                    status: editing.status || "ACTIVE"
                  }
                : blankEmployee
            }
            submitLabel={editing ? "Update Employee" : "Create Employee"}
            onSubmit={saveEmployee}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
          />
        </div>
      ) : null}

      <DataTable
        rows={employees.data?.items || []}
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          {
            key: "role",
            header: "Role",
            render: (row) => (
              <select className={`${inputClass} min-w-44`} value={row.role} onChange={(event) => updateEmployee(row, { role: event.target.value })}>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )
          },
          {
            key: "department",
            header: "Department",
            render: (row) => (
              <select
                className={`${inputClass} min-w-56`}
                value={row.departmentId || ""}
                onChange={(event) => updateEmployee(row, { departmentId: event.target.value || null })}
              >
                {departmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )
          },
          { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(row);
                    setShowForm(true);
                  }}
                >
                  <FiEdit2 /> Edit
                </Button>
                <Button type="button" variant="secondary" onClick={() => toggleEmployee(row)}>
                  {row.status === "ACTIVE" ? <FiPower /> : <FiUserCheck />}
                  {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            )
          }
        ]}
      />
      <Pagination meta={employees.data?.meta} onPage={setPage} />
    </div>
  );
}
