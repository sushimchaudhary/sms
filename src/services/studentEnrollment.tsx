import axiosInstance from "@/lib/config/axios.config";

let enrollmentCache: any = null;
let enrollmentRequestHandle: Promise<any> | null = null;

export const EnrollmentServices = {
  clearCache: () => {
    enrollmentCache = null;
  },

  getAllEnrollments: async (params?: { search?: string; page?: number; limit?: number }) => {
    // Cache (search nabhako bela matra)
    if (enrollmentCache && !params?.search) return enrollmentCache;

    // Ongoing request reuse
    if (enrollmentRequestHandle) return enrollmentRequestHandle;

    enrollmentRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/profile/enrollments/", { params });
        const actualData = res.data;

        if (!params?.search) {
          enrollmentCache = actualData;
        }

        return actualData;
      } catch (error) {
        throw error;
      } finally {
        enrollmentRequestHandle = null;
      }
    })();

    return enrollmentRequestHandle;
  },

  createEnrollment: async (data: any) => {
    const res = await axiosInstance.post("/profile/enrollments/", data);
    enrollmentCache = null;
    return res.data;
  },

  updateEnrollment: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/profile/enrollments/${id}/`, data);
    enrollmentCache = null;
    return res.data;
  },

  deleteEnrollment: async (id: string | number) => {
    const res = await axiosInstance.delete(`/profile/enrollments/${id}/`);
    enrollmentCache = null;
    return res.data;
  },
};