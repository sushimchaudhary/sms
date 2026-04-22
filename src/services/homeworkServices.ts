import axiosInstance from "@/lib/config/axios.config";

let homeworkCache: any = null;
let homeworkRequestHandle: Promise<any> | null = null;

export const HomeworkServices = {
  clearCache: () => {
    homeworkCache = null;
  },

  getAllHomeworks: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (homeworkCache && !params?.search && !params?.page) return homeworkCache;

    if (homeworkRequestHandle) return homeworkRequestHandle;

    homeworkRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/notes/homeworks/", { params });
        const actualData = res.data;

        if (!params?.search) {
          homeworkCache = actualData;
        }

        return actualData;
      } finally {
        homeworkRequestHandle = null;
      }
    })();

    return homeworkRequestHandle;
  },

  createHomework: async (data: any) => {
    const res = await axiosInstance.post("/notes/homeworks/", data);
    homeworkCache = null;
    return res.data;
  },

  updateHomework: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/notes/homeworks/${id}/`, data);
    homeworkCache = null;
    return res.data;
  },

  deleteHomework: async (id: string | number) => {
    const res = await axiosInstance.delete(`/notes/homeworks/${id}/`);
    homeworkCache = null;
    return res.data;
  },
};