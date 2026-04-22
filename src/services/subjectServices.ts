import axiosInstance from "@/lib/config/axios.config";

let subjectCache: any = null;
let subjectRequestHandle: Promise<any> | null = null;

export const SubjectServices = {
  clearCache: () => {
    subjectCache = null;
  },

  getAllSubjects: async (params?: { search?: string; page?: number; limit?: number }) => {
    // Cache check (only when not searching)
    if (subjectCache && !params?.search) return subjectCache;

    // Ongoing request reuse to prevent multiple simultaneous calls
    if (subjectRequestHandle) return subjectRequestHandle;

    subjectRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/academics/subjects/", { params });
        const actualData = res.data;

        // Save to cache if it's a general fetch (no search)
        if (!params?.search) {
          subjectCache = actualData;
        }

        return actualData;
      } catch (error) {
        throw error;
      } finally {
        subjectRequestHandle = null;
      }
    })();

    return subjectRequestHandle;
  },

  createSubject: async (data: any) => {
    const res = await axiosInstance.post("/academics/subjects/", data);
    subjectCache = null; // Invalidate cache on change
    return res.data;
  },

  updateSubject: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/academics/subjects/${id}/`, data);
    subjectCache = null; // Invalidate cache on change
    return res.data;
  },

  deleteSubject: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/subjects/${id}/`);
    subjectCache = null; // Invalidate cache on change
    return res.data;
  },
};