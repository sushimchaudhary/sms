import axiosInstance from "@/lib/config/axios.config";

let leaveCache: any = null;
let leaveRequestHandle: Promise<any> | null = null;

export const LeaveServices = {
  clearCache: () => {
    leaveCache = null;
  },

  // Get All Leaves
  getAllLeaves: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (leaveCache && !params?.search && !params?.page) return leaveCache;

    if (leaveRequestHandle) return leaveRequestHandle;

    leaveRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/leave-management/leaves/", { params });
        const actualData = res.data;

        if (!params?.search) {
          leaveCache = actualData;
        }

        return actualData;
      } finally {
        leaveRequestHandle = null;
      }
    })();

    return leaveRequestHandle;
  },

  // Create Leave
  createLeave: async (data: any) => {
    const res = await axiosInstance.post("/leave-management/leaves/", data);
    leaveCache = null;
    return res.data;
  },

  // Update Leave
  updateLeave: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/leave-management/leaves/${id}/`, data);
    leaveCache = null;
    return res.data;
  },

  // Delete Leave
  deleteLeave: async (id: string | number) => {
    const res = await axiosInstance.delete(`/leave-management/leaves/${id}/`);
    leaveCache = null;
    return res.data;
  },
};