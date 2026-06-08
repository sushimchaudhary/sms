// import axiosInstance from "@/lib/config/axios.config";

// let classCache: any = null;
// let classRequestHandle: Promise<any> | null = null;

// export const ClassServices = {
//   // Cache clear garna (e.g., logout garda ya manually refresh garda)
//   clearCache: () => {
//     classCache = null;
//   },

//   // Get All Classes with optional params
//   getAllClasses: async (params?: { search?: string; page?: number; limit?: number }) => {
//     // Cache check: Search chaina vane ra cache data cha vane cache return garne
//     if (classCache && !params?.search && !params?.page) return classCache;

//     // Ongoing request handle: Yedi dual request gayo vane wait garne
//     if (classRequestHandle) return classRequestHandle;

//     classRequestHandle = (async () => {
//       try {
//         const res = await axiosInstance.get("/academics/classes/", { params });
//         const actualData = res.data;

//         // Search nabhako data lai matra cache garne
//         if (!params?.search) {
//           classCache = actualData;
//         }

//         return actualData;
//       } catch (error) {
//         throw error;
//       } finally {
//         classRequestHandle = null;
//       }
//     })();

//     return classRequestHandle;
//   },

//   // Create New Class
//   createClass: async (data: any) => {
//     const res = await axiosInstance.post("/academics/classes/", data);
//     // Naya data create bhayesi purano cache clear garne
//     classCache = null;
//     return res.data;
//   },

//   // Update Existing Class
//   updateClass: async (id: string | number, data: any) => {
//     const res = await axiosInstance.put(`/academics/classes/${id}/`, data);
//     // Data change bhayesi cache clear garne
//     classCache = null;
//     return res.data;
//   },

//   // Delete Class
//   deleteClass: async (id: string | number) => {
//     const res = await axiosInstance.delete(`/academics/classes/${id}/`);
//     // Delete bhayesi cache clear garne
//     classCache = null;
//     return res.data;
//   },
// };




import axiosInstance from "@/lib/config/axios.config";

let classCache: any = null;
let classRequestHandle: Promise<any> | null = null;

let sectionCache: Record<string, any> = {};
let sectionRequestHandles: Record<string, Promise<any>> = {};

export const ClassServices = {
  // Cache clear garna (e.g., logout garda ya manually refresh garda)
  clearCache: () => {
    classCache = null;
    sectionCache = {};
  },

  // ── Get All Classes ────────────────────────────────────────────────────────
  getAllClasses: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    // Cache check: Search chaina vane ra cache data cha vane cache return garne
    if (classCache && !params?.search && !params?.page) return classCache;

    // Ongoing request handle: Yedi dual request gayo vane wait garne
    if (classRequestHandle) return classRequestHandle;

    classRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/academics/classes/", { params });
        const actualData = res.data;

        // Search nabhako data lai matra cache garne
        if (!params?.search) {
          classCache = actualData;
        }

        return actualData;
      } finally {
        classRequestHandle = null;
      }
    })();

    return classRequestHandle;
  },

  // ── Get Sections by Class + Session ───────────────────────────────────────
  // Used in QuestionPaperBuilder to populate the "Class Section" dropdown
  // after the user picks a class and session.
  // Endpoint: GET /academics/sections/?class_assigned=<classId>&session=<sessionId>
  getSectionsByClass: async (
    classId: string | number,
    sessionId: string | number
  ) => {
    const cacheKey = `${classId}_${sessionId}`;

    // Return cached result if available
    if (sectionCache[cacheKey]) return sectionCache[cacheKey];

    // Deduplicate concurrent requests for the same key
    // if (sectionRequestHandles[cacheKey]) return sectionRequestHandles[cacheKey];

    sectionRequestHandles[cacheKey] = (async () => {
      try {
        const res = await axiosInstance.get("/academics/sections/", {
          params: { class_assigned: classId, session: sessionId },
        });
        const actualData = res.data;
        sectionCache[cacheKey] = actualData;
        return actualData;
      } finally {
        delete sectionRequestHandles[cacheKey];
      }
    })();

    return sectionRequestHandles[cacheKey];
  },

  // ── Create New Class ───────────────────────────────────────────────────────
  createClass: async (data: any) => {
    const res = await axiosInstance.post("/academics/classes/", data);
    classCache = null; // invalidate cache
    return res.data;
  },

  // ── Update Existing Class ──────────────────────────────────────────────────
  updateClass: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/academics/classes/${id}/`, data);
    classCache = null; // invalidate cache
    return res.data;
  },

  // ── Delete Class ───────────────────────────────────────────────────────────
  deleteClass: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/classes/${id}/`);
    classCache = null; // invalidate cache
    return res.data;
  },
};