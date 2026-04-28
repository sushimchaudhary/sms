import axiosInstance from "@/lib/config/axios.config";

let teacherCache: any = null;
let teacherRequestHandle: Promise<any> | null = null;

let teacherDashboardCache: any = null;
let teacherDashboardRequestHandle: Promise<any> | null = null;

export const TeacherServices = {
  clearCache: () => {
    teacherCache = null;
  },

  getAllTeachers: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (teacherCache && !params?.search) return teacherCache;
    
    if (teacherRequestHandle) return teacherRequestHandle;

    teacherRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/profile/teachers/", { params });
        const actualData = res.data;

        if (!params?.search) {
          teacherCache = actualData;
        }
        return actualData;
      } catch (error) {
        throw error;
      } finally {
        teacherRequestHandle = null;
      }
    })();

    return teacherRequestHandle;
  },


   getTeacherDashboard: async () => {
    if (teacherDashboardCache) return teacherDashboardCache;

    if (teacherDashboardRequestHandle) return teacherDashboardRequestHandle;

    teacherDashboardRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/profile/teachers/my_dashboard/");
        teacherDashboardCache = res.data;
        return res.data;
      } catch (error) {
        throw error;
      } finally {
        teacherDashboardRequestHandle = null;
      }
    })();

    return teacherDashboardRequestHandle;
  },


  createTeacher: async (data: any) => {
    const res = await axiosInstance.post("/profile/teachers/", data);
    teacherCache = null;
    return res.data;
  },

  updateTeacher: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/profile/teachers/${id}/`, data);
    teacherCache = null;
    return res.data;
  },

  deleteTeacher: async (id: string | number) => {
    const res = await axiosInstance.delete(`/profile/teachers/${id}/`);
    teacherCache = null;
    return res.data;
  },
};