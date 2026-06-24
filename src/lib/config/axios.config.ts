

import axios from "axios";
import Cookies from "js-cookie";

  //  const BASE_URL = "https://schoolapi.edifynepal.com/api";
 const BASE_URL = "http://127.0.0.1:8000/api";

// ==============================
// 🔐 Private Axios (with token)
// ==============================
const axiosInstance = axios.create({
baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    
  },
  // withCredentials: true, // CORS stable banauna help garxa
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");

    const url = config.url?.toLowerCase() || "";

    // Login / Refresh jasto route ma token haldaina
    const isAuthRoute =
      url.includes("/login") ||
      url.includes("/refresh") ;
      // url.includes("/register");

    // Token attach garne
    if (token && !isAuthRoute) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // ❗ IMPORTANT FIX: FormData ma content-type manually set nagarne
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (optional but useful)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("refresh");

      if (refresh) {
        const res = await axios.post("/auth/token/refresh/", {
          refresh,
        });

        const newAccess = res.data.access;

        localStorage.setItem("access", newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// ==============================
// 🌐 Public Axios (no auth)
// ==============================
export const publicAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==============================
// Export
// ==============================
export default axiosInstance;