"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  X,
  LayoutDashboard,
  User,
  School,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Users,
  BookOpen,
  UserPlus,
  CalendarClock,
  Users2,
  ShieldCheck,
  Layers,
  LayoutGrid,
  BookMarked,
  ClipboardCheck,
  WalletCards,
  Banknote,
  Tag,
  Receipt,
  CalendarDays,
  MessageSquareWarning,
  UserCheck,
  CalendarCheck,
  Bell,
  Calendar,
} from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { SchoolServices } from "@/services/schoolServices";
import cookies from "js-cookie";

// ── Base URL + resolvePhoto ───────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type SubMenuItem = {
  labelKey: string;
  href: string;
  icon: React.ElementType;
};

type MenuItem = {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  submenu?: SubMenuItem[];
};

export type SidebarStyle = "light" | "dark" | "white" | "theme";
export type MenuColor = "light" | "dark" | "brand";
export type SidebarSize = "default" | "condensed" | "hover" | "compact" | "full" | "fullscreen";

interface SidebarNavProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarStyle: SidebarStyle;
  menuColor: MenuColor;
  sidebarSize: SidebarSize;
  setSidebarSize: (size: SidebarSize) => void;
  activeColor: string;
  layoutMode: "fluid" | "boxed" | "detached";
}

// ── Role-based menu definitions ───────────────────────────────────────────────
const SUPERADMIN_MENU: MenuItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/dashboard" },
  { icon: School,          labelKey: "nav.school",    href: "/school" },
  { icon: User,            labelKey: "nav.user",      href: "/user-management" },   { icon: Calendar, labelKey: "nav.academicCalendar", href: "/academic-calendar" },
  { icon: Calendar, labelKey: "nav.academicCalendar", href: "/academic-calendar" },

];

const SCHOOL_ADMIN_MENU: MenuItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard",       href: "/dashboard" },
  { icon: CalendarClock,   labelKey: "nav.academicSession",  href: "/sessions" },
   {
    icon: GraduationCap,
    labelKey: "nav.academics",
    href: "#",
    submenu: [
      { labelKey: "nav.class",             href: "/class",           icon: Layers },
      { labelKey: "nav.section",           href: "/section",         icon: LayoutGrid },
      { labelKey: "nav.subject",           href: "/subject",         icon: BookMarked },
      { labelKey: "nav.teacherAssignment", href: "/teacher-subject", icon: ClipboardCheck },
    ],
  },
  {
    icon: Users2,
    labelKey: "nav.userManagement",
    href: "/school",
    submenu: [
      { labelKey: "nav.teachers",     href: "/teacher",       icon: GraduationCap },
      { labelKey: "nav.staffMembers", href: "/staff",         icon: ShieldCheck },
      { labelKey: "nav.parents",      href: "/parent",        icon: Users },
      { labelKey: "nav.students",     href: "/student",       icon: BookOpen },
    ],
  },
 
  { icon: UserPlus, labelKey: "nav.enrollment", href: "/student-enrollment" },
    { icon: UserPlus, labelKey: "nav.admissions", href: "/student-admissions" },
   {
    icon: CalendarCheck,
    labelKey: "nav.attendance",
    href: "#",
    submenu: [
      { labelKey: "nav.staffAttendance",   href: "/attendance/staff-attendance",   icon: UserCheck },
      { labelKey: "nav.studentAttendance", href: "/attendance/student-attendance", icon: GraduationCap },
    ],
  },
  {
    icon: WalletCards,
    labelKey: "nav.accounts",
    href: "#",
    submenu: [
      { labelKey: "nav.feeTypes",          href: "/fee-type",        icon: Tag },
      { labelKey: "nav.feeStructure",      href: "/fee-structure",   icon: Banknote },
      { labelKey: "nav.studentFee",        href: "/student-fee",     icon: WalletCards },
      { labelKey: "nav.paymentRecords",    href: "/payment-record",  icon: ClipboardCheck },
      { labelKey: "nav.expenseManagement", href: "/expense",         icon: Receipt },
    ],
  },
  {
    icon: BookMarked,
    labelKey: "nav.notesHomework",
    href: "#",
    submenu: [
      { labelKey: "nav.homeWorks", href: "/homework", icon: Tag },
      { labelKey: "nav.notes",     href: "/notes",    icon: BookOpen },
    ],
  },

   {
  icon: CalendarDays, 
  labelKey: "nav.leaveManagement", 
  href: "#",
  submenu: [
    { 
      labelKey: "nav.leaveAllocation", 
      href: "/leave-allocation", 
      icon: User 
    },
    { 
      labelKey: "nav.leaveApplication", 
      href: "/leave-application", 
      icon: CalendarDays 
    },
    
  ],
},
{ icon: Calendar, labelKey: "nav.academicCalendar", href: "/academic-calendar" },

  {
    icon: Bell,
    labelKey: "nav.notifications",
    href: "#",
    submenu: [
      { labelKey: "nav.allNotifications", href: "/notification", icon: Bell },
      { labelKey: "nav.complaints",       href: "/complaint",    icon: MessageSquareWarning },
    ],
  },
 
];

const TEACHER_MENU: MenuItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard",       href: "/teacher-dashboard" },
  {
    icon: CalendarCheck,
    labelKey: "nav.attendance",
    href: "#",
    submenu: [
      { labelKey: "nav.staffAttendance",   href: "/attendance/staff-attendance",   icon: UserCheck },
      { labelKey: "nav.studentAttendance", href: "/attendance/student-attendance", icon: GraduationCap },
    ],
  },
  
  { icon: CalendarDays, labelKey: "nav.leaveApplication", href: "/leave-application" },
     { icon: Calendar, labelKey: "nav.academicCalendar", href: "/academic-calendar" },

  {
    icon: BookMarked,
    labelKey: "nav.notesHomework",
    href: "#",
    submenu: [
      { labelKey: "nav.homeWorks", href: "/homework", icon: Tag },
      { labelKey: "nav.notes",     href: "/notes",    icon: BookOpen },
    ],
  },
  {
    icon: Bell,
    labelKey: "nav.notifications",
    href: "#",
    submenu: [
      { labelKey: "nav.allNotifications", href: "/notification", icon: Bell },
      { labelKey: "nav.complaints",       href: "/complaint",    icon: MessageSquareWarning },
    ],
  },
];

const STUDENT_MENU: MenuItem[] = [
  { icon: LayoutDashboard,       labelKey: "nav.dashboard",        href: "/student-dashboard" },
  {
    icon: BookMarked,
    labelKey: "nav.notesHomework",
    href: "#",
    submenu: [
      { labelKey: "nav.homeWorks", href: "/homework", icon: Tag },
      { labelKey: "nav.notes",     href: "/notes",    icon: BookOpen },
    ],
  },

  { icon: CalendarDays,          labelKey: "nav.leaveApplication", href: "/leave-application" },
     { icon: Calendar, labelKey: "nav.academicCalendar", href: "/academic-calendar" },

  { icon: MessageSquareWarning,  labelKey: "nav.complaints",       href: "/complaint" },
  { icon: Bell,                  labelKey: "nav.notifications",    href: "/notification" },
];

const PARENT_MENU: MenuItem[] = [
  { icon: LayoutDashboard,      labelKey: "nav.dashboard",     href: "/parent-dashboard" },
  { icon: MessageSquareWarning, labelKey: "nav.complaints",    href: "/complaint" },
  { icon: Bell,                 labelKey: "nav.notifications", href: "/notification" },
     { icon: Calendar, labelKey: "nav.academicCalendar", href: "/academic-calendar" },

];

const STAFF_MENU: MenuItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard",  href: "/staff-dashboard" },
  { icon: CalendarCheck,   labelKey: "nav.attendance", href: "/attendance/staff-attendance" },
  {
    icon: WalletCards,
    labelKey: "nav.accounts",
    href: "#",
    submenu: [
      { labelKey: "nav.feeTypes",          href: "/fee-type",       icon: Tag },
      { labelKey: "nav.feeStructure",      href: "/fee-structure",  icon: Banknote },
      { labelKey: "nav.studentFee",        href: "/student-fee",    icon: WalletCards },
      { labelKey: "nav.paymentRecords",    href: "/payment-record", icon: ClipboardCheck },
      { labelKey: "nav.expenseManagement", href: "/expense",        icon: Receipt },
    ],
  },
  { icon: CalendarDays,         labelKey: "nav.leaveApplication", href: "/leave-application" },
     { icon: Calendar, labelKey: "nav.academicCalendar", href: "/academic-calendar" },

  { icon: MessageSquareWarning, labelKey: "nav.complaints",       href: "/complaint" },
  { icon: Bell,                 labelKey: "nav.notifications",    href: "/notification" },
];

function getMenuByRole(role: string | undefined): MenuItem[] {
  switch (role) {
    case "superadmin": return SUPERADMIN_MENU;
    case "admin":      return SCHOOL_ADMIN_MENU;
    case "teacher":    return TEACHER_MENU;
    case "student":    return STUDENT_MENU;
    case "parent":     return PARENT_MENU;
    case "staff":      return STAFF_MENU;
    default:           return SCHOOL_ADMIN_MENU;
  }
}

// ── SidebarNav Component ───────────────────────────────────────────────────────
export default function SidebarNav({
  sidebarOpen,
  setSidebarOpen,
  sidebarStyle,
  menuColor,
  sidebarSize,
  setSidebarSize,
  activeColor,
  layoutMode,
}: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations();
  const role = user?.role;

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [schoolName, setSchoolName] = useState<string>("");
  const [schoolLogo, setSchoolLogo] = useState<string>("");

  // ── Fetch school data ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSchoolData = async () => {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const schoolId =
        user?.school_id || user?.school ||
        cookieUser?.school_id || cookieUser?.school;

      if (!schoolId) return;

      try {
        const res = await SchoolServices.getSingleSchool(schoolId);
        const data = res?.data || res;
        setSchoolName(data?.name || data?.school_name || "");
        setSchoolLogo(resolvePhoto(data?.logo_url || data?.logo || ""));
      } catch {}
    };

    if (role && role !== "superadmin") fetchSchoolData();
  }, [user?.school_id, user?.school, role]);

  // ── Auto-open submenu if current path matches ─────────────────────────────
  useEffect(() => {
    const menuItems = getMenuByRole(role);
    menuItems.forEach((item) => {
      if (item.submenu) {
        const hasActiveChild = item.submenu.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
        );
        if (hasActiveChild) {
          setOpenSubmenus((prev) => ({ ...prev, [item.labelKey]: true }));
        }
      }
    });
  }, [pathname, role]);

  const toggleSubmenu = (labelKey: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

  // ── Style helpers ─────────────────────────────────────────────────────────
  const isDarkSidebar = menuColor !== "light" || sidebarStyle !== "white";

  const getSidebarClass = () => {
    if (menuColor === "dark")  return "bg-[#1e293b] text-slate-300";
    if (menuColor === "brand") return "text-white";
    if (sidebarStyle === "white") return "bg-white text-slate-700 border-r border-gray-200";
    if (sidebarStyle === "light") return "bg-[#192a3e] text-slate-300";
    if (sidebarStyle === "dark")  return "bg-slate-950 text-slate-300";
    return "text-white";
  };

  const getSidebarInlineStyle = (): React.CSSProperties => {
    if (menuColor === "brand") return { backgroundColor: activeColor };
    if (menuColor !== "light") return {};
    return sidebarStyle === "theme" ? { backgroundColor: activeColor } : {};
  };

  const getSidebarWidth = () => {
    if (!sidebarOpen || sidebarSize === "condensed") return "w-[58px]";
    if (sidebarSize === "hover")    return "w-[58px]";
    if (sidebarSize === "compact")  return "w-[160px]";
    if (sidebarSize === "full")     return "w-[280px]";
    if (sidebarSize === "fullscreen") return "w-screen";
    return "w-[220px]";
  };

  const showLabels = sidebarOpen && sidebarSize !== "condensed" && sidebarSize !== "hover";

  // ── School logo / fallback ────────────────────────────────────────────────
  const SchoolLogoOrFallback = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const isCollapsed = !showLabels;
    const dim = (size === "md" || isCollapsed) ? "w-11 h-11" : "w-17 h-17";

    if (schoolLogo) {
      return (
        <img
          src={schoolLogo}
          alt={schoolName || "School Logo"}
          className={`${dim} aspect-square object-cover flex-shrink-0 rounded-full bg-white border border-gray-200/50 p-0.5`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      );
    }
    return (
      <div className={`${dim} grid grid-cols-2 gap-0.5 flex-shrink-0 rounded-full overflow-hidden bg-white/20 p-1`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/80 rounded-sm" />
        ))}
      </div>
    );
  };
  // ── Render nav items ──────────────────────────────────────────────────────
  const menuItems: MenuItem[] = getMenuByRole(role);

  const renderNavItems = (items: MenuItem[]) =>
    items.map((item) => {
      const label = t(item.labelKey);
      const isActive =
        item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname === item.href || pathname.startsWith(item.href + "/");
      const hasSubmenu = !!item.submenu?.length;
      const isSubmenuOpen = openSubmenus[item.labelKey] ?? false;

      return (
        <div key={item.labelKey}>
          {hasSubmenu ? (
            <>
              <div
                onClick={() => toggleSubmenu(item.labelKey)}
                className={`flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors mx-3 rounded my-0.5 ${
                  isActive
                    ? "bg-white/20 text-white font-semibold"
                    : isDarkSidebar
                      ? "text-slate-200 hover:text-white hover:bg-white/10"
                      : "text-slate-400 hover:text-slate-800 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon
                    size={16}
                    className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`}
                  />
                  {showLabels && (
                    <span className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}>
                      {label}
                    </span>
                  )}
                </div>
                {showLabels && (
                  <span className="flex-shrink-0">
                    {isSubmenuOpen
                      ? <ChevronDown size={13} className="text-slate-400" />
                      : <ChevronRight size={13} className="text-slate-400" />
                    }
                  </span>
                )}
              </div>

              {isSubmenuOpen && showLabels && (
                <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
                  {item.submenu!.map((sub) => {
                    const subLabel = t(sub.labelKey);
                    const isSubActive =
                      pathname === sub.href || pathname.startsWith(sub.href + "/");
                    return (
                      <Link href={sub.href} key={sub.labelKey}>
                        <div
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-sm cursor-pointer transition-colors mx-1 ${
                            isSubActive
                              ? "bg-white/20 text-white font-semibold"
                              : isDarkSidebar
                                ? "text-slate-300 hover:text-white hover:bg-white/10"
                                : "text-slate-500 hover:text-slate-800 hover:bg-gray-100"
                          }`}
                        >
                          <sub.icon
                            size={13}
                            className={`flex-shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                          />
                          <span className="truncate">{subLabel}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Link href={item.href}>
              <div
                className={`flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors mx-3 rounded my-0.5 ${
                  isActive
                    ? "bg-white/20 text-white font-semibold"
                    : isDarkSidebar
                      ? "text-slate-200 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-800 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon
                    size={16}
                    className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`}
                  />
                  {showLabels && (
                    <span className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}>
                      {label}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      );
    });

  return (
    <aside
      className={`${getSidebarWidth()} flex-shrink-0 transition-all duration-300 flex flex-col z-40 ${getSidebarClass()} ${
        layoutMode === "detached" ? "rounded-xl mt-[60px] mb-2 ml-0 overflow-hidden" : ""
      } ${sidebarSize === "hover" ? "group relative" : ""} ${
        sidebarSize === "fullscreen" ? "absolute inset-0 z-50" : ""
      }`}
      style={getSidebarInlineStyle()}
    >
      {/* Hover-expand overlay */}
      {sidebarSize === "hover" && (
        <div
          className={`absolute left-full top-0 h-full w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 flex flex-col ${getSidebarClass()} shadow-xl`}
          style={getSidebarInlineStyle()}
        >
          <div className={`h-14 flex items-center px-4 gap-3 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
            <SchoolLogoOrFallback size="sm" />
            <span className="text-sm font-bold text-white tracking-wide truncate">
              {schoolName || t("nav.dashboard")}
            </span>
          </div>
          <nav className="flex-1 py-3 overflow-y-auto">
            {menuItems.map((item) => {
              const label = t(item.labelKey);
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link href={item.href} key={item.labelKey + "-hover"}>
                  <div
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors mx-2 rounded-md my-0.5 ${
                      isActive
                        ? "bg-white/20 text-white font-semibold"
                        : isDarkSidebar
                          ? "text-slate-200 hover:text-white"
                          : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <item.icon size={15} className="flex-shrink-0 text-slate-300" />
                    <span className="text-sm truncate">{label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

     {/* Logo area */}
      <div className={`p-2 flex flex-col items-center justify-center gap-2 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
        <div className="flex justify-center items-center w-full min-h-[40px]">
          <SchoolLogoOrFallback />
        </div>
        {sidebarSize === "fullscreen" && (
          <button
            onClick={() => setSidebarSize("default")}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2.5 overflow-y-auto overflow-x-hidden">
        {renderNavItems(menuItems)}
      </nav>
    </aside>
  );
}