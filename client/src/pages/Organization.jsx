import { useMemo, useState } from "react";
import { z } from "zod";
import { FiEdit2, FiPower, FiUserCheck } from "react-icons/fi";
import { Button } from "../components/Button";
import { DataTable, Status } from "../components/DataTable";
import { EntityForm } from "../components/EntityForm";
import { Alert, Modal } from "../components/Feedback";
import { ListToolbar } from "../components/ListToolbar";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { inputClass } from "../components/Input";
import { useApiResource } from "../hooks/useApiResource";
import { organizationApi } from "../services/resources";

const optionalUuid = z.preprocess((value) => (value === "" ? null : value), z.string().uuid().nullable().optional());

const departmentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required").max(12, "Use 12 characters or fewer"),
  description: z.string().optional(),
  parentDepartmentId: optionalUuid,
  status: z.enum(["ACTIVE", "INACTIVE"])
});

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  prefix: z.string().min(2, "Prefix is required").max(8, "Use 8 characters or fewer"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

const blankDepartment = { name: "", code: "", description: "", parentDepartmentId: "", status: "ACTIVE" };
const blankCategory = { name: "", prefix: "", description: "", status: "ACTIVE" };

export default function Organization() {
  const [deptPage, setDeptPage] = useState(1);
  const [deptSearch, setDeptSearch] = useState("");
  const [deptStatus, setDeptStatus] = useState("");
  const [deptEditing, setDeptEditing] = useState(null);
  const [showDeptForm, setShowDeptForm] = useState(false);

  const [catPage, setCatPage] = useState(1);
  const [catSearch, setCatSearch] = useState("");
  const [catStatus, setCatStatus] = useState("");
  const [catEditing, setCatEditing] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const departments = useApiResource(
    () => organizationApi.departments.list({ page: deptPage, limit: 8, search: deptSearch, status: deptStatus }),
    [deptPage, deptSearch, deptStatus]
  );
  const categories = useApiResource(
    () => organizationApi.categories.list({ page: catPage, limit: 8, search: catSearch, status: catStatus }),
    [catPage, catSearch, catStatus]
  );
  const activeDepartments = useApiResource(() => organizationApi.departments.list({ limit: 100, status: "ACTIVE" }), []);
  const activeEmployees = useApiResource(() => organizationApi.employees.list({ limit: 100, status: "ACTIVE" }), []);

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "No parent" },
      ...(activeDepartments.data?.items || [])
        .filter((department) => department.id !== deptEditing?.id)
        .map((department) => ({ value: department.id, label: `${department.name} (${department.code})` }))
    ],
    [activeDepartments.data?.items, deptEditing?.id]
  );

  const employeeOptions = useMemo(
    () => [
      { value: "", label: "Select head" },
      ...(activeEmployees.data?.items || []).map((employee) => ({
        value: employee.id,
        label: `${employee.name} - ${employee.email}`
      }))
    ],
    [activeEmployees.data?.items]
  );

  const departmentFields = [
    { name: "name", label: "Name" },
    { name: "code", label: "Code" },
    { name: "parentDepartmentId", label: "Parent Department", type: "select", options: departmentOptions },
    { name: "status", label: "Status", type: "select", options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }] },
    { name: "description", label: "Description", type: "textarea" }
  ];

  const categoryFields = [
    { name: "name", label: "Name" },
    { name: "prefix", label: "Prefix" },
    { name: "status", label: "Status", type: "select", options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }] },
    { name: "description", label: "Description", type: "textarea" }
  ];

  const saveDepartment = async (values) => {
    try {
      setError("");
      setMessage("");
      const payload = { ...values, code: values.code.toUpperCase(), parentDepartmentId: values.parentDepartmentId || null };
      if (deptEditing) await organizationApi.departments.update(deptEditing.id, payload);
      else await organizationApi.departments.create(payload);
      setMessage(deptEditing ? "Department updated successfully." : "Department created successfully.");
      setShowDeptForm(false);
      setDeptEditing(null);
      departments.refresh();
      activeDepartments.refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveCategory = async (values) => {
    try {
      setError("");
      setMessage("");
      const payload = { ...values, prefix: values.prefix.toUpperCase() };
      if (catEditing) await organizationApi.categories.update(catEditing.id, payload);
      else await organizationApi.categories.create(payload);
      setMessage(catEditing ? "Category updated successfully." : "Category created successfully.");
      setShowCatForm(false);
      setCatEditing(null);
      categories.refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleDepartment = async (row) => {
    setMessage("");
    if (row.status === "ACTIVE") await organizationApi.departments.deactivate(row.id);
    else await organizationApi.departments.activate(row.id);
    setMessage(row.status === "ACTIVE" ? "Department deactivated." : "Department activated.");
    departments.refresh();
    activeDepartments.refresh();
  };

  const toggleCategory = async (row) => {
    setMessage("");
    if (row.status === "ACTIVE") await organizationApi.categories.deactivate(row.id);
    else await organizationApi.categories.activate(row.id);
    setMessage(row.status === "ACTIVE" ? "Category deactivated." : "Category activated.");
    categories.refresh();
  };

  const assignHead = async (departmentId, userId) => {
    if (!userId) return;
    setMessage("");
    await organizationApi.departments.assignHead(departmentId, userId);
    setMessage("Department head assigned.");
    departments.refresh();
    activeEmployees.refresh();
  };

  return (
    <div>
      <PageHeader
        title="Organization Setup"
        description="Create departments, define hierarchy, assign department heads, manage category prefixes, and control active status."
      />
      <Alert tone="success">{message}</Alert>
      <Alert tone="error">{error}</Alert>

      <div className="grid gap-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Departments</h2>
          </div>
          <ListToolbar
            search={deptSearch}
            onSearch={(value) => {
              setDeptSearch(value);
              setDeptPage(1);
            }}
            status={deptStatus}
            onStatus={(value) => {
              setDeptStatus(value);
              setDeptPage(1);
            }}
            onAdd={() => {
              setDeptEditing(null);
              setShowDeptForm(true);
            }}
            addLabel="Add Department"
          />
          <Modal
            open={showDeptForm}
            title={deptEditing ? "Edit Department" : "Add Department"}
            description="Define department structure, hierarchy, and active status."
            onClose={() => {
              setDeptEditing(null);
              setShowDeptForm(false);
            }}
          >
            <EntityForm
              schema={departmentSchema}
              fields={departmentFields}
              defaultValues={
                deptEditing
                  ? {
                      name: deptEditing.name || "",
                      code: deptEditing.code || "",
                      description: deptEditing.description || "",
                      parentDepartmentId: deptEditing.parentDepartmentId || "",
                      status: deptEditing.status || "ACTIVE"
                    }
                  : blankDepartment
              }
              submitLabel={deptEditing ? "Update Department" : "Create Department"}
              onSubmit={saveDepartment}
              onCancel={() => {
                setDeptEditing(null);
                setShowDeptForm(false);
              }}
              framed={false}
            />
          </Modal>
          <DataTable
            rows={departments.data?.items || []}
            loading={departments.loading}
            columns={[
              { key: "name", header: "Name" },
              { key: "code", header: "Code" },
              { key: "parent", header: "Parent", render: (row) => row.parentDepartment?.name || "-" },
              { key: "head", header: "Head", render: (row) => row.head?.name || "-" },
              { key: "employees", header: "Employees", render: (row) => row.employeesCount },
              { key: "assets", header: "Assets", render: (row) => row.assetsCount },
              { key: "status", header: "Status", render: (row) => <Status value={row.status} /> },
              {
                key: "assignHead",
                header: "Assign Head",
                render: (row) => (
                  <select className={`${inputClass} min-w-48`} onChange={(event) => assignHead(row.id, event.target.value)} defaultValue="">
                    {employeeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setDeptEditing(row);
                        setShowDeptForm(true);
                      }}
                    >
                      <FiEdit2 /> Edit
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => toggleDepartment(row)}>
                      {row.status === "ACTIVE" ? <FiPower /> : <FiUserCheck />}
                      {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                )
              }
            ]}
          />
          <Pagination meta={departments.data?.meta} onPage={setDeptPage} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Categories</h2>
          </div>
          <ListToolbar
            search={catSearch}
            onSearch={(value) => {
              setCatSearch(value);
              setCatPage(1);
            }}
            status={catStatus}
            onStatus={(value) => {
              setCatStatus(value);
              setCatPage(1);
            }}
            onAdd={() => {
              setCatEditing(null);
              setShowCatForm(true);
            }}
            addLabel="Add Category"
          />
          <Modal
            open={showCatForm}
            title={catEditing ? "Edit Category" : "Add Category"}
            description="Manage category names, prefixes, and availability."
            onClose={() => {
              setCatEditing(null);
              setShowCatForm(false);
            }}
          >
            <EntityForm
              schema={categorySchema}
              fields={categoryFields}
              defaultValues={
                catEditing
                  ? {
                      name: catEditing.name || "",
                      prefix: catEditing.prefix || "",
                      description: catEditing.description || "",
                      status: catEditing.status || "ACTIVE"
                    }
                  : blankCategory
              }
              submitLabel={catEditing ? "Update Category" : "Create Category"}
              onSubmit={saveCategory}
              onCancel={() => {
                setCatEditing(null);
                setShowCatForm(false);
              }}
              framed={false}
            />
          </Modal>
          <DataTable
            rows={categories.data?.items || []}
            loading={categories.loading}
            columns={[
              { key: "name", header: "Name" },
              { key: "prefix", header: "Prefix" },
              { key: "description", header: "Description", render: (row) => row.description || "-" },
              { key: "assets", header: "Assets", render: (row) => row.assetsCount },
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
                        setCatEditing(row);
                        setShowCatForm(true);
                      }}
                    >
                      <FiEdit2 /> Edit
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => toggleCategory(row)}>
                      {row.status === "ACTIVE" ? <FiPower /> : <FiUserCheck />}
                      {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                )
              }
            ]}
          />
          <Pagination meta={categories.data?.meta} onPage={setCatPage} />
        </section>
      </div>
    </div>
  );
}
