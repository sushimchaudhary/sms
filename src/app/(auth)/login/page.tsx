"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginDTO } from "../../../types/authType";
import { Lock, Mail, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfigProvider, Checkbox } from "antd";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/lib/context/ThemeContext";
import { toast } from "sonner";
import axiosInstance from "../../../lib/config/axios.config";
import useAuth from "@/lib/hooks/useAuth";
import { clearAuthCookies, setAuthCookies } from "@/action/auth";

import Link from "next/link";
import Image from "next/image";
import { UserServices } from "@/services/authServices";

export default function LoginPage() {
  const router = useRouter();
  const { getLoggedInUser } = useAuth();
  const { primaryColor } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(LoginDTO),
    defaultValues: { username: "", password: "", remember: false },
  });

  const handleRedirect = (role: string) => {
    const r = role?.toLowerCase();
    const routes: Record<string, string> = {
      "super admin": "/dashboard",
      "admin": "/dashboard",
      "staff": "/staff-dashboard",
      "student": "/student-dashboard",
      "teacher": "/teacher-dashboard",
      "parent": "/parent-dashboard",
    };

    if (routes[r]) {
      router.push(routes[r]);
    } else {
      toast.error(<strong>Unknown user role!</strong>, {
        description: "Please contact support for access.",
      });
    }
  };

  // const onSubmit = async (data: any) => {
  //   setIsLoading(true);
  //   try {
  //     await clearAuthCookies();
      
  //     // Call Service
  //     const apiResponse = await UserServices.login(data);
  //     const token = apiResponse.access;
  //     const userData = apiResponse.user;

  //     if (!token) throw new Error("Access token missing from backend response");

  //     // Global Configs
  //     axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  //     await setAuthCookies(token, userData, data.remember);
  //     if (getLoggedInUser) await getLoggedInUser();

  //     toast.success(<strong>Welcome back!</strong>, {
  //       description: `Logged in as ${userData.email}`,
  //     });

  //     handleRedirect(userData.role);
  //     router.refresh();
      
  //   } catch (error: any) {
  //     const errorMsg = UserServices.parseError(error);
  //     toast.error(<strong>Login failed !!</strong>, { description: errorMsg });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await clearAuthCookies();
      
      const apiResponse = await UserServices.login(data);
      
      // --- DEBUGGING START ---
      console.log("Full API Response:", apiResponse);
      // --- DEBUGGING END ---

      // Backend le 'access' key ma pathauxa ki 'token' key ma?
      // Django SimpleJWT ho vane 'access' hunxa.
      const token = apiResponse.access || apiResponse.token; 
      const userData = apiResponse.user;

      if (!token) {
        console.error("Token missing in response keys. Check apiResponse structure.");
        throw new Error("Access token missing from backend response");
      }

      // Axios header set garne
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      // Cookie ma save garne
      await setAuthCookies(token, userData, data.remember);
      
      if (getLoggedInUser) await getLoggedInUser();

      toast.success(<strong>Welcome back!</strong>, {
        description: `Logged in as ${userData.email}`,
      });

      // Role check debug
      console.log("User Role:", userData.role);
      handleRedirect(userData.role);
      
      router.refresh();
      
    } catch (error: any) {
      console.error("Login logical error:", error);
      const errorMsg = UserServices.parseError(error);
      toast.error(<strong>Login failed !!</strong>, { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4, controlHeight: 40 } }}>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f6fa] font-mukta p-4">
        <div className="w-full max-w-[400px] bg-white rounded shadow-lg border border-gray-100 overflow-hidden">
          <div className="pt-5 pb-6 px-8 text-center bg-white">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 shadow-sm" style={{ backgroundColor: `${primaryColor}10` }}>
              <Image src="/edify.png" alt="login icon" width={54} height={54} />
            </div>
            <h1 className="text-[24px] font-extrabold text-[#1e293b] tracking-tight">Welcome Back</h1>
            <p className="text-[12px] text-[#64748b] mt-1 font-medium">Please enter your credentials.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-3 pb-8 space-y-3">
              <Controller
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <ThemedInput label="Email" placeholder="admin12@gmail.com" required icon={<Mail size={14} />} type="text" className="h-8" {...field} />
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <div className="relative">
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <ThemedInput label="Password" placeholder="••••••••" required icon={<Lock size={14} />} type={showPass ? "text" : "password"} className="h-8 pr-10" {...field} />
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-[30px] text-gray-400 hover:text-blue-500 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-1">
                <Controller
                  control={form.control}
                  name="remember"
                  render={({ field: { value, onChange, ...field } }) => (
                    <Checkbox {...field} checked={value} onChange={(e) => onChange(e.target.checked)} className="text-[10px] font-semibold text-[#526484]">
                      Remember Me
                    </Checkbox>
                  )}
                />
                <Link href="/forgot-password" style={{ color: primaryColor }} className="text-[12px] font-semibold hover:underline italic">
                  Forgot Password?
                </Link>
              </div>

              <ThemedButton type="submit" disabled={isLoading} className="w-full h-9 mt-4 text-sm font-bold shadow-md flex items-center justify-center gap-2">
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</> : <><LogIn size={16} /> Login</>}
              </ThemedButton>

              <p className="text-center text-[12px] text-gray-400 mt-4">© {new Date().getFullYear()} School Management System.</p>
            </form>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
}