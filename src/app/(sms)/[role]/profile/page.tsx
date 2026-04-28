import TeacherProfilePage from "../../teacher/profile/page";



export default function ProfilePage({ params }: { params: { role: string } }) {
  switch (params.role) {
    case "teacher":  return <TeacherProfilePage />;
    // case "student":  return <StudentProfilePage />;
    // case "parent":   return <ParentProfilePage />;
    // case "staff":    return <StaffProfilePage />;
    // case "admin":    return <AdminProfilePage />;
    default:         return <div>Profile not found</div>;
  }
}