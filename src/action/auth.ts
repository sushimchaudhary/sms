"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setAuthCookies(token: string, userData: object, remember: boolean) {
  const cookieStore = await cookies();
  
  // Next.js ma 'expires' ko thau ma 'maxAge' (seconds ma) use garnu dherai safe hunchha
  const maxAge = remember ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days OR 1 day

  // IMPORTANT: httpOnly lai FALSE garnu parchha yadi Axios interceptor (js-cookie) bata token tannu chha bhane
  cookieStore.set("auth_token", token, {
    maxAge: maxAge,
    sameSite: "strict",
    path: "/", 
    httpOnly: false, // <--- Yaslai false rakhnuhos natra Axios le bhetdaena
    secure: process.env.NODE_ENV === "production", 
  });

  cookieStore.set("user_info", JSON.stringify(userData), {
    maxAge: maxAge,
    sameSite: "strict",
    path: "/",
    httpOnly: false,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("user_info");
}

export async function logoutAction() {
  await clearAuthCookies();
  // Server action bhitra redirect garda error handling safe hunchha
  redirect("/login");
}