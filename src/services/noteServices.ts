import axiosInstance from "@/lib/config/axios.config";

let notesCache: any = null;
let notesRequestHandle: Promise<any> | null = null;

export const NotesServices = {
  clearCache: () => {
    notesCache = null;
  },

  getAllNotes: async (params?: { search?: string; page?: number; limit?: number }) => {
    if (notesCache && !params?.search && !params?.page) return notesCache;

    if (notesRequestHandle) return notesRequestHandle;

    notesRequestHandle = (async () => {
      try {
        const res = await axiosInstance.get("/notes/notes/", { params });
        const actualData = res.data;

        if (!params?.search) {
          notesCache = actualData;
        }

        return actualData;
      } finally {
        notesRequestHandle = null;
      }
    })();

    return notesRequestHandle;
  },

  createNotes: async (data: any) => {
    const res = await axiosInstance.post("/notes/notes/", data);
    notesCache = null;
    return res.data;
  },

  updateNotes: async (id: string | number, data: any) => {
    const res = await axiosInstance.patch(`/notes/notes/${id}/`, data);
    notesCache = null;
    return res.data;
  },

  deleteNotes: async (id: string | number) => {
    const res = await axiosInstance.delete(`/notes/notes/${id}/`);
    notesCache = null;
    return res.data;
  },
};