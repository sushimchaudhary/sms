import axiosInstance from "@/lib/config/axios.config";
import Cookies from "js-cookie";

let userCache: any = null;

// Argument type define gareko taaki UserTable ma error na-aaos
interface GetDetailsArgs {
  id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const UserServices = {
  login: async (credentials: any) => {
    const response = await axiosInstance.post("/auth/login/", {
      identifier: credentials.username,
      password: credentials.password,
    });
    return response.data;
  },

  parseError: (exception: any): string => {
    if (exception.response?.data) {
      const data = exception.response.data;
      if (data.detail) return data.detail;
      if (data.message) return data.message;
      if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstError = data[firstKey];
        return Array.isArray(firstError) 
          ? `${firstKey}: ${firstError[0]}` 
          : `${firstKey}: ${firstError}`;
      }
    }
    return exception.message || "Something went wrong";
  },

  // FIXED: Object-based parameter support (UserTable ko error solve garna)
  // FIXED: URL logic (id chha vane single user endpoint, xaina vane list)
  getDetails: async (args?: GetDetailsArgs | string, oldParams?: any) => {
    let url = "/auth/users/";
    let queryParams = {};

    if (typeof args === "string") {
      url = `/auth/users/${args}/`;
      queryParams = oldParams || {};
    } else if (args && typeof args === "object") {
      const { id, ...rest } = args;
      if (id) url = `/auth/users/${id}/`;
      queryParams = rest;
    }

    const res = await axiosInstance.get(url, { params: queryParams });
    return res.data;
  },

  getStaffAndTeachers: async () => {
    try {
      const res = await axiosInstance.get("/auth/users/", {
        params: { 
          role__in: "teacher,staff",
          page_size: 100 
        },
      });
      const data = res.data;
      return Array.isArray(data) ? data : data?.results || data?.data || [];
    } catch (error: any) {
      console.error("User Fetch Error:", error.response?.status);
      throw error;
    }
  },

  clearCache: () => {
    userCache = null;
  },

  // FIXED: 401 Unauthorized solve garna header bypass thapeko
  createDetails: async (data: FormData) => {
    // access_token check garne (login garda save gareko key matching huna parcha)
    const token = Cookies.get("access_token") || Cookies.get("token"); 

    const res = await axiosInstance.post("/auth/register/", data, {
      headers: { 
        "Content-Type": "multipart/form-data",
        // Forcefully token pathaune (Interceptors lai overwrite garna)
        ...(token ? { "Authorization": `Bearer ${token}` } : { "Authorization": "" })
      },
    });

    userCache = null;
    return res.data;
  },

  updateDetails: async (id: string, data: FormData) => {
    const res = await axiosInstance.put(`/auth/users/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    userCache = null;
    return res.data;
  },

  deleteDetails: async (id: string) => {
    const res = await axiosInstance.delete(`/auth/users/${id}/`);
    userCache = null;
    return res.data;
  },
};