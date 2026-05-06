"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setAuthCookies(token: string, userData: object, remember: boolean) {
  const cookieStore = await cookies();
  
  const maxAge = remember ? 7 * 24 * 60 * 60 : 24 * 60 * 60;

  cookieStore.set("auth_token", token, {
    maxAge: maxAge,
    sameSite: "lax",
    path: "/", 
    httpOnly: false, 
    secure: process.env.NODE_ENV === "production", 
  });

  cookieStore.set("user_info", JSON.stringify(userData), {
    maxAge: maxAge,
    sameSite: "lax",
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", { path: "/", maxAge: 0 });
  cookieStore.set("user_info", "", { path: "/", maxAge: 0 });
}

export async function logoutAction() {
  await clearAuthCookies();

  redirect("/login");
}