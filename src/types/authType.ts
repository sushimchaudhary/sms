import * as z from "zod";

export interface ICredentials {
  username: string;
  password: string;
}

export const LoginDTO = z.object({
  username: z.string().nonempty("Username is required"),
  password: z.string().nonempty("Password is required"),
  remember: z.boolean().optional()
});

export interface IAuthContext {
  login(credentials: ICredentials): Promise<IUser | void>;
  getLoggedInUser(): Promise<IUser | void>;
  loggedInUser: null | IUser;
  user: null | IUser;
  loading: boolean;
}

export interface IUser {
  email: string;
  name: string;
  role: string; // 'student', 'teacher', 'staff', 'admin' etc.
  username: string;
  id: string | number;
  _id: string | number;
  created_at?: string | Date;
  // School & Session Info
  schoolName?: string;   
  school_name?: string; 
  school_id?: number | string;
  school?: {
    id?: string | number;
    _id?: string;
    name: string;
    code?: string;
  } | string; 
  
  active_session_id?: string | number;
  active_session?: {
    id: string | number;
    name: string;
  };

  // Leave Form ko lagi chahine Profile IDs
  teacher_profile_id?: string | number;
  teacher_profile?: {
    id: string | number;
    name: string;
  };

  // Student ko lagi Enrollment ID chahincha Leave apply garna
  enrollment_id?: string | number; 
  student_profile?: {
    id: string | number;
    student_id: string;
  };

  // Staff ko lagi Staff ID
  staff_profile_id?: string | number;
  staff_profile?: {
    id: string | number;
    designation: string;
  };
  photo?: string;
  profile_photo?: string;
  image: {
    id: string, 
    url: string,
    thumb: string,
  };
  
  teacher?: {
    id: number;
    name: string;
    email: string;
    code: string;
  };
  student?: {
    id: number;
    name: string;
  };
  staff?: {
    id: number;
    name: string;
    designation: string;
  };
}

