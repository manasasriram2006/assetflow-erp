import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import Dashboard from "../pages/Dashboard";
import Assets from "../pages/Assets";
import Organization from "../pages/Organization";
import Employees from "../pages/Employees";
import Workflows from "../pages/Workflows";
import Reports from "../pages/Reports";
import Notifications from "../pages/Notifications";
import Settings from "../pages/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="organization"
          element={
            <ProtectedRoute roles={["ADMIN", "ASSET_MANAGER"]}>
              <Organization />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <Organization />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories"
          element={
            <ProtectedRoute roles={["ADMIN", "ASSET_MANAGER"]}>
              <Organization />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute roles={["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"]}>
              <Employees />
            </ProtectedRoute>
          }
        />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
