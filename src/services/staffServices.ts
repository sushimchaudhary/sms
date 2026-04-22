import axiosInstance from "@/lib/config/axios.config";

let staffCache: any = null;
let staffRequestHandle: Promise<any> | null = null;

export const StaffServices = {
  clearCache: () => {
    staffCache = null;
  },

  getAllstaffs: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (staffCache && !params?.search) return staffCache;
    
    if (staffRequestHandle) return staffRequestHandle;

    staffRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/profile/staffs/", { params });
        const actualData = res.data;

        if (!params?.search) {
          staffCache = actualData;
        }
        return actualData;
      } catch (error) {
        throw error;
      } finally {
        staffRequestHandle = null;
      }
    })();

    return staffRequestHandle;
  },

  createstaff: async (data: any) => {
    const res = await axiosInstance.post("/profile/staffs/", data);
    staffCache = null;
    return res.data;
  },

  updatestaff: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/profile/staffs/${id}/`, data);
    staffCache = null;
    return res.data;
  },

  deletestaff: async (id: string | number) => {
    const res = await axiosInstance.delete(`/profile/staffs/${id}/`);
    staffCache = null;
    return res.data;
  },
};