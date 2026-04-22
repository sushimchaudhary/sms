import axiosInstance from "@/lib/config/axios.config";

let studentAttendanceCache: any = null;
let staffAttendanceCache: any = null;

let studentRequestHandle: Promise<any> | null = null;
let staffRequestHandle: Promise<any> | null = null;

export const AttendanceServices = {
  // Cache clear (logout / manual refresh)
  clearCache: () => {
    studentAttendanceCache = null;
    staffAttendanceCache = null;
  },

  // ===============================
  // 📌 STUDENT ATTENDANCE
  // ===============================
  getStudentAttendance: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (studentAttendanceCache && !params?.search && !params?.page) {
      return studentAttendanceCache;
    }

    if (studentRequestHandle) return studentRequestHandle;

    studentRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/attendance/student-attendance/", { params });
        const data = res.data;
        if (!params?.search) {
          studentAttendanceCache = data;
        }
        return data;
      } catch (error) {
        throw error;
      } finally {
        studentRequestHandle = null;
      }
    })();

    return studentRequestHandle;
  },

  createStudentAttendance: async (data: any) => {
    const res = await axiosInstance.post("/attendance/student-attendance/", data);
    studentAttendanceCache = null;
    return res.data;
  },

  updateStudentAttendance: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/attendance/student-attendance/${id}/`, data);
    studentAttendanceCache = null;
    return res.data;
  },

  deleteStudentAttendance: async (id: string | number) => {
    const res = await axiosInstance.delete(`/attendance/student-attendance/${id}/`);
    studentAttendanceCache = null;
    return res.data;
  },

  // ── Bulk Mark (calls your Django bulk_mark action) ──────────────────────────
  bulkMarkStudentAttendance: async (payload: {
    date: string;
    class_id: number | null;
    section_id: number | null;
    attendances: {
      enrollment: number;
      status: "present" | "absent" | "leave" | "late";
      remarks?: string;
    }[];
  }) => {
    const res = await axiosInstance.post(
      "/attendance/student-attendance/bulk_mark/",
      payload
    );
    studentAttendanceCache = null; // invalidate cache after bulk write
    return res.data;
  },

  // ===============================
  // 📌 STAFF ATTENDANCE
  // ===============================
  getStaffAttendance: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (staffAttendanceCache && !params?.search && !params?.page) {
      return staffAttendanceCache;
    }

    if (staffRequestHandle) return staffRequestHandle;

    staffRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/attendance/staff-attendance/", { params });
        const data = res.data;
        if (!params?.search) {
          staffAttendanceCache = data;
        }
        return data;
      } catch (error) {
        throw error;
      } finally {
        staffRequestHandle = null;
      }
    })();

    return staffRequestHandle;
  },

  createStaffAttendance: async (data: any) => {
    const res = await axiosInstance.post("/attendance/staff-attendance/", data);
    staffAttendanceCache = null;
    return res.data;
  },

  updateStaffAttendance: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/attendance/staff-attendance/${id}/`, data);
    staffAttendanceCache = null;
    return res.data;
  },

  deleteStaffAttendance: async (id: string | number) => {
    const res = await axiosInstance.delete(`/attendance/staff-attendance/${id}/`);
    staffAttendanceCache = null;
    return res.data;
  },
};