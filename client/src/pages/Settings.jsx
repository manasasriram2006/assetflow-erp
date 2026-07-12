import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Profile & Settings" description="Account profile and workspace preferences." />
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Name</p>
          <p className="mt-1 font-semibold text-slate-950">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Email</p>
          <p className="mt-1 font-semibold text-slate-950">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Role</p>
          <p className="mt-1 font-semibold text-slate-950">{String(user?.role || "").replaceAll("_", " ")}</p>
        </div>
      </section>
    </div>
  );
}
