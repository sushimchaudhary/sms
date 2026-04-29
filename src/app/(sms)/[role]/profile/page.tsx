import AdminProfilePage from "../../admin/profile/page";
import StudentProfilePage from "../../student/profile/page";
import TeacherProfilePage from "../../teacher/profile/page";



export default function ProfilePage({ params }: { params: { role: string } }) {
  switch (params.role) {
    case "teacher":  return <TeacherProfilePage />;
    case "student":  return <StudentProfilePage />;
    // case "parent":   return <ParentProfile />;
    // case "staff":    return <StaffProfilePage />;
    case "admin":    return <AdminProfilePage />;
    default:         return <div>Profile not found</div>;
  }
}