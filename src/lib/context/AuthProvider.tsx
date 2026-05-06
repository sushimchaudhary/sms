"use client";

import { useEffect, useState, useCallback } from "react";
import AuthContext from "./AuthContext";
import { IUser, ICredentials } from "../../types/authType";
import Cookies from "js-cookie";
import { UserServices } from "@/services/authServices";

export const AuthProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<IUser | null>(null);


const getLoggedInUser = useCallback(async () => {
  setLoading(true);
  try {
    const userInfo = Cookies.get("user_info");
    
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    } else {
      
      const res = await UserServices.getDetails(); 

      
      const userData = res.data?.data || res.data || res;
      setUser(userData);
      
      Cookies.set("user_info", JSON.stringify(userData));
    }
  } catch (error) {
    console.error("Failed to fetch user:", error);
    setUser(null);
  } finally {
    setLoading(false);
  }
}, []);

  const login = async (credentials: ICredentials) => {
    console.log("Login credentials:", credentials);
  };

  useEffect(() => {
    getLoggedInUser();
  }, [getLoggedInUser]);


  const contextValue = {
    login,
    getLoggedInUser,
    user,           
    loggedInUser: user, 
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? (
        <div className="flex items-center justify-center h-screen">Loading..</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

