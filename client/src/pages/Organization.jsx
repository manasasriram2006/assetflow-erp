import { useForm } from "react-hook-form";
import { FiPlus } from "react-icons/fi";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { Field, inputClass } from "../components/Input";
import { PageHeader } from "../components/PageHeader";
import { useApiResource } from "../hooks/useApiResource";
import { resourceApi } from "../services/resources";

const departmentApi = resourceApi("/departments");
const categoryApi = resourceApi("/categories");

export default function Organization() {
  const departments = useApiResource(() => departmentApi.list({ limit: 50 }), []);
  const categories = useApiResource(() => categoryApi.list({ limit: 50 }), []);
  const deptForm = useForm();
  const catForm = useForm();

  const addDepartment = async (values) => {
    await departmentApi.create(values);
    deptForm.reset();
    departments.refresh();
  };

  const addCategory = async (values) => {
    await categoryApi.create(values);
    catForm.reset();
    categories.refresh();
  };

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Manage departments and asset categories with unique codes and prefixes."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold">Departments</h2>
          <form
            onSubmit={deptForm.handleSubmit(addDepartment)}
            className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3"
          >
            <Field label="Name">
              <input className={inputClass} {...deptForm.register("name", { required: true })} />
            </Field>
            <Field label="Code">
              <input className={inputClass} {...deptForm.register("code", { required: true })} />
            </Field>
            <div className="flex items-end">
              <Button>
                <FiPlus /> Add
              </Button>
            </div>
          </form>
          <DataTable
            columns={[
              { key: "name", header: "Name" },
              { key: "code", header: "Code" },
              { key: "description", header: "Description" }
            ]}
            rows={departments.data?.items || []}
          />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Categories</h2>
          <form
            onSubmit={catForm.handleSubmit(addCategory)}
            className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3"
          >
            <Field label="Name">
              <input className={inputClass} {...catForm.register("name", { required: true })} />
            </Field>
            <Field label="Prefix">
              <input className={inputClass} {...catForm.register("prefix", { required: true })} />
            </Field>
            <div className="flex items-end">
              <Button>
                <FiPlus /> Add
              </Button>
            </div>
          </form>
          <DataTable
            columns={[
              { key: "name", header: "Name" },
              { key: "prefix", header: "Prefix" },
              { key: "description", header: "Description" }
            ]}
            rows={categories.data?.items || []}
          />
        </section>
      </div>
    </div>
  );
}
