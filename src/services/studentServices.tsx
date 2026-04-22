import axiosInstance from "@/lib/config/axios.config";

let studentCache: any = null;
let studentRequestHandle: Promise<any> | null = null;

export const StudentServices = {
  clearCache: () => {
    studentCache = null;
  },

  getAllStudents: async (params?: { search?: string; page?: number; limit?: number }) => {
    // Cache return (search nabhako bela matra)
    if (studentCache && !params?.search) return studentCache;

    // Ongoing request cha bhane same return garne
    if (studentRequestHandle) return studentRequestHandle;

    studentRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/profile/students/", { params });
        const actualData = res.data;

        if (!params?.search) {
          studentCache = actualData;
        }

        return actualData;
      } catch (error) {
        throw error;
      } finally {
        studentRequestHandle = null;
      }
    })();

    return studentRequestHandle;
  },

  createStudent: async (data: any) => {
    const res = await axiosInstance.post("/profile/students/", data);
    studentCache = null;
    return res.data;
  },

  updateStudent: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/profile/students/${id}/`, data);
    studentCache = null;
    return res.data;
  },

  deleteStudent: async (id: string | number) => {
    const res = await axiosInstance.delete(`/profile/students/${id}/`);
    studentCache = null;
    return res.data;
  },
};