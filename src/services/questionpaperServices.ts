import axiosInstance from "@/lib/config/axios.config";

let paperCache: any = null;
let paperRequestHandle: Promise<any> | null = null;

export const QuestionPaperServices = {
  clearCache: () => {
    paperCache = null;
  },

  // ── Papers ────────────────────────────────────────────────────────────────

  getAllPapers: async (params?: { search?: string; page?: number }) => {
    if (paperCache && !params?.search && !params?.page) return paperCache;
    if (paperRequestHandle) return paperRequestHandle;

    paperRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/academics/question-papers/", { params });
        if (!params?.search) paperCache = res.data;
        return res.data;
      } finally {
        paperRequestHandle = null;
      }
    })();
    return paperRequestHandle;
  },

  getPaper: async (id: string | number) => {
    const res = await axiosInstance.get(`/academics/question-papers/${id}/`);
    return res.data;
  },

  createPaper: async (data: any) => {
    const res = await axiosInstance.post("/academics/question-papers/", data);
    paperCache = null;
    return res.data; // { id, title, subject, ... }
  },

  updatePaper: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/academics/question-papers/${id}/`, data);
    paperCache = null;
    return res.data;
  },

  patchPaper: async (id: string | number, data: any) => {
    const res = await axiosInstance.patch(`/academics/question-papers/${id}/`, data);
    paperCache = null;
    return res.data;
  },

  deletePaper: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/question-papers/${id}/`);
    paperCache = null;
    return res.data;
  },

  // ── QuestionSections (exam paper groups A/B/C) ────────────────────────────
  //
  // ✅  /academics/question-sections/   ← QuestionSection model
  // ❌  /academics/sections/            ← classroom Section model (WRONG!)
  //
  // This was the root cause of the bug:
  //   QuestionSection.objects.filter(id=18).exists() → False
  // because id=18 was being saved to the Section table, not QuestionSection.


  getAllSections: async () => {
    const response = await axiosInstance.get('/academics/question-sections/');
    return response.data;
  },

  getSectionsByPaper: async (paperId: string | number) => {
    const res = await axiosInstance.get(`/academics/question-sections/?paper=${paperId}`);
    return res.data;
  },

  createQuestionSection: async (data: any) => {
    const res = await axiosInstance.post("/academics/question-sections/", data);
    return res.data; // { id, paper, title, heading, total_marks, order, ... }
  },

  updateQuestionSection: async (id: string | number, data: any) => {
    const res = await axiosInstance.put(`/academics/question-sections/${id}/`, data);
    return res.data;
  },

  deleteQuestionSection: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/question-sections/${id}/`);
    return res.data;
  },

  // ── Questions ─────────────────────────────────────────────────────────────


    getQuestion: async (data: FormData | any) => {
    const res = await axiosInstance.post("/academics/questions/", data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data; // { id, section, question_type, question, marks, ... }
  },


  createQuestion: async (data: FormData | any) => {
    const res = await axiosInstance.post("/academics/questions/", data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data; // { id, section, question_type, question, marks, ... }
  },

  updateQuestion: async (id: string | number, data: FormData | any) => {
    const res = await axiosInstance.put(`/academics/questions/${id}/`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  deleteQuestion: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/questions/${id}/`);
    return res.data;
  },



printedPapers: async (data: any) => {
    // Backend को URL सँग exact match हुनुपर्छ
    const res = await axiosInstance.post("/academics/printed-papers/", data);
    return res.data;
},

  // Edit (Update)
  updateprintedPaper: async (id: string | number, data: FormData | any) => {
    const res = await axiosInstance.put(`/academics/printed-papers/${id}/`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  // Partial Update (Patch)
  patchprintedPaper: async (id: string | number, data: FormData | any) => {
    const res = await axiosInstance.patch(`/academics/printed-papers/${id}/`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  // Delete
  deleteprintedPaper: async (id: string | number) => {
    const res = await axiosInstance.delete(`/academics/printed-papers/${id}/`);
    return res.data;
  },




   allInOnePaper: async (data: any) => {
    const res = await axiosInstance.post("/academics/finalgenerate/", data);
    paperCache = null;
    return res.data; // { id, title, subject, ... }
  },

};