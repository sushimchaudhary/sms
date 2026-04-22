// import axios from "axios";
// import Cookies from "js-cookie";

// const BASE_URL = "https://demo.sempatech.com/api";

// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   // withCredentials: true, // Django JWT ma yesko dherai awashyakta pardaina unless using HttpOnly Cookies
// });

// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = Cookies.get("auth_token");


//     const url = config.url?.toLowerCase() || "";
//     const isLoginRoute = url.includes("/login");

//     if (token && !isLoginRoute) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }

//     // 3. FormData handle garna (Image upload ko lagi)
//     if (config.data instanceof FormData) {
//       config.headers["Content-Type"] = "multipart/form-data";
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export const publicAxios = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });


// export default axiosInstance;


import axios from "axios";
import Cookies from "js-cookie";

  const BASE_URL = "http://schoolapi.edifynepal.com/api";
// const BASE_URL = "http://127.0.0.1:8000/api";

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
      url.includes("/refresh") ||
      url.includes("/register");

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
  (error) => {
    // Token expire handle (optional)
    if (error.response?.status === 401) {
      console.log("Unauthorized - Token may be expired");
      // redirect to login or refresh token logic
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