import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiArchive,
  FiBell,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSettings,
  FiTool,
  FiUsers,
  FiX
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/", label: "Dashboard", icon: FiGrid },
  { to: "/organization", label: "Organization", icon: FiBriefcase },
  { to: "/employees", label: "Employees", icon: FiUsers },
  { to: "/assets", label: "Assets", icon: FiBox },
  { to: "/allocation", label: "Allocation", icon: FiArchive },
  { to: "/booking", label: "Booking", icon: FiCalendar },
  { to: "/maintenance", label: "Maintenance", icon: FiTool },
  { to: "/audit", label: "Audit", icon: FiArchive },
  { to: "/reports", label: "Reports", icon: FiGrid },
  { to: "/notifications", label: "Notifications", icon: FiBell },
  { to: "/settings", label: "Settings", icon: FiSettings }
];

function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary font-black">AF</div>
        <div className="ml-3 min-w-0">
          <div className="truncate text-lg font-bold">AssetFlow</div>
          <div className="truncate text-xs font-medium text-slate-400">Enterprise Asset ERP</div>
        </div>
      </div>
      <nav className="grid gap-1 overflow-y-auto p-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `focus-ring group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-primary text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4 text-xs text-slate-400">
        <div className="rounded-md bg-white/5 p-3">
          <p className="font-semibold text-slate-200">Operational Console</p>
          <p className="mt-1">Assets, workflows, reports, and approvals in one workspace.</p>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = nav.find((item) => item.to !== "/" && location.pathname.startsWith(item.to)) || nav[0];

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell min-h-screen text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <Sidebar />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="animate-enter relative h-full w-[min(20rem,86vw)] shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
                title="Open navigation"
              >
                {mobileOpen ? <FiX /> : <FiMenu />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{current.label}</p>
                <p className="truncate text-xs font-medium text-slate-500">Modern ERP workspace</p>
              </div>
            </div>

            <div className="hidden min-w-0 flex-1 justify-center px-6 md:flex">
              <div className="relative w-full max-w-md">
                <FiSearch className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Search assets, employees, workflows"
                  readOnly
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-44 truncate text-sm font-semibold text-slate-950">{user?.name || "AssetFlow User"}</p>
                <p className="truncate text-xs text-slate-500">{String(user?.role || "EMPLOYEE").replaceAll("_", " ")}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-primary">
                {String(user?.name || "A").slice(0, 1).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-danger"
                title="Logout"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
