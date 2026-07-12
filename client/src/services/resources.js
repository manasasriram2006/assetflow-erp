import { api } from "./api";

export const authApi = {
  login: (payload) => api.post("/auth/login", payload).then((res) => res.data),
  signup: (payload) => api.post("/auth/signup", payload).then((res) => res.data),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }).then((res) => res.data),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then((res) => res.data),
  logout: () => api.post("/auth/logout").then((res) => res.data),
  me: () => api.get("/auth/me").then((res) => res.data),
  updateProfile: (payload) => api.patch("/auth/profile", payload).then((res) => res.data)
};

export const resourceApi = (path) => ({
  list: (params) => api.get(path, { params }).then((res) => res.data),
  create: (payload) => api.post(path, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${path}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${path}/${id}`).then((res) => res.data)
});

export const reportsApi = {
  dashboard: () => api.get("/reports/dashboard").then((res) => res.data),
  exportAssets: () => api.get("/reports/assets.csv", { responseType: "blob" }).then((res) => res.data)
};

export const workflowApi = {
  allocations: () => api.get("/allocations").then((res) => res.data),
  allocate: (payload) => api.post("/allocations", payload).then((res) => res.data),
  returnAsset: (id) => api.post(`/allocations/${id}/return`).then((res) => res.data),
  transfers: () => api.get("/transfers").then((res) => res.data),
  requestTransfer: (payload) => api.post("/transfers", payload).then((res) => res.data),
  bookings: () => api.get("/bookings").then((res) => res.data),
  book: (payload) => api.post("/bookings", payload).then((res) => res.data),
  maintenance: () => api.get("/maintenance").then((res) => res.data),
  requestMaintenance: (payload) => api.post("/maintenance", payload).then((res) => res.data),
  audits: () => api.get("/audits").then((res) => res.data),
  createAudit: (payload) => api.post("/audits", payload).then((res) => res.data)
};

export const notificationApi = {
  list: () => api.get("/notifications").then((res) => res.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((res) => res.data)
};
