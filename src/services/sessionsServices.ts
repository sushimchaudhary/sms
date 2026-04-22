import axiosInstance, { publicAxios } from "@/lib/config/axios.config";

let sessionCache: any = null;
let sessionRequestHandle: Promise<any> | null = null;

export const SessionServices = {

  clearCache: () => {
    sessionCache = null;
  },
  
  getSessions: async (params?: { page?: number; limit?: number; search?: string }) => {
    if (sessionCache && !params?.search) return sessionCache;
    if (sessionRequestHandle) return sessionRequestHandle;

    sessionRequestHandle = (async () => {
      try {
        // Updated to /school/sessions/ - check if your backend needs the 'school' prefix
        const res = await axiosInstance.get("/school/sessions/", { params });
        const actualData = res.data; 
        if (!params?.search) sessionCache = actualData;
        return actualData;
      } catch (error) {
        throw error;
      } finally {
        sessionRequestHandle = null;
      }
    })();
    return sessionRequestHandle;
  },

  createSession: async (data: any) => {
    // Ensure this path matches your backend exactly (with trailing slash)
    const res = await axiosInstance.post("/school/sessions/", data);
    sessionCache = null; 
    return res.data;
  },

  updateSession: async (id: string, data: any) => {
    const res = await axiosInstance.put(`/school/sessions/${id}/`, data);
    sessionCache = null;
    return res.data;
  },

  deleteSession: async (id: string) => {
    const res = await axiosInstance.delete(`/school/sessions/${id}/`);
    sessionCache = null;
    return res.data;
  },
};