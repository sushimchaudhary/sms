import axiosInstance from "@/lib/config/axios.config";

let classCache: any = null;
let classRequestHandle: Promise<any> | null = null;

export const ClassServices = {
  // Cache clear garna (e.g., logout garda ya manually refresh garda)
  clearCache: () => {
    classCache = null;
  },

  // Get All Classes with optional params
  getAllClasses: async (params?: { search?: string; page?: number; limit?: number }) => {
    // Cache check: Search chaina vane ra cache data cha vane cache return garne
    if (classCache && !params?.search && !params?.page) return classCache;

    // Ongoing request handle: Yedi dual request gayo vane wait garne
    if (classRequestHandle) return classRequestHandle;

    classRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/academics/classes/", { params });
        const actualData = res.data;

        // Search nabhako data lai matra cache garne
        if (!params?.search) {
          classCache = actualData;
        }

        return actualData;
      } catch (error) {
        throw error;
      } finally {
        classRequestHandle = null;
      }
    })();

    return classRequestHandle;
  },

  // Create New Class
  createClass: async (data: any) => {
    const res = await axiosInstance.post("/academics/classes/", data);
    // Naya data create bhayesi purano cache clear garne
    classCache = null;
    return res.data;
  },

  // Update Existing Class
  updateClass: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/academics/classes/${id}/`, data);
    // Data change bhayesi cache clear garne
    classCache = null;
    return res.data;
  },

  // Delete Class
  deleteClass: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/classes/${id}/`);
    // Delete bhayesi cache clear garne
    classCache = null;
    return res.data;
  },
};