// import { redirect } from "next/navigation";
// import { cookies } from "next/headers";

// export default async function Home() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("auth_token")?.value;

//   if (token) {
//     redirect("/dashboard");
//   } else {
//     redirect("/login");
//   }
// }

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const userInfoRaw = cookieStore.get("user_info")?.value;

  if (token && userInfoRaw) {
    try {
      const userData = JSON.parse(userInfoRaw);
      const userRole = userData.role?.toLowerCase();

      // Role अनुसार रिडाइरेक्ट लजिक
      if (userRole === "super admin" || userRole === "admin") {
        redirect("/dashboard");
      } else if (userRole === "staff") {
        redirect("/staff-dashboard");
      } else if (userRole === "student") {
        redirect("/student-dashboard");
      } else if (userRole === "teacher") {
        redirect("/teacher-dashboard");
      } else if (userRole === "parent") {
        redirect("/parent-dashboard");
      } else {
        redirect("/login");
      }
    } catch (e) {
      redirect("/login");
    }
  } else {
    redirect("/login");
  }
}