import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../layouts/AppLayout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Assets from "../pages/Assets";
import Organization from "../pages/Organization";
import Employees from "../pages/Employees";
import Workflows from "../pages/Workflows";
import Reports from "../pages/Reports";
import Notifications from "../pages/Notifications";
import Settings from "../pages/Settings";

const Protected = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="organization" element={<Organization />} />
        <Route path="departments" element={<Organization />} />
        <Route path="categories" element={<Organization />} />
        <Route path="employees" element={<Employees />} />
        <Route path="assets" element={<Assets />} />
        <Route path="asset-registration" element={<Assets initialTab="register" />} />
        <Route path="asset-directory" element={<Assets />} />
        <Route path="allocation" element={<Workflows type="allocation" />} />
        <Route path="transfer-request" element={<Workflows type="transfers" />} />
        <Route path="booking" element={<Workflows type="bookings" />} />
        <Route path="maintenance" element={<Workflows type="maintenance" />} />
        <Route path="audit" element={<Workflows type="audits" />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Settings />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
