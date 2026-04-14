import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post("/api/v1/auth/refresh", {}, { withCredentials: true });
        const { accessToken } = res.data.data;
        useAuthStore.getState().setAccessToken(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clear();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
