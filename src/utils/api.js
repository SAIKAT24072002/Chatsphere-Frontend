import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login" + window.location.search;
      }
    } else if (status === 403) {
      window.location.href = "/unauthorized" + window.location.search;
    } else if (status >= 500) {
      window.location.href = "/server-error" + window.location.search;
    }
    return Promise.reject(err);
  }
);

export default api;
