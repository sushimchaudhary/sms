import axiosInstance from "@/lib/config/axios.config";
import { data } from "framer-motion/m";

// Caching variables to prevent redundant API calls
let feeCache: Record<string, any> = {
  feeTypes: null,
  feeStructures: null,
};

let feeRequestHandles: Record<string, Promise<any> | null> = {
  feeTypes: null,
  feeStructures: null,
};

export const FeeServices = {
  // Utility to clear specific or all caches
  clearCache: (key?: "feeTypes" | "feeStructures") => {
    if (key) feeCache[key] = null;
    else {
      feeCache.feeTypes = null;
      feeCache.feeStructures = null;
      feeCache.StudentFee = null;
    }
  },

  // --- FEE TYPES ---
  getAllFeeTypes: async (params?: any) => {
    if (feeCache.feeTypes && !params?.search) return feeCache.feeTypes;
    if (feeRequestHandles.feeTypes) return feeRequestHandles.feeTypes;

    feeRequestHandles.feeTypes = (async () => {
      try {
        const res = await axiosInstance.get("/accounting/fee-types/", { params });
        if (!params?.search) feeCache.feeTypes = res.data;
        return res.data;
      } finally {
        feeRequestHandles.feeTypes = null;
      }
    })();
    return feeRequestHandles.feeTypes;
  },

  createFeeType: async (data: any) => {
    const res = await axiosInstance.post("/accounting/fee-types/", data);
    feeCache.feeTypes = null;
    return res.data;
  },

  deleteFeeType: async (id: string | number) => { // Type lai string | number banaune
    const res = await axiosInstance.delete(`/accounting/fee-types/${id}/`); 
 
    feeCache.feeTypes = null;
    return res.data;
},

  updateFeeType: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/accounting/fee-types/${id}/`, data);
    feeCache.feeTypes = null;
    return res.data;
  },


  // --- FEE STRUCTURES (The one used in your Table/Form) ---
  // getAllFeeStructures: async (params?: any) => {
  //   if (feeCache.feeStructures && !params?.search) return feeCache.feeStructures;
  //   if (feeRequestHandles.feeStructures) return feeRequestHandles.feeStructures;

  //   feeRequestHandles.feeStructures = (async () => {
  //     try {
  //       const res = await axiosInstance.get("/accounting/fee-structures/", { params });
  //       if (!params?.search) feeCache.feeStructures = res.data;
  //       return res.data;
  //     } finally {
  //       feeRequestHandles.feeStructures = null;
  //     }
  //   })();
  //   return feeRequestHandles.feeStructures;
  // },

  // --- FEE STRUCTURES ---
getAllFeeStructures: async (params?: any) => {
  // 🚩 समस्या यहाँ थियो: !params?.search मात्र चेक गर्दा student_id आउँदा पनि क्यास नै पठाइदिन्थ्यो
  const hasParams = params && Object.keys(params).length > 0;

  if (feeCache.feeStructures && !hasParams) {
    return feeCache.feeStructures;
  }

  if (feeRequestHandles.feeStructures && !hasParams) {
    return feeRequestHandles.feeStructures;
  }

  const fetchPromise = (async () => {
    try {
      const res = await axiosInstance.get("/accounting/fee-structures/", { params });
      
      if (!hasParams) {
        feeCache.feeStructures = res.data;
      }
      
      return res.data;
    } finally {
      feeRequestHandles.feeStructures = null;
    }
  })();

  if (!hasParams) {
    feeRequestHandles.feeStructures = fetchPromise;
  }

  return fetchPromise;
},

  createFeeStructure: async (data: any) => {
    const res = await axiosInstance.post("/accounting/fee-structures/", data);
    feeCache.feeStructures = null;
    return res.data;
  },

  updateFeeStructure: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/accounting/fee-structures/${id}/`, data);
    feeCache.feeStructures = null;
    return res.data;
  },

  deleteFeeStructure: async (id: string | number) => {
    const res = await axiosInstance.delete(`/accounting/fee-structures/${id}/`);
    feeCache.feeStructures = null;
    return res.data;
  },



 // --- STUDENT FEES ---
getAllStudentFees: async (params?: any) => {
  const res = await axiosInstance.get("/accounting/student-fees/", { params });
  return res.data;
},

createStudentFees: async (data: any) => {
  const res = await axiosInstance.post("/accounting/student-fees/", data);
  return res.data;
},

updateStudentFees: async (id: string | number, data: any) => {
  const res = await axiosInstance.put(`/accounting/student-fees/${id}/`, data);
  return res.data;
},

deleteStudentFees: async (id: string | number) => { 
  const res = await axiosInstance.delete(`/accounting/student-fees/${id}/`);
  feeCache.StudentFee = null;
  return res.data;
},


  // --- PAYMENTS ---
  getAllPayments: async (params?: any) => {
    const res = await axiosInstance.get("/accounting/payments/", { params });
    return res.data;
  },

  createPayment: async (data: any) => {
    const res = await axiosInstance.post("/accounting/payments/", data);
    return res.data;
  },

  updatePayment: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/accounting/payments/${id}/`, data);
    return res.data;
  },

  deletePayment: async (id: string | number) => {
    const res = await axiosInstance.delete(`/accounting/payments/${id}/`);
    return res.data;
  },



  // --- EXPENSES ---
  getAllExpenses: async (params?: any) => {
    const res = await axiosInstance.get("/accounting/expenses/", { params });
    return res.data;
  },

  createExpense: async (data: any) => {
    const res = await axiosInstance.post("/accounting/expenses/", data);
    return res.data;
  },

  updateExpense: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/accounting/expenses/${id}/`, data);
    return res.data;
  },

  deleteExpense: async (id: string | number) => {
    const res = await axiosInstance.delete(`/accounting/expenses/${id}//`);
    return res.data;
  },
};