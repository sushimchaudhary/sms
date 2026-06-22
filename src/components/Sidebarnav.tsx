"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  File,
  LayoutTemplate,
  FileText,
  ClipboardList,
} from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { SchoolServices } from "@/services/schoolServices";
import cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
}

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

// ── NEW: group type ───────────────────────────────────────────────────────────
type MenuGroup = {
  groupKey: string;   // e.g. "main", "operations", "finance", "communication"
  items: MenuItem[];
};

export type SidebarStyle = "light" | "dark" | "white" | "theme";
export type MenuColor = "light" | "dark" | "brand";
export type SidebarSize =
  | "default"
  | "condensed"
  | "hover"
  | "compact"
  | "full"
  | "fullscreen";

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

// ── Role-based GROUPED menu definitions ──────────────────────────────────────

const SUPERADMIN_GROUPS: MenuGroup[] = [
  {
    groupKey: "main",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard", href: "/dashboard" },
      { icon: School,          labelKey: "school",    href: "/school" },
      { icon: User,            labelKey: "user",      href: "/user-management" },
      { icon: Calendar,        labelKey: "academicCalendar", href: "/academic-calendar" },
    ],
  },
];

const SCHOOL_ADMIN_GROUPS: MenuGroup[] = [
  {
    groupKey: "main",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard",      href: "/dashboard" },
      { icon: CalendarClock,   labelKey: "academicSession", href: "/sessions" },
      {
        icon: GraduationCap,
        labelKey: "academics",
        href: "#",
        submenu: [
          { labelKey: "class",             href: "/class",           icon: Layers },
          { labelKey: "section",           href: "/section",         icon: LayoutGrid },
          { labelKey: "subject",           href: "/subject",         icon: BookMarked },
          { labelKey: "teacherAssignment", href: "/teacher-subject", icon: ClipboardCheck },
        ],
      },
      {
        icon: Users2,
        labelKey: "userManagement",
        href: "/school",
        submenu: [
          { labelKey: "teachers",     href: "/teacher", icon: GraduationCap },
          { labelKey: "staffMembers", href: "/staff",   icon: ShieldCheck },
          { labelKey: "parents",      href: "/parent",  icon: Users },
          { labelKey: "students",     href: "/student", icon: BookOpen },
        ],
      },
    ],
  },
  {
    groupKey: "operations",
    items: [
      { icon: UserPlus,    labelKey: "enrollment", href: "/student-enrollment" },
      { icon: UserPlus,    labelKey: "admissions", href: "/student-admissions" },
      {
        icon: CalendarCheck,
        labelKey: "attendance",
        href: "#",
        submenu: [
          { labelKey: "staffAttendance",   href: "/attendance/staff-attendance",   icon: UserCheck },
          { labelKey: "studentAttendance", href: "/attendance/student-attendance", icon: GraduationCap },
        ],
      },
     
      {
        icon: CalendarDays,
        labelKey: "leaveManagement",
        href: "#",
        submenu: [
          { labelKey: "leaveAllocation",  href: "/leave-allocation",  icon: User },
          { labelKey: "leaveApplication", href: "/leave-application", icon: CalendarDays },
        ],
      },

       {
  icon: BookOpen, // मुख्य मेनुको लागि
  labelKey: "questionPaperManagement",
  href: "#",
  submenu: [
    { labelKey: "questionPaper", href: "/paper-template", icon: LayoutTemplate },
    { labelKey: "questionSection", href: "/question-section", icon: Layers },
    { labelKey: "question", href: "/question-paper", icon: FileText },
    { labelKey: "allinone", href: "/all-in-one-paper", icon: ClipboardList },
  ],
},
    ],
  },
  {
    groupKey: "finance",
    items: [
      {
        icon: WalletCards,
        labelKey: "accounts",
        href: "#",
        submenu: [
          { labelKey: "feeTypes",          href: "/fee-type",       icon: Tag },
          { labelKey: "feeStructure",      href: "/fee-structure",  icon: Banknote },
          { labelKey: "studentFee",        href: "/student-fee",    icon: WalletCards },
          { labelKey: "paymentRecords",    href: "/payment-record", icon: ClipboardCheck },
          { labelKey: "expenseManagement", href: "/expense",        icon: Receipt },
        ],
      },
    ],
  },
  {
    groupKey: "communication",
    items: [
            { icon: Calendar, labelKey: "academicCalendar", href: "/academic-calendar" },

      {
        icon: BookMarked,
        labelKey: "notesHomework",
        href: "#",
        submenu: [
          { labelKey: "homeWorks", href: "/homework", icon: Tag },
          { labelKey: "notes",     href: "/notes",    icon: BookOpen },
        ],
      },
      {
        icon: Bell,
        labelKey: "notifications",
        href: "#",
        submenu: [
          { labelKey: "allNotifications", href: "/notification", icon: Bell },
          { labelKey: "complaints",       href: "/complaint",    icon: MessageSquareWarning },
        ],
      },
    ],
  },
];

const TEACHER_GROUPS: MenuGroup[] = [
  {
    groupKey: "main",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard", href: "/teacher-dashboard" },
    ],
  },
  {
    groupKey: "operations",
    items: [
      {
        icon: CalendarCheck,
        labelKey: "attendance",
        href: "#",
        submenu: [
          { labelKey: "staffAttendance",   href: "/attendance/staff-attendance",   icon: UserCheck },
          { labelKey: "studentAttendance", href: "/attendance/student-attendance", icon: GraduationCap },
        ],
      },
      {
  icon: BookOpen, // मुख्य मेनुको लागि
  labelKey: "questionPaperManagement",
  href: "#",
  submenu: [
    { labelKey: "questionPaper", href: "/paper-template", icon: LayoutTemplate },
    { labelKey: "questionSection", href: "/question-section", icon: Layers },
    { labelKey: "question", href: "/question-paper", icon: FileText },
    { labelKey: "allinone", href: "/all-in-one-paper", icon: ClipboardList },
  ],
},
      { icon: CalendarDays, labelKey: "leaveApplication", href: "/leave-application" },
      { icon: Calendar,     labelKey: "academicCalendar", href: "/academic-calendar" },
    ],
  },
  {
    groupKey: "communication",
    items: [
      {
        icon: BookMarked,
        labelKey: "notesHomework",
        href: "#",
        submenu: [
          { labelKey: "homeWorks", href: "/homework", icon: Tag },
          { labelKey: "notes",     href: "/notes",    icon: BookOpen },
        ],
      },
      {
        icon: Bell,
        labelKey: "notifications",
        href: "#",
        submenu: [
          { labelKey: "allNotifications", href: "/notification", icon: Bell },
          { labelKey: "complaints",       href: "/complaint",    icon: MessageSquareWarning },
        ],
      },
    ],
  },
];

const STUDENT_GROUPS: MenuGroup[] = [
  {
    groupKey: "main",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard", href: "/student-dashboard" },
    ],
  },
  {
    groupKey: "operations",
    items: [
      { icon: CalendarDays,         labelKey: "leaveApplication", href: "/leave-application" },
      { icon: Calendar,             labelKey: "academicCalendar", href: "/academic-calendar" },
    ],
  },
  {
    groupKey: "communication",
    items: [
      {
        icon: BookMarked,
        labelKey: "notesHomework",
        href: "#",
        submenu: [
          { labelKey: "homeWorks", href: "/homework", icon: Tag },
          { labelKey: "notes",     href: "/notes",    icon: BookOpen },
        ],
      },
      { icon: MessageSquareWarning, labelKey: "complaints",    href: "/complaint" },
      { icon: Bell,                 labelKey: "notifications", href: "/notification" },
    ],
  },
];

const PARENT_GROUPS: MenuGroup[] = [
  {
    groupKey: "main",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard", href: "/parent-dashboard" },
      { icon: Calendar,        labelKey: "academicCalendar", href: "/academic-calendar" },
    ],
  },
  {
    groupKey: "communication",
    items: [
      { icon: MessageSquareWarning, labelKey: "complaints",    href: "/complaint" },
      { icon: Bell,                 labelKey: "notifications", href: "/notification" },
    ],
  },
];

const STAFF_GROUPS: MenuGroup[] = [
  {
    groupKey: "main",
    items: [
      { icon: LayoutDashboard, labelKey: "dashboard",  href: "/staff-dashboard" },
      { icon: CalendarCheck,   labelKey: "attendance", href: "/attendance/staff-attendance" },
    ],
  },
  {
    groupKey: "operations",
    items: [
      { icon: CalendarDays, labelKey: "leaveApplication", href: "/leave-application" },
      { icon: Calendar,     labelKey: "academicCalendar", href: "/academic-calendar" },
    ],
  },
  {
    groupKey: "finance",
    items: [
      {
        icon: WalletCards,
        labelKey: "accounts",
        href: "#",
        submenu: [
          { labelKey: "feeTypes",          href: "/fee-type",       icon: Tag },
          { labelKey: "feeStructure",      href: "/fee-structure",  icon: Banknote },
          { labelKey: "studentFee",        href: "/student-fee",    icon: WalletCards },
          { labelKey: "paymentRecords",    href: "/payment-record", icon: ClipboardCheck },
          { labelKey: "expenseManagement", href: "/expense",        icon: Receipt },
        ],
      },
    ],
  },
  {
    groupKey: "communication",
    items: [
      { icon: MessageSquareWarning, labelKey: "complaints",    href: "/complaint" },
      { icon: Bell,                 labelKey: "notifications", href: "/notification" },
    ],
  },
];

function getGroupsByRole(role: string | undefined): MenuGroup[] {
  switch (role) {
    case "superadmin": return SUPERADMIN_GROUPS;
    case "admin":      return SCHOOL_ADMIN_GROUPS;
    case "teacher":    return TEACHER_GROUPS;
    case "student":    return STUDENT_GROUPS;
    case "parent":     return PARENT_GROUPS;
    case "staff":      return STAFF_GROUPS;
    default:           return SCHOOL_ADMIN_GROUPS;
  }
}

// ── Group label display map ───────────────────────────────────────────────────
const GROUP_LABELS: Record<string, string> = {
  main:          "Main",
  operations:    "Operations",
  finance:       "Finance",
  communication: "Communication",
};

// ── SidebarNav Component ──────────────────────────────────────────────────────
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
  // const t = useTranslations();
  const role = user?.role;

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [schoolName, setSchoolName]     = useState<string>("");
  const [schoolLogo, setSchoolLogo]     = useState<string>("");

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
        const res  = await SchoolServices.getSingleSchool(schoolId);
        const data = res?.data || res;
        setSchoolName(data?.name || data?.school_name || "");
        setSchoolLogo(resolvePhoto(data?.logo_url || data?.logo || ""));
      } catch {}
    };
    if (role && role !== "superadmin") fetchSchoolData();
  }, [user?.school_id, user?.school, role]);

  // ── Auto-open submenu on path match ──────────────────────────────────────
  useEffect(() => {
    const groups = getGroupsByRole(role);
    groups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.submenu) {
          const hasActiveChild = item.submenu.some(
            (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
          );
          if (hasActiveChild) {
            setOpenSubmenus((prev) => ({ ...prev, [item.labelKey]: true }));
          }
        }
      });
    });
  }, [pathname, role]);

  const toggleSubmenu = (labelKey: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

  // ── Style helpers ─────────────────────────────────────────────────────────
  const isDarkSidebar = menuColor !== "light" || sidebarStyle !== "white";

  const getSidebarClass = () => {
    if (menuColor === "dark")     return "bg-[#1e293b] text-slate-300";
    if (menuColor === "brand")    return "text-white";
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
    if (sidebarSize === "hover")      return "w-[58px]";
    if (sidebarSize === "compact")    return "w-[160px]";
    if (sidebarSize === "full")       return "w-[280px]";
    if (sidebarSize === "fullscreen") return "w-screen";
    return "w-[220px]";
  };

  const showLabels =
    sidebarOpen &&
    sidebarSize !== "condensed" &&
    sidebarSize !== "hover";

  const scrollbarStyle: React.CSSProperties = {
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,255,255,0.15) transparent",
  };

  // ── School logo / fallback ────────────────────────────────────────────────
  const SchoolLogoOrFallback = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const isCollapsed = !showLabels;
    const dim = size === "md" || isCollapsed ? "w-11 h-11" : "w-17 h-17";
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

  // ── Render a single menu item (shared between grouped and hover views) ────
  const renderItem = (item: MenuItem, hoverMode = false) => {
    const label = (item.labelKey);
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(item.href + "/");
    const hasSubmenu   = !!item.submenu?.length;
    const isSubOpen    = openSubmenus[item.labelKey] ?? false;
    const labelsOn     = hoverMode ? true : showLabels;

    if (hasSubmenu) {
      return (
        <div key={item.labelKey}>
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
              {labelsOn && (
                <span className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}>
                  {label}
                </span>
              )}
            </div>
            {labelsOn && (
              <span className="flex-shrink-0">
                {isSubOpen
                  ? <ChevronDown size={13} className="text-slate-400" />
                  : <ChevronRight size={13} className="text-slate-400" />}
              </span>
            )}
          </div>

          {isSubOpen && labelsOn && (
            <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
              {item.submenu!.map((sub) => {
                const subLabel   = (sub.labelKey);
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
        </div>
      );
    }

    return (
      <Link href={item.href} key={item.labelKey}>
        <div
          className={`flex items-center gap-3 px-2 py-1.5 cursor-pointer transition-colors mx-3 rounded my-0.5 ${
            isActive
              ? "bg-white/20 text-white font-semibold"
              : isDarkSidebar
              ? "text-slate-50 hover:text-white hover:bg-white/10"
              : "text-slate-600 hover:text-slate-800 hover:bg-gray-100"
          }`}
        >
          <item.icon
            size={16}
            className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`}
          />
          {labelsOn && (
            <span className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}>
              {label}
            </span>
          )}
        </div>
      </Link>
    );
  };

  // ── Render grouped nav ────────────────────────────────────────────────────
  const groups = getGroupsByRole(role);

  const renderGroupedNav = () =>
    groups.map((group, gi) => (
      <div key={group.groupKey}>
        {/* Group divider line (always visible) + label (only when expanded) */}
        <div className={`${gi === 0 ? "mt-1" : "mt-3"} mb-1`}>
          {showLabels ? (
            <p className="px-5 text-[12px] font-bold uppercase tracking-widest select-none
              text-gray-800">
              {GROUP_LABELS[group.groupKey] ?? group.groupKey}
            </p>
          ) : (
            /* condensed: show a thin divider line instead of label */
            gi > 0 && (
              <div className="mx-4 border-t border-white/10" />
            )
          )}
        </div>

        {group.items.map((item) => renderItem(item))}
      </div>
    ));

  return (
    <aside
      className={[
        "h-screen overflow-hidden uppercase",
        getSidebarWidth(),
        "flex-shrink-0 flex flex-col",
        "transition-all duration-300",
        "z-40",
        getSidebarClass(),
        layoutMode === "detached" ? "rounded-xl mt-[60px] mb-2 ml-0" : "",
        sidebarSize === "hover"      ? "group relative"       : "",
        sidebarSize === "fullscreen" ? "absolute inset-0 z-50" : "",
      ].filter(Boolean).join(" ")}
      style={getSidebarInlineStyle()}
    >
      {/* ── Hover-expand overlay ── */}
      {sidebarSize === "hover" && (
        <div
          className={`absolute left-full top-0 h-full w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 flex flex-col ${getSidebarClass()} shadow-xl`}
          style={getSidebarInlineStyle()}
        >
          <div className={`flex-shrink-0 h-14 flex items-center px-4 gap-3 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
            <SchoolLogoOrFallback size="sm" />
            <span className="text-sm font-bold text-white tracking-wide truncate">
              {schoolName || ("dashboard")}
            </span>
          </div>
          <nav className="flex-1 min-h-0 py-3 overflow-y-auto overflow-x-hidden" style={scrollbarStyle}>
            {groups.map((group, gi) => (
              <div key={group.groupKey}>
                <div className={`${gi === 0 ? "mt-1" : "mt-3"} mb-1`}>
                  <p className="px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
                    {GROUP_LABELS[group.groupKey] ?? group.groupKey}
                  </p>
                </div>
                {group.items.map((item) => renderItem(item, true))}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* ── Logo area — pinned ── */}
      <div className={`flex-shrink-0 p-2 flex flex-col items-center justify-center gap-2 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
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

      {/* ── Grouped nav — scrollable ── */}
      <nav
        className="flex-1 min-h-0 pb-4 overflow-y-auto overflow-x-hidden"
        style={scrollbarStyle}
      >
        {renderGroupedNav()}
      </nav>
    </aside>
  );
}