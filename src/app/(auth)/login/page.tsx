// "use client";

// import React, { useState } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { LoginDTO } from "../../../types/authType";
// import { Lock, User, Eye, EyeOff, LogIn, Loader2 } from "lucide-react"; // Mail को सट्टा User आइकन अझ राम्रो देखिन्छ
// import { useRouter } from "next/navigation";
// import { ConfigProvider, Checkbox } from "antd";
// import { Form, FormItem, FormMessage } from "@/components/ui/form";
// import { ThemedButton } from "@/components/ui/themedButton";
// import { ThemedInput } from "@/components/ui/ThemedInput";
// import { useTheme } from "@/lib/context/ThemeContext";
// import { toast } from "sonner";
// import axiosInstance from "../../../lib/config/axios.config";
// import useAuth from "@/lib/hooks/useAuth";
// import { clearAuthCookies, setAuthCookies } from "@/action/auth";

// import Link from "next/link";
// import Image from "next/image";
// import { UserServices } from "@/services/authServices";

// export default function LoginPage() {
//   const router = useRouter();
//   const { getLoggedInUser } = useAuth();
//   const { primaryColor } = useTheme();
//   const [showPass, setShowPass] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const form = useForm({
//     resolver: zodResolver(LoginDTO),
//     defaultValues: { username: "", password: "", remember: false },
//   });

//   const handleRedirect = (role: string) => {
//     const r = role?.toLowerCase();
//     const routes: Record<string, string> = {
//       "super admin": "/dashboard",
//       "admin": "/dashboard",
//       "staff": "/staff-dashboard",
//       "student": "/student-dashboard",
//       "teacher": "/teacher-dashboard",
//       "parent": "/parent-dashboard",
//     };

//     if (routes[r]) {
//       router.push(routes[r]);
//     } else {
//       toast.error(<strong>Unknown user role!</strong>, {
//         description: "Please contact support for access.",
//       });
//     }
//   };

//   const onSubmit = async (data: any) => {
//     setIsLoading(true);
//     try {
//       await clearAuthCookies();
      
//       const apiResponse = await UserServices.login(data);
      
//       console.log("Full API Response:", apiResponse);

//       const token = apiResponse.access || apiResponse.token; 
//       const userData = apiResponse.user;

//       if (!token) {
//         console.error("Token missing in response keys.");
//         throw new Error("Access token missing from backend response");
//       }

//       axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//       await setAuthCookies(token, userData, data.remember);
      
//       if (getLoggedInUser) await getLoggedInUser();

//       toast.success(<strong>Welcome back!</strong>, {
//         description: `Logged in successfully`,
//       });

//       console.log("User Role:", userData.role);
//       handleRedirect(userData.role);
//       router.refresh();
      
//     } catch (error: any) {
//       console.error("Login logical error:", error);
//       const errorMsg = UserServices.parseError(error);
//       toast.error(<strong>Login failed !!</strong>, { description: errorMsg });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <ConfigProvider theme={{ token: { colorPrimary: primaryColor, borderRadius: 4, controlHeight: 40 } }}>
//       <div className="bg-[#f5f6fa] p-4">
//       <div className="py-4 w-full flex items-center justify-center ">
//         <div className="w-full max-w-[400] bg-white rounded shadow-lg border border-gray-100 overflow-hidden">
//           <div className="pt-5 pb-6 px-8 text-center bg-white">
//             <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 shadow-sm" style={{ backgroundColor: `${primaryColor}10` }}>
//               <Image src="/edify.png" alt="login icon" width={54} height={54} />
//             </div>
//             <h1 className="text-[24px] font-extrabold text-[#1e293b] tracking-tight">Welcome Back</h1>
//             <p className="text-[12px] text-[#64748b] mt-1 font-medium">Please enter your credentials.</p>
//           </div>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="px-3 pb-8 space-y-3">
              
//               <Controller
//                 control={form.control}
//                 name="username"
//                 render={({ field }) => (
//                   <FormItem>
//                     <ThemedInput 
//                       label="Email or Phone Number" 
//                       placeholder="example@gmail.com or 98XXXXXXXX" 
//                       required 
//                       icon={<User size={14} />} 
//                       type="text" 
//                       className="h-8" 
//                       {...field} 
//                     />
//                     <FormMessage className="text-[11px]" />
//                   </FormItem>
//                 )}
//               />

//               <div className="relative">
//                 <Controller
//                   control={form.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <ThemedInput label="Password" placeholder="••••••••" required icon={<Lock size={14} />} type={showPass ? "text" : "password"} className="h-8 pr-10" {...field} />
//                       <FormMessage className="text-[11px]" />
//                     </FormItem>
//                   )}
//                 />
//                 <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-[30px] text-gray-400 hover:text-blue-500 transition-colors">
//                   {showPass ? <EyeOff size={14} /> : <Eye size={16} />}
//                 </button>
//               </div>

//               <div className="flex items-center justify-between mt-1">
//                 <Controller
//                   control={form.control}
//                   name="remember"
//                   render={({ field: { value, onChange, ...field } }) => (
//                     <Checkbox {...field} checked={value} onChange={(e) => onChange(e.target.checked)} className="text-[10px] font-semibold text-[#526484]">
//                       Remember Me
//                     </Checkbox>
//                   )}
//                 />
//                 <Link href="/forgot-password" style={{ color: primaryColor }} className="text-[12px] font-semibold hover:underline italic">
//                   Forgot Password?
//                 </Link>

                
//               </div>

//               <ThemedButton type="submit" disabled={isLoading} className="w-full h-9 mt-4 text-sm font-bold shadow-md flex items-center justify-center gap-2">
//                 {isLoading ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</> : <><LogIn size={16} /> Login</>}
//               </ThemedButton>

//               <p className="text-center text-[12px] text-gray-400 mt-4">© {new Date().getFullYear()} School Management System.</p>
//             </form>
//           </Form>
//         </div>
//       </div>
//       </div>
//     </ConfigProvider>
//   );
// }




"use client";

import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginDTO } from "../../../types/authType";
import { Lock, User, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
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

import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const router = useRouter();
  const { getLoggedInUser } = useAuth();
  const { primaryColor } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ─── reCAPTCHA v2 state ────────────────────────────────────────────────────
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string>("");
  // ──────────────────────────────────────────────────────────────────────────

  const form = useForm({
    resolver: zodResolver(LoginDTO),
    defaultValues: { username: "", password: "", remember: false },
  });

  const handleRedirect = (role: string) => {
    const r = role?.toLowerCase();
    const routes: Record<string, string> = {
      "super admin": "/dashboard",
      admin: "/dashboard",
      staff: "/staff-dashboard",
      student: "/student-dashboard",
      teacher: "/teacher-dashboard",
      parent: "/parent-dashboard",
    };

    if (routes[r]) {
      router.push(routes[r]);
    } else {
      toast.error(<strong>Unknown user role!</strong>, {
        description: "Please contact support for access.",
      });
    }
  };

  const onSubmit = async (data: any) => {
    // ─── CAPTCHA guard ─────────────────────────────────────────────────────
    if (!recaptchaToken) {
      setCaptchaError("Please check the 'I'm not a robot' box.");
      return;
    }
    setCaptchaError("");
    // ──────────────────────────────────────────────────────────────────────

    setIsLoading(true);
    try {
      await clearAuthCookies();

      const apiResponse = await UserServices.login({
        ...data,
        recaptchaToken, // send to backend for optional server-side verify
      });

      console.log("Full API Response:", apiResponse);

      const token = apiResponse.access || apiResponse.token;
      const userData = apiResponse.user;

      if (!token) {
        console.error("Token missing in response keys.");
        throw new Error("Access token missing from backend response");
      }

      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      await setAuthCookies(token, userData, data.remember);

      if (getLoggedInUser) await getLoggedInUser();

      toast.success(<strong>Welcome back!</strong>, {
        description: `Logged in successfully`,
      });

      console.log("User Role:", userData.role);
      handleRedirect(userData.role);
      router.refresh();
    } catch (error: any) {
      console.error("Login logical error:", error);
      const errorMsg = UserServices.parseError(error);
      toast.error(<strong>Login failed !!</strong>, { description: errorMsg });

      // Reset CAPTCHA after failed login so user must re-check
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
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
      <div>

        <div className="py-4 w-full flex items-center justify-center">
          <div className="w-full max-w-[400] bg-white rounded shadow-lg border border-gray-100 overflow-hidden">

            {/* ── Header ── */}
            <div className="pt-5 pb-6 px-8 text-center bg-white">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 shadow-sm"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <Image src="/edify.png" alt="login icon" width={54} height={54} />
              </div>
              <h1 className="text-[24px] font-extrabold text-[#1e293b] tracking-tight">
                Welcome Back
              </h1>
              <p className="text-[12px] text-[#64748b] mt-1 font-medium">
                Please enter your credentials.
              </p>
            </div>

            {/* ── Form ── */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="px-3 pb-8 space-y-3"
              >
                {/* Username */}
                <Controller
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <ThemedInput
                        label="Email or Phone Number"
                        placeholder="example@gmail.com or 98XXXXXXXX"
                        required
                        icon={<User size={14} />}
                        type="text"
                        className="h-8"
                        {...field}
                      />
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <div className="relative">
                  <Controller
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <ThemedInput
                          label="Password"
                          placeholder="••••••••"
                          required
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

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between mt-1">
                  <Controller
                    control={form.control}
                    name="remember"
                    render={({ field: { value, onChange, ...field } }) => (
                      <Checkbox
                        {...field}
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="text-[10px] font-semibold text-[#526484]"
                      >
                        Remember Me
                      </Checkbox>
                    )}
                  />
                  <Link
                    href="/forgot-password"
                    style={{ color: primaryColor }}
                    className="text-[12px] font-semibold hover:underline italic"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* ─── reCAPTCHA v2 Checkbox ────────────────────────────────── */}
                <div className="flex flex-col gap-1 pt-1">
                  <div style={{ width: "100%", overflow: "hidden", borderRadius: "4px" }}>
                    <div
                      style={{ width: "304px", transformOrigin: "left center" }}
                      ref={(el) => {
                        if (el) {
                          const parentWidth = el.parentElement?.offsetWidth ?? 304;
                          el.style.transform = `scaleX(${parentWidth / 304})`;
                        }
                      }}
                    >
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                        onChange={(token) => {
                          setRecaptchaToken(token);
                          if (token) setCaptchaError("");
                        }}
                        onExpired={() => {
                          setRecaptchaToken(null);
                          setCaptchaError("CAPTCHA expired — please verify again.");
                        }}
                        onErrored={() => {
                          setRecaptchaToken(null);
                          setCaptchaError("CAPTCHA error — please try again.");
                        }}
                      />
                    </div>
                  </div>
                  {captchaError && (
                    <p className="text-[11px] text-red-500 font-medium mt-0.5">
                      {captchaError}
                    </p>
                  )}
                </div>
                {/* ─────────────────────────────────────────────────────────── */}

                {/* Submit — disabled until CAPTCHA is checked */}
                <ThemedButton
                  type="submit"
                  disabled={isLoading || !recaptchaToken}
                  className="w-full h-9 mt-4 text-sm font-bold shadow-md flex items-center justify-center gap-2"
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

               <div className="mt-4 text-center">
                  {/* Copyright Text */}
                  <p className="text-[12px] text-gray-400">
                    © {new Date().getFullYear()} School Management System.
                  </p>
                  
                  {/* Go to Home Link */}
                  <Link 
                    href="/" 
                    className="text-[12px] text-[#2b98e1] hover:underline font-medium mt-1 block"
                  >
                    Go to Home
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}