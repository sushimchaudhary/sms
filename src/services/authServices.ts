// import axiosInstance from "@/lib/config/axios.config";

// let userCache: any = null;
// let userRequestHandle: Promise<any> | null = null;

// export const UserServices = {
  
 

 
// getDetails: async (params?: { search?: string; page?: number; limit?: number }) => {
//   const res = await axiosInstance.get("/auth/users/", { params }); 
//   return res.data;
// },

//   clearCache: () => {
//     userCache = null;
//   },

//   createDetails: async (data: FormData) => {
//     const res = await axiosInstance.post("/auth/register/", data, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//     userCache = null;
//     return res.data;
//   },

//   updateDetails: async (id: string, data: FormData) => {
//     const res = await axiosInstance.put(`/auth/users/${id}/`, data, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//     userCache = null;
//     return res.data;
//   },

//   deleteDetails: async (id: string) => {
//     const res = await axiosInstance.delete(`/auth/users/${id}/`);
//     userCache = null;
//     return res.data;
//   },

 
// };



import axiosInstance from "@/lib/config/axios.config";

let userCache: any = null;
let userRequestHandle: Promise<any> | null = null;

export const UserServices = {

  getDetails: async (params?: { search?: string; page?: number; limit?: number }) => {
    const res = await axiosInstance.get("/auth/users/", { params });
    return res.data;
  },

  // ── Scoped fetch: only teacher & staff roles ──────────────────────────────
  // Used in StaffAttendanceForm dropdown to avoid hitting the
  // admin-only full users list and getting a 403.
  // @/services/authServices भित्र
getStaffAndTeachers: async () => {
    try {
      // 403 बाट बच्नको लागि parameters स्पष्ट पठाउने
      const res = await axiosInstance.get("/auth/users/", {
        params: { 
          role__in: "teacher,staff",
          page_size: 100 // सबै स्टाफ एकैपटक आओस् भन्नका लागि
        },
      });
      
      // Backend ले { results: [...] } पठाउँछ भने त्यसलाई मिलाउने
      const data = res.data;
      return Array.isArray(data) ? data : data?.results || data?.data || [];
    } catch (error: any) {
      console.error("User Fetch Error:", error.response?.status);
      throw error; // यसले गर्दा form मा toast देखिन्छ
    }
  },

  // ── Cache helpers ─────────────────────────────────────────────────────────
  clearCache: () => {
    userCache = null;
  },

  // ── CRUD ──────────────────────────────────────────────────────────────────
  createDetails: async (data: FormData) => {
    const res = await axiosInstance.post("/auth/register/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    userCache = null;
    return res.data;
  },

  updateDetails: async (id: string, data: FormData) => {
    const res = await axiosInstance.put(`/auth/users/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    userCache = null;
    return res.data;
  },

  deleteDetails: async (id: string) => {
    const res = await axiosInstance.delete(`/auth/users/${id}/`);
    userCache = null;
    return res.data;
  },
};