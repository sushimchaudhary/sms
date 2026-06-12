import axiosInstance from "@/lib/config/axios.config";

type QueryParams = { 
  search?: string; 
  page?: number; 
  limit?: number; 
};

export const PublicServices = {
  getPublicStudentAttendance: async (params?: QueryParams) => {
    const res = await axiosInstance.get("/attendance/public/student-attendance/", { params });
    return res.data;
  },

  getPublicStaffAttendance: async (params?: QueryParams) => {
    const res = await axiosInstance.get("/attendance/public/staff-attendance/", { params });
    return res.data;
  },

  getPublicLeaveAllocations: async (params?: QueryParams) => {
    const res = await axiosInstance.get("/leave-management/public/leave-allocations/", { params });
    return res.data;
  },
};