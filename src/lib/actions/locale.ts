"use server";

import { cookies } from "next/headers";

export async function setLocaleAction(locale: "en" | "ne") {
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}