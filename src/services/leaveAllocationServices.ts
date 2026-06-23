import axiosInstance from "@/lib/config/axios.config";

let leaveAllocationCache: any = null;
let leaveAllocationRequestHandle: Promise<any> | null = null;

export const LeaveAllocationServices = {
  // Clear Cache
  clearCache: () => {
    leaveAllocationCache = null;
  },

  // Get All Leave Allocations
  getAllLeaveAllocations: async (params?: { search?: string; page?: number; limit?: number }) => {
    // यदि cache छ र search वा page परिवर्तन भएको छैन भने cache बाटै डाटा दिने
    if (leaveAllocationCache && !params?.search && !params?.page) {
      return leaveAllocationCache;
    }

    // यदि एउटै request पहिले नै चलिरहेको छ भने त्यसैलाई पर्खिने (De-duplication)
    if (leaveAllocationRequestHandle) return leaveAllocationRequestHandle;

    leaveAllocationRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/leave-management/leave-allocations/", { params });
        const actualData = res.data;

        // search नगरेको बेला मात्र cache मा राख्ने
        if (!params?.search) {
          leaveAllocationCache = actualData;
        }

        return actualData;
      } finally {
        leaveAllocationRequestHandle = null;
      }
    })();

    return leaveAllocationRequestHandle;
  },

  // Create Leave Allocation
  createLeaveAllocation: async (data: any) => {
    const res = await axiosInstance.post("/leave-management/leave-allocations/", data);
    leaveAllocationCache = null; // नयाँ डाटा थपिएपछि cache clear गर्ने
    return res.data;
  },

  // Update Leave Allocation
  updateLeaveAllocation: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/leave-management/leave-allocations/${id}/`, data);
    leaveAllocationCache = null; // डाटा अपडेट भएपछि cache clear गर्ने
    return res.data;
  },

  // Delete Leave Allocation
  deleteLeaveAllocation: async (id: string | number) => {
    const res = await axiosInstance.delete(`/leave-management/leave-allocations/${id}/`);
    leaveAllocationCache = null; // डाटा डिलिट भएपछि cache clear गर्ने
    return res.data;
  },
};