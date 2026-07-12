import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

const Login = lazy(() => import("../pages/Login"));
const Signup = lazy(() => import("../pages/Signup"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Assets = lazy(() => import("../pages/Assets"));
const Organization = lazy(() => import("../pages/Organization"));
const Employees = lazy(() => import("../pages/Employees"));
const Workflows = lazy(() => import("../pages/Workflows"));
const Reports = lazy(() => import("../pages/Reports"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Settings = lazy(() => import("../pages/Settings"));

const PageLoader = () => (
  <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-slate-500">Loading...</div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}
