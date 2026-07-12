import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("assetflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);
