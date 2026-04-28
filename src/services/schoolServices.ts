import axiosInstance from "@/lib/config/axios.config";

let schoolCache: any = null;
let schoolRequestHandle: Promise<any> | null = null;

export const SchoolServices = {

   clearCache: () => {
    schoolCache = null;
  },


 getSingleSchool: async (id: string | number) => {
    const res = await axiosInstance.get(`/school/schools/${id}/`);
    return res.data; 
  },

  getDetails: async (params?: { page?: number; limit?: number; search?: string }) => {
    if (!params && schoolCache) return schoolCache;
    if (!params && schoolRequestHandle) return schoolRequestHandle;

    schoolRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/school/schools/", { params });
        
    
        const actualData = Array.isArray(res.data) ? res.data : res.data?.data; 

        const finalData = Array.isArray(actualData) ? actualData : [];
        
        if (!params) schoolCache = finalData;
        
        return finalData;
      } catch (error) {
        throw error;
      } finally {
        schoolRequestHandle = null;
      }
    })();

    return schoolRequestHandle;
  },

 
  createDetails: async (data: FormData) => {
    const res = await axiosInstance.post("/school/schools/", data);
    schoolCache = null; 
    return res.data;
  },

  updateDetails: async (id: string, data: FormData) => {
    const res = await axiosInstance.patch(`/school/schools/${id}/`, data); 
    schoolCache = null;
    return res.data;
  },

  deleteDetails: async (id: string) => {
    const res = await axiosInstance.delete(`/school/schools/${id}/`);
    schoolCache = null;
    return res.data;
  },
};