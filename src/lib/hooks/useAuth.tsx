import { useContext } from "react";
import AuthContext from "@/lib/context/AuthContext";
import { IAuthContext } from "@/types/authType";

const useAuth = () => {
  const context = useContext(AuthContext) as IAuthContext;
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default useAuth;