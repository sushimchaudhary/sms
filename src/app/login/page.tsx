"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ConfigProvider, Checkbox } from "antd";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { ThemedButton } from "@/components/ui/themedButton";
import { ThemedInput } from "@/components/ui/ThemedInput";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import axiosInstance from "../config/axios.config";

export default function LoginPage() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
     username : "",
      password: "",
      remember: false,
    },
  });



const onSubmit = async (data: any) => {
  setIsLoading(true);
  
  Cookies.remove("auth_token");
  delete axiosInstance.defaults.headers.common["Authorization"];

  try {
    const loginPayload = {
      username: data.username,
      password: data.password,
    };

    const response = await axiosInstance.post("/auth/login", loginPayload);
    
    const token = response.data.data; 

    Cookies.set("auth_token", token, { expires: 1 });

    const userDetail = await axiosInstance.get("/auth/me");

    Cookies.set("user_info", JSON.stringify(userDetail.data));
   toast.success(<strong>Welcome to user panel !!</strong>, {
      description: "You will access all features from here",
    });
    router.push("/dashboard");

  } catch (exception: any) {
    console.log("Login Error Detail:", exception.response?.data);
   toast.error(<strong>Login failed !!</strong>, {
      description:"Please check your credentials and try again.",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor,
          borderRadius: 4,
          controlHeight: 40,
        },
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f6fa] font-mukta p-4">
        <div className="w-full max-w-[400px] bg-white rounded shadow-lg border border-gray-100 overflow-hidden">
          <div className="pt-5 pb-6 px-8 text-center bg-white">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 shadow-sm"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <ShieldCheck size={32} style={{ color: primaryColor }} />
            </div>
            <h1 className="text-[24px] font-extrabold text-[#1e293b] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-[12px] text-[#64748b] mt-1 font-medium">
              Please enter your credentials to access your pharmacy dashboard.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-3 pb-8 space-y-3"
            >
              <Controller
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <ThemedInput
                      label="Username"
                      placeholder="admin@pharma.com"
                      icon={<Mail size={14} />}
                      type="text"
                      className="h-8"
                      {...field}
                    />
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <div className="relative">
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <ThemedInput
                        label="Password"
                        placeholder="••••••••"
                        icon={<Lock size={14} />}
                        type={showPass ? "text" : "password"}
                        className="h-8 pr-10"
                        {...field}
                      />
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-[30px] text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-1">
                <Controller
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      className="text-[10px] font-semibold text-[#526484]"
                    >
                      Remember Me
                    </Checkbox>
                  )}
                />
                <button
                  type="button"
                  className="text-[12px] font-bold hover:underline transition-all"
                  style={{ color: primaryColor }}
                >
                  Forgot Password?
                </button>
              </div>

            
              <ThemedButton
                type="submit"
                disabled={isLoading} 
                className="w-full h-9 mt-6 text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={16} /> Login
                  </>
                )}
              </ThemedButton>

              <p className="text-center text-[12px] text-gray-400 mt-4">
                © {new Date().getFullYear()} WebPharma System. All rights
                reserved.
              </p>
            </form>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
}
