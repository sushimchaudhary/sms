"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { type IAuthContext, type IUser, type ICredentials } from "../../types/authType";
import Cookies from "js-cookie";
import axiosInstance from "../config/axios.config";

const AuthContext = createContext<IAuthContext>({
  login: async () => {},
  getLoggedInUser: async () => {},
  loggedInUser: null,
  user: null, 
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getLoggedInUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/auth/me");
      const userData = res.data.data;
      
      setLoggedInUser(userData);

      Cookies.set("user_info", JSON.stringify(userData), { expires: 7 });

    } catch (error) {
      const userInfo = Cookies.get("user_info");
      if (userInfo) {
        setLoggedInUser(JSON.parse(userInfo));
      } else {
        setLoggedInUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: ICredentials) => {
    console.log("Logging in with:", credentials);
  };

  useEffect(() => {
    getLoggedInUser();
  }, [getLoggedInUser]);

  return (
    <AuthContext.Provider 
      value={{ 
        login,
        getLoggedInUser, 
        loggedInUser, 
        user: loggedInUser, 
        loading 
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-screen">Loading..</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;


