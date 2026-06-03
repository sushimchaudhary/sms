import axiosInstance from "@/lib/config/axios.config";

let admissionCache: any = null;
let admissionRequestHandle: Promise<any> | null = null;

export const AdmissionServices = {
  // क्यास (Cache) क्लियर गर्नका लागि
  clearCache: () => {
    admissionCache = null;
  },

  // सबै भर्ना (Admissions) हरू लिस्ट गर्न वा सर्च गर्न
  getAllAdmissions: async (params?: { search?: string; page?: number; limit?: number }) => {
    // यदि क्यास उपलब्ध छ र कुनै सर्च वा फिल्टर गरिएको छैन भने क्यास डाटा पठाउने
    if (admissionCache && !params?.search) return admissionCache;
    
    // यदि पहिले नै रिक्वेस्ट जाँदैछ भने त्यही प्रमिस (Promise) फर्काउने
    if (admissionRequestHandle) return admissionRequestHandle;

    admissionRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/profile/admissions/create_admission/", { params });
        const actualData = res.data;

        // यदि सर्च गरिएको छैन भने मात्र क्यासमा सेभ गर्ने
        if (!params?.search) {
          admissionCache = actualData;
        }
        return actualData;
      } catch (error) {
        throw error;
      } finally {
        admissionRequestHandle = null;
      }
    })();

    return admissionRequestHandle;
  },

  // एउटा मात्र भर्ना (Single Admission) को विवरण हेर्न
  getSingleAdmission: async (id: string | number) => {
    const res = await axiosInstance.get(`/profile/admissions/create_admission/${id}/`);
    return res.data;
  },

 // नयाँ विद्यार्थी भर्ना (Admission) क्रिएट गर्न
createAdmission: async (data: FormData | any) => {
  const isFormData = data instanceof FormData;
  
  const res = await axiosInstance.post(
    "/profile/admissions/create_admission/",
    data,
    isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined
  );
  admissionCache = null;
  return res.data;
},

  // भर्नाको विवरण अपडेट गर्न
  updateAdmission: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/profile/admissions/create_admission/${id}/`, data);
    admissionCache = null; // क्यास क्लियर गर्ने
    return res.data;
  },

  // भर्ना डिलिट गर्न
  deleteAdmission: async (id: string | number) => {
    const res = await axiosInstance.delete(`/profile/admissions/create_admission/${id}/`);
    admissionCache = null; // क्यास क्लियर गर्ने
    return res.data;
  },
};