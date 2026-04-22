import axiosInstance from "@/lib/config/axios.config";

let parentCache: any = null;
let parentRequestHandle: Promise<any> | null = null;

export const ParentServices = {
  clearCache: () => {
    parentCache = null;
  },

  getAllParents: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (parentCache && !params?.search) return parentCache;
    
    if (parentRequestHandle) return parentRequestHandle;

    parentRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/profile/parents/", { params });
        const actualData = res.data;

        if (!params?.search) {
          parentCache = actualData;
        }
        return actualData;
      } catch (error) {
        throw error;
      } finally {
        parentRequestHandle = null;
      }
    })();

    return parentRequestHandle;
  },

  createParent: async (data: any) => {
    const res = await axiosInstance.post("/profile/parents/", data);
    parentCache = null;
    return res.data;
  },

  updateParent: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/profile/parents/${id}/`, data);
    parentCache = null;
    return res.data;
  },

  deleteParent: async (id: string | number) => {
    const res = await axiosInstance.delete(`/profile/parents/${id}/`);
    parentCache = null;
    return res.data;
  },
};