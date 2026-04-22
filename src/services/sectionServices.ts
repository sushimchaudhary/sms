import axiosInstance from "@/lib/config/axios.config";

let sectionCache: any = null;
let sectionRequestHandle: Promise<any> | null = null;

export const SectionServices = {
  clearCache: () => { sectionCache = null; },

  getAllSections: async (params?: { search?: string; class_id?: string; session_id?: string }) => {
    if (sectionCache && !params?.search && !params?.class_id) return sectionCache;
    if (sectionRequestHandle) return sectionRequestHandle;

    sectionRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/academics/sections/", { params });
        if (!params?.search) sectionCache = res.data;
        return res.data;
      } finally {
        sectionRequestHandle = null;
      }
    })();
    return sectionRequestHandle;
  },

  createSection: async (data: any) => {
    const res = await axiosInstance.post("/academics/sections/", data);
    sectionCache = null;
    return res.data;
  },

  updateSection: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/academics/sections/${id}/`, data);
    sectionCache = null;
    return res.data;
  },

  deleteSection: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/sections/${id}/`);
    sectionCache = null;
    return res.data;
  },
};