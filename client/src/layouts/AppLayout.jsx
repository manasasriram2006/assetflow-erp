import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiArchive,
  FiBell,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiSettings,
  FiTool,
  FiUsers
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

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div>
            <div className="text-lg font-bold text-slate-950">AssetFlow</div>
            <div className="text-xs font-medium text-slate-500">Enterprise Asset ERP</div>
          </div>
        </div>
        <nav className="grid gap-1 p-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{user?.name || "AssetFlow User"}</p>
            <p className="truncate text-xs text-slate-500">{String(user?.role || "EMPLOYEE").replaceAll("_", " ")}</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Logout"
          >
            <FiLogOut />
          </button>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
