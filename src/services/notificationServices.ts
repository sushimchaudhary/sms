import axiosInstance from "@/lib/config/axios.config";

// --- Notifications Cache ---
let notificationCache: any = null;
let notificationRequestHandle: Promise<any> | null = null;

// --- Complaints Cache ---
let complaintCache: any = null;
let complaintRequestHandle: Promise<any> | null = null;

/**
 * Service for Handling Notifications
 * Base URL: /notification-complain/notifications/
 */
export const NotificationServices = {
  clearCache: () => {
    notificationCache = null;
  },

  getAllNotifications: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (notificationCache && !params?.search && !params?.page) return notificationCache;
    if (notificationRequestHandle) return notificationRequestHandle;

    notificationRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/notification-complain/notifications/", { params });
        const actualData = res.data;
        if (!params?.search) notificationCache = actualData;
        return actualData;
      } finally {
        notificationRequestHandle = null;
      }
    })();
    return notificationRequestHandle;
  },


getUnreadCount: async () => {
  try {
    const res = await axiosInstance.get("/notification-complain/notifications/");
    
    // API ले सबै डेटा दिइरहेको छ भने, हामी आफैं filter गर्नेछौं
    const allNotifications = Array.isArray(res.data) ? res.data : (res.data.results || []);
    const unreadNotifications = allNotifications.filter((n: any) => n.is_read === false);
    
    console.log("वास्तविक नपढेका नोटिफिकेसनहरू:", unreadNotifications.length);
    
    return unreadNotifications.length; 
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
},

  createNotification: async (data: any) => {
    const res = await axiosInstance.post("/notification-complain/notifications/", data);
    notificationCache = null; // Clear cache on new creation
    return res.data;
  },

 updateNotification: async (id: string | number, data: any) => {
  const res = await axiosInstance.patch(`/notification-complain/notifications/${id}/`, data);
  notificationCache = null; 
  return res.data;
},

  deleteNotification: async (id: string | number) => {
    const res = await axiosInstance.delete(`/notification-complain/notifications/${id}/`);
    notificationCache = null;
    return res.data;
  },

  // NotificationServices मा यो थप्नुहोस्:

  markNotificationAsRead: async (id: string | number) => {
    try {
      // तपाईंले views.py मा बनाएको @action को URL यहाँ राख्नुहोस्
      const res = await axiosInstance.post(`/notification-complain/notifications/${id}/mark_as_read/`);
      
      // क्यास क्लियर गर्नुहोस् ताकि अर्को पटक फेरि डेटा तान्दा अपडेटेड डेटा आउँछ
      notificationCache = null; 
      
      return res.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },
  
};

/**
 * Service for Handling Complaints
 * Base URL: /notification-complain/complaints/
 */
export const ComplaintServices = {
  clearCache: () => {
    complaintCache = null;
  },

  getAllComplaints: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (complaintCache && !params?.search && !params?.page) return complaintCache;
    if (complaintRequestHandle) return complaintRequestHandle;

    complaintRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/notification-complain/complaints/", { params });
        const actualData = res.data;
        if (!params?.search) complaintCache = actualData;
        return actualData;
      } finally {
        complaintRequestHandle = null;
      }
    })();
    return complaintRequestHandle;
  },

  createComplaint: async (data: any) => {
    const res = await axiosInstance.post("/notification-complain/complaints/", data);
    complaintCache = null;
    return res.data;
  },

  updateComplaint: async (id: string | number, data: any) => {
    const res = await axiosInstance.patch(`/notification-complain/complaints/${id}/`, data);
    complaintCache = null;
    return res.data;
  },

  deleteComplaint: async (id: string | number) => {
    const res = await axiosInstance.delete(`/notification-complain/complaints/${id}/`);
    complaintCache = null;
    return res.data;
  },
};