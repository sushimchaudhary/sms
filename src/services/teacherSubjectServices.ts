import axiosInstance from "@/lib/config/axios.config";

let tsCache: any = null;
let tsRequestHandle: Promise<any> | null = null;

export const TeacherSubjectServices = {
  clearCache: () => { tsCache = null; },

  getAllTeacherSubjects: async (params?: any) => {
    if (tsCache && !params?.search) return tsCache;
    if (tsRequestHandle) return tsRequestHandle;

    tsRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/academics/teacher-subjects/", { params });
        if (!params?.search) tsCache = res.data;
        return res.data;
      } finally {
        tsRequestHandle = null;
      }
    })();
    return tsRequestHandle;
  },

  createTeacherSubject: async (data: any) => {
    const res = await axiosInstance.post("/academics/teacher-subjects/", data);
    tsCache = null;
    return res.data;
  },

  updateTeacherSubject: async (id: number | string, data: any) => {
    const res = await axiosInstance.put(`/academics/teacher-subjects/${id}/`, data);
    tsCache = null;
    return res.data;
  },

  deleteTeacherSubject: async (id: number | string) => {
    await axiosInstance.delete(`/academics/teacher-subjects/${id}/`);
    tsCache = null;
  }
};