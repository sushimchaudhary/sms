"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { US, NP } from 'country-flag-icons/react/3x2';
import {
  Menu,
  Bell,
  Settings,
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
  Globe,
} from "lucide-react";

import { ThemeProvider, useTheme } from "@/lib/context/ThemeContext";
import SettingsDrawer, {
  type PrimarySkin,
  type SkinMode,
  type SidebarStyle,
  type NavStyle,
  type UiStyle,
  type Direction,
  type TopbarColor,
  type MenuColor,
  type SidebarSize,
} from "@/components/ui/setting";
import { AuthProvider } from "@/lib/context/AuthContext";
import useAuth from "@/lib/hooks/useAuth";
import cookies from "js-cookie";
import { SchoolServices } from "@/services/schoolServices";
import { NotificationProvider, useNotifications } from "@/lib/context/NotificationContext";
import { TeacherServices } from "@/services/teacherServices";
import { StudentServices } from "@/services/studentServices";
import { StaffServices } from "@/services/staffServices";
import { NotificationServices } from "@/services/notificationServices";
import { ParentServices } from "@/services/parentServices";

// ── Base URL + resolvePhoto ───────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
}

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Default values ───────────────────────────────────────────────────────────
const DEFAULTS = {
  skinMode: "light" as SkinMode,
  sidebarStyle: "light" as SidebarStyle,
  navStyle: "default" as NavStyle,
  primarySkin: "default" as PrimarySkin,
  uiStyle: "default" as UiStyle,
  direction: "ltr" as Direction,
  layoutMode: "fluid" as "fluid" | "boxed" | "detached",
  topbarColor: "light" as TopbarColor,
  menuColor: "light" as MenuColor,
  sidebarSize: "default" as SidebarSize,
  customColor: "#10b981",
};

const LS_KEY = "pharmacy_settings";

function loadSettings() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}
function saveSettings(s: typeof DEFAULTS) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}
function clearSettings() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

// ── Preset color map ─────────────────────────────────────────────────────────
const PRESET_COLORS: Record<string, string> = {
  default: "#10b981",
  bluelight: "#60a5fa",
  egyptian: "#0f4c3a",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  red: "#ef4444",
  orange: "#f97316",
  pink: "#ec4899",
  cyan: "#06b6d4",
  yellow: "#eab308",
};

// ── Role-based menu definitions (using translation keys) ─────────────────────
const SUPERADMIN_MENU: MenuItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/dashboard" },
  { icon: School,          labelKey: "nav.school",    href: "/school" },
  { icon: User,            labelKey: "nav.user",      href: "/user-management" },
];

const SCHOOL_ADMIN_MENU: MenuItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard",       href: "/dashboard" },
  { icon: CalendarClock,   labelKey: "nav.academicSession",  href: "/sessions" },
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
  { icon: UserPlus, labelKey: "nav.admissions", href: "/student-enrollment" },
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
  { icon: CalendarDays, labelKey: "nav.leaveApplication", href: "/leave-application" },
  {
    icon: Bell,
    labelKey: "nav.notifications",
    href: "#",
    submenu: [
      { labelKey: "nav.allNotifications", href: "/notification", icon: Bell },
      { labelKey: "nav.complaints",       href: "/complaint",    icon: MessageSquareWarning },
    ],
  },
  {
    icon: CalendarCheck,
    labelKey: "nav.attendance",
    href: "#",
    submenu: [
      { labelKey: "nav.staffAttendance",   href: "/attendance/staff-attendance",   icon: UserCheck },
      { labelKey: "nav.studentAttendance", href: "/attendance/student-attendance", icon: GraduationCap },
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
  { icon: MessageSquareWarning,  labelKey: "nav.complaints",       href: "/complaint" },
  { icon: Bell,                  labelKey: "nav.notifications",    href: "/notification" },
];

const PARENT_MENU: MenuItem[] = [
  { icon: LayoutDashboard,      labelKey: "nav.dashboard",     href: "/parent-dashboard" },
  { icon: MessageSquareWarning, labelKey: "nav.complaints",    href: "/complaint" },
  { icon: Bell,                 labelKey: "nav.notifications", href: "/notification" },
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

// ── Inner component ───────────────────────────────────────────────────────────
function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setThemeConfig } = useTheme();
  const { user } = useAuth();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const role = user?.role;

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [schoolName, setSchoolName] = useState<string>("");
  const [schoolLogo, setSchoolLogo] = useState<string>("");
  const [schoolLoading, setSchoolLoading] = useState(false);

  const saved = loadSettings();
  const [skinMode, setSkinMode] = useState(saved.skinMode);
  const [sidebarStyle, setSidebarStyle] = useState(saved.sidebarStyle);
  const [navStyle, setNavStyle] = useState(saved.navStyle);
  const [primarySkin, setPrimarySkin] = useState(saved.primarySkin);
  const [uiStyle, setUiStyle] = useState(saved.uiStyle);
  const [direction, setDirection] = useState(saved.direction);
  const [layoutMode, setLayoutMode] = useState(saved.layoutMode);
  const [topbarColor, setTopbarColor] = useState(saved.topbarColor);
  const [menuColor, setMenuColor] = useState(saved.menuColor);
  const [sidebarSize, setSidebarSize] = useState(saved.sidebarSize);
  const [customColor, setCustomColor] = useState(saved.customColor);
  const { unreadCount } = useNotifications();

  const [userPhoto, setUserPhoto] = useState<string>("");
  const [userPhotoError, setUserPhotoError] = useState(false);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // ── Language switcher ─────────────────────────────────────────────────────
  const switchLocale = (newLocale: string) => {
    // Replace the locale segment in the current pathname
    // Assumes next-intl routing: /en/... or /ne/...
    const segments = pathname.split("/");
    // segments[0] = "", segments[1] = locale, rest = path
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  // Fetch latest 5 notifications for dropdown
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await NotificationServices.getAllNotifications();
        const all = Array.isArray(res) ? res : res?.results || res?.data || [];
        setLatestNotifications([...all].reverse().slice(0, 5));
      } catch {}
    };
    if (user) fetchLatest();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch + resolve user photo based on role ──────────────────────────────
  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        const userInfoCookie = cookies.get("user_info");
        const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
        const cookiePhoto = cookieUser?.photo || (user as any)?.photo || "";

        if (cookiePhoto) {
          setUserPhoto(resolvePhoto(cookiePhoto));
          return;
        }

        if (role === "teacher") {
          const dash = await TeacherServices.getTeacherDashboard();
          setUserPhoto(resolvePhoto(dash?.teacher?.photo));
        } else if (role === "student") {
          const dash = await StudentServices.getStudentDashboard();
          setUserPhoto(resolvePhoto(dash?.student?.photo));
        } else if (role === "staff") {
          const dash = await StaffServices.getStaffDashboard();
          const photo = dash?.staff?.photo_url || dash?.staff?.photo || dash?.photo_url || dash?.photo;
          setUserPhoto(resolvePhoto(photo));
        } else if (role === "parent") {
          const dash = await ParentServices.getParentDashboard();
          setUserPhoto(resolvePhoto(dash?.parent?.photo || ""));
        }
      } catch {
        setUserPhoto("");
      }
    };

    if (user) fetchUserPhoto();
  }, [user, role]);

  // ── Active color ──────────────────────────────────────────────────────────
  const activeColor =
    primarySkin === "custom"
      ? customColor
      : (PRESET_COLORS[primarySkin] ?? "#10b981");

  useEffect(() => {
    setThemeConfig({ primaryColor: activeColor });
  }, [activeColor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mounted) {
      saveSettings({
        skinMode, sidebarStyle, navStyle, primarySkin, uiStyle,
        direction, layoutMode, topbarColor, menuColor, sidebarSize, customColor,
      });
    }
  }, [skinMode, sidebarStyle, navStyle, primarySkin, uiStyle, direction,
      layoutMode, topbarColor, menuColor, sidebarSize, customColor, mounted]);

  // ── Fetch school name + logo ──────────────────────────────────────────────
  useEffect(() => {
    const fetchSchoolData = async () => {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const schoolId =
        user?.school_id || user?.school ||
        cookieUser?.school_id || cookieUser?.school;

      if (!schoolId) return;

      try {
        setSchoolLoading(true);
        const res = await SchoolServices.getSingleSchool(schoolId);
        const data = res?.data || res;
        setSchoolName(data?.name || data?.school_name || "");
        const logoRaw = data?.logo_url || data?.logo || "";
        setSchoolLogo(resolvePhoto(logoRaw));
      } catch (error: any) {
        console.error("School fetch error:", error?.response?.data || error);
        setSchoolName("");
        setSchoolLogo("");
      } finally {
        setSchoolLoading(false);
      }
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

  useEffect(() => {
    setUserPhotoError(false);
  }, [userPhoto]);

  const toggleSubmenu = (labelKey: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

  const handleReset = () => {
    clearSettings();
    setSkinMode(DEFAULTS.skinMode);
    setSidebarStyle(DEFAULTS.sidebarStyle);
    setNavStyle(DEFAULTS.navStyle);
    setPrimarySkin(DEFAULTS.primarySkin);
    setUiStyle(DEFAULTS.uiStyle);
    setDirection(DEFAULTS.direction);
    setLayoutMode(DEFAULTS.layoutMode);
    setTopbarColor(DEFAULTS.topbarColor);
    setMenuColor(DEFAULTS.menuColor);
    setSidebarSize(DEFAULTS.sidebarSize);
    setCustomColor(DEFAULTS.customColor);
  };

  const getLayoutWrapperClass = () => {
    if (layoutMode === "boxed") return "max-w-[1280px] mx-auto shadow-2xl";
    if (layoutMode === "detached") return "max-w-[1400px] mx-auto px-4 pt-3";
    return "";
  };

  const menuItems: MenuItem[] = getMenuByRole(role);

  // ── Translate role label via i18n ─────────────────────────────────────────
  const getRoleLabel = (r: string | undefined) => {
    if (!r) return "";
    try {
      return t(`roles.${r}`);
    } catch {
      return r;
    }
  };

  const getSidebarClass = () => {
    if (menuColor === "dark") return "bg-[#1e293b] text-slate-300";
    if (menuColor === "brand") return "text-white";
    if (sidebarStyle === "white") return "bg-white text-slate-700 border-r border-gray-200";
    if (sidebarStyle === "light") return "bg-[#192a3e] text-slate-300";
    if (sidebarStyle === "dark") return "bg-slate-950 text-slate-300";
    return "text-white";
  };
  const getSidebarInlineStyle = (): React.CSSProperties => {
    if (menuColor === "brand") return { backgroundColor: activeColor };
    if (menuColor !== "light") return {};
    return sidebarStyle === "theme" ? { backgroundColor: activeColor } : {};
  };
  const isDarkSidebar = menuColor !== "light" || sidebarStyle !== "white";

  const getSidebarWidth = () => {
    if (!sidebarOpen || sidebarSize === "condensed") return "w-[58px]";
    if (sidebarSize === "hover") return "w-[58px]";
    if (sidebarSize === "compact") return "w-[160px]";
    if (sidebarSize === "full") return "w-[280px]";
    if (sidebarSize === "fullscreen") return "w-screen";
    return "w-[220px]";
  };
  const showLabels = sidebarOpen && sidebarSize !== "condensed" && sidebarSize !== "hover";

  const getNavClass = () => {
    if (topbarColor === "dark") return "bg-slate-900 text-white border-b border-slate-800";
    if (topbarColor === "theme") return "text-white";
    if (navStyle === "dark") return "bg-slate-900 text-white border-b border-slate-800";
    return "bg-white border-b border-gray-200 text-slate-700";
  };
  const getNavInlineStyle = () =>
    topbarColor === "theme" ? { backgroundColor: activeColor } : {};
  const isDarkNav =
    topbarColor === "dark" ||
    topbarColor === "theme" ||
    (topbarColor === "light" && navStyle === "dark");

  // ── School logo component ─────────────────────────────────────────────────
  const SchoolLogoOrFallback = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const dim = size === "md" ? "w-6 h-6" : "w-20 h-20";
    if (schoolLogo) {
      return (
        <img
          src={schoolLogo}
          alt={schoolName || "School Logo"}
          className={`${dim} object-contain flex-shrink-0 rounded-full bg-white/80`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      );
    }
    return (
      <div className={`${dim} grid grid-cols-2 gap-0.5 flex-shrink-0`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/80 rounded-sm" />
        ))}
      </div>
    );
  };

  // ── Render nav items with translated labels ───────────────────────────────
  const renderNavItems = (items: MenuItem[]) =>
    items.map((item) => {
      // Translate label key → string
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
    <div
      dir={direction}
      className={`flex h-screen font-sans overflow-hidden ${
        skinMode === "dark" ? "bg-slate-950 text-white" : "bg-[#f0f2f5] text-slate-700"
      }`}
    >
      <div className={`flex flex-1 h-full min-w-0 ${getLayoutWrapperClass()}`}>

        {/* ── SIDEBAR ── */}
        <aside
          className={`${getSidebarWidth()} flex-shrink-0 transition-all duration-300 flex flex-col z-40 ${getSidebarClass()} ${
            layoutMode === "detached" ? "rounded-xl mt-[60px] mb-2 ml-0 overflow-hidden" : ""
          } ${sidebarSize === "hover" ? "group relative" : ""} ${
            sidebarSize === "fullscreen" ? "absolute inset-0 z-50" : ""
          }`}
          style={getSidebarInlineStyle()}
        >
          {/* hover-expand overlay */}
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

          <div className={`py-2 flex flex-col items-center justify-center gap-2 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
            <div className="flex justify-center w-full">
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

        {/* ── MAIN ── */}
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* HEADER */}
          <header
            className={`h-14 flex items-center justify-between px-5 sticky top-0 z-30 flex-shrink-0 ${getNavClass()} ${
              layoutMode === "detached" ? "rounded-xl mb-1 mx-0" : ""
            }`}
            style={getNavInlineStyle()}
          >
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={isDarkNav ? "text-white hover:text-white" : "text-slate-500 hover:text-slate-700"}
              >
                <Menu size={20} />
              </button>

              {role !== "superadmin" && user ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col leading-tight">
                    <span className={`text-sm font-bold tracking-tight ${isDarkNav ? "text-white" : "text-slate-700"}`}>
                      {schoolLoading
                        ? t("common.loading")
                        : schoolName
                          ? schoolName
                          : user?.name || getRoleLabel(role)}
                    </span>
                    {!schoolLoading && schoolName && (
                      <span className={`text-[10px] font-normal ${isDarkNav ? "text-white/50" : "text-slate-400"}`}>
                        {getRoleLabel(role)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className={`text-sm font-bold tracking-tight ${isDarkNav ? "text-white" : "text-slate-700"}`}>
                  {role && (
                    <span className={`text-xs px-2 py-0.5 mr-2 font-medium ${
                      role === "superadmin" ? "text-purple-700" : "text-emerald-700"
                    }`}>
                      {getRoleLabel(role)}
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 overflow-visible relative">

              {/* ── Language switcher ── */}
              <div className="flex items-center gap-0.5 mr-1">
                <Globe
                  size={14}
                  className={isDarkNav ? "text-white/50" : "text-slate-400"}
                />
                
                {/* English Button */}
                <button
                  // onClick={() => switchLocale("en")}
                  className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                    locale === "en"
                      ? isDarkNav ? "bg-white/20 text-white" : "bg-gray-200 text-slate-800"
                      : isDarkNav ? "text-white/60 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"
                  }`}
                >
                  <US title="United States" className="w-3.5 h-auto rounded-sm shadow-sm" />
                  {t("common.english")}
                </button>

                <span className={`text-[10px] ${isDarkNav ? "text-white/30" : "text-slate-300"}`}>|</span>

                {/* Nepali Button */}
                <button
                  // onClick={() => switchLocale("ne")}
                  className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                    locale === "ne"
                      ? isDarkNav ? "bg-white/20 text-white" : "bg-gray-200 text-slate-800"
                      : isDarkNav ? "text-white/60 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"
                  }`}
                >
                  <NP title="Nepal" className="w-3.5 h-auto rounded-sm shadow-sm" />
                  {t("common.nepali")}
                </button>
              </div>

              {/* Bell with dropdown */}
              <div ref={notifRef} className="relative" style={{ zIndex: 9999 }}>
                <button
                  onClick={() => setNotifDropdownOpen((prev) => !prev)}
                  className={`relative p-2 rounded ${
                    isDarkNav
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"
                  }`}
                >
                  <Bell size={20} />
                </button>

                {/* Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded shadow-xl z-[9999] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-700">
                      <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                        {t("nav.notifications")}
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    {/* List */}
                    <div>
                      {latestNotifications.length === 0 ? (
                        <div className="py-8 text-center text-[12px] text-slate-400">
                          {t("nav.notifications")}
                        </div>
                      ) : (
                        latestNotifications.map((n) => (
                          <Link
                            href="/notification"
                            key={n.id}
                            onClick={() => setNotifDropdownOpen(false)}
                          >
                            <div
                              className={`flex gap-2.5 px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 cursor-pointer transition-colors ${
                                !n.is_read
                                  ? "bg-blue-50/60 hover:bg-blue-50"
                                  : "hover:bg-gray-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              <div className="mt-1.5 flex-shrink-0">
                                {!n.is_read ? (
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                ) : (
                                  <div className="w-2 h-2" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[12px] truncate ${!n.is_read ? "font-semibold text-slate-700" : "text-slate-500"}`}>
                                  {n.title}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                  {n.created_by_email} · {n.target_role}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(n.created_at).toLocaleDateString(
                                    locale === "ne" ? "ne-NP" : "en-US",
                                    { month: "short", day: "numeric", year: "numeric" }
                                  )}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <Link href="/notification" onClick={() => setNotifDropdownOpen(false)}>
                      <div className="px-4 py-2.5 text-center text-[12px] font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-gray-50 dark:bg-slate-800/50">
                        {t("nav.allNotifications")} →
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Profile avatar */}
              {role && (
                <Link href={`/${role}/profile`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-300 border-2 border-white/30 hover:opacity-90 transition-opacity cursor-pointer ml-1">
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={user?.name || "Profile"}
                        className="w-full h-full object-cover aspect-square"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : schoolLogo ? (
                      <img
                        src={schoolLogo}
                        alt={schoolName || "School"}
                        className="w-full h-full object-cover aspect-square"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <User size={18} className="text-gray-600" />
                    )}
                  </div>
                </Link>
              )}

              {/* Settings */}
              <button
                onClick={() => setSettingsOpen(true)}
                className={`p-2 rounded-md ${
                  isDarkNav
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"
                }`}
              >
                <Settings size={18} />
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <main className="bg-white/80 flex-1 overflow-y-auto p-3">
            {children}
          </main>

          {/* SETTINGS DRAWER */}
          <SettingsDrawer
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onReset={handleReset}
            activeColor={activeColor}
            skinMode={skinMode}
            setSkinMode={setSkinMode}
            topbarColor={topbarColor}
            setTopbarColor={setTopbarColor}
            menuColor={menuColor}
            setMenuColor={setMenuColor}
            sidebarSize={sidebarSize}
            setSidebarSize={setSidebarSize}
            direction={direction}
            setDirection={setDirection}
            uiStyle={uiStyle}
            setUiStyle={setUiStyle}
            sidebarStyle={sidebarStyle}
            setSidebarStyle={setSidebarStyle}
            navStyle={navStyle}
            setNavStyle={setNavStyle}
            primarySkin={primarySkin}
            setPrimarySkin={setPrimarySkin}
            customColor={customColor}
            setCustomColor={setCustomColor}
          />

          {/* Backdrop */}
          {settingsOpen && (
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSettingsOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Outer shell ───────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DashboardInner>{children}</DashboardInner>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
//-------------------------------------------------//

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   Menu,
//   Bell,
//   Settings,
//   X,
//   LayoutDashboard,
//   User,
//   School,
//   ChevronDown,
//   ChevronRight,
//   GraduationCap,
//   Users,
//   BookOpen,
//   UserPlus,
//   CalendarClock,
//   Users2,
//   ShieldCheck,
//   Layers,
//   LayoutGrid,
//   BookMarked,
//   ClipboardCheck,
//   WalletCards,
//   Banknote,
//   Tag,
//   Receipt,
//   CalendarDays,
//   MessageSquareWarning,
//   UserCheck,
//   CalendarCheck,
// } from "lucide-react";

// import { ThemeProvider, useTheme } from "@/lib/context/ThemeContext";
// import SettingsDrawer, {
//   type PrimarySkin,
//   type SkinMode,
//   type SidebarStyle,
//   type NavStyle,
//   type UiStyle,
//   type Direction,
//   type TopbarColor,
//   type MenuColor,
//   type SidebarSize,
// } from "@/components/ui/setting";
// import { AuthProvider } from "@/lib/context/AuthContext";
// import useAuth from "@/lib/hooks/useAuth";
// import cookies from "js-cookie";
// import { SchoolServices } from "@/services/schoolServices";
// import { NotificationProvider, useNotifications } from "@/lib/context/NotificationContext";
// import { TeacherServices } from "@/services/teacherServices";
// import { StudentServices } from "@/services/studentServices";
// import { StaffServices } from "@/services/staffServices";
// import { NotificationServices } from "@/services/notificationServices";
// import { ParentServices } from "@/services/parentServices";

// // ── Base URL + resolvePhoto ───────────────────────────────────────────────────
// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// function resolvePhoto(photo?: string | null): string {
//   if (!photo) return "";
//   return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
// }

// // ── Types ────────────────────────────────────────────────────────────────────
// type SubMenuItem = {
//   label: string;
//   href: string;
//   icon: React.ElementType;
// };

// type MenuItem = {
//   icon: React.ElementType;
//   label: string;
//   href: string;
//   submenu?: SubMenuItem[];
// };

// // ── Default values ───────────────────────────────────────────────────────────
// const DEFAULTS = {
//   skinMode: "light" as SkinMode,
//   sidebarStyle: "light" as SidebarStyle,
//   navStyle: "default" as NavStyle,
//   primarySkin: "default" as PrimarySkin,
//   uiStyle: "default" as UiStyle,
//   direction: "ltr" as Direction,
//   layoutMode: "fluid" as "fluid" | "boxed" | "detached",
//   topbarColor: "light" as TopbarColor,
//   menuColor: "light" as MenuColor,
//   sidebarSize: "default" as SidebarSize,
//   customColor: "#10b981",
// };

// const LS_KEY = "pharmacy_settings";

// function loadSettings() {
//   if (typeof window === "undefined") return DEFAULTS;
//   try {
//     const raw = localStorage.getItem(LS_KEY);
//     return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
//   } catch {
//     return DEFAULTS;
//   }
// }
// function saveSettings(s: typeof DEFAULTS) {
//   try {
//     localStorage.setItem(LS_KEY, JSON.stringify(s));
//   } catch {}
// }
// function clearSettings() {
//   try {
//     localStorage.removeItem(LS_KEY);
//   } catch {}
// }

// // ── Preset color map ─────────────────────────────────────────────────────────
// const PRESET_COLORS: Record<string, string> = {
//   default: "#10b981",
//   bluelight: "#60a5fa",
//   egyptian: "#0f4c3a",
//   purple: "#8b5cf6",
//   blue: "#3b82f6",
//   red: "#ef4444",
//   orange: "#f97316",
//   pink: "#ec4899",
//   cyan: "#06b6d4",
//   yellow: "#eab308",
// };

// // ── Role-based menu definitions ──────────────────────────────────────────────
// const SUPERADMIN_MENU: MenuItem[] = [
//    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
//   { icon: School, label: "School", href: "/school" },
//   { icon: User, label: "User", href: "/user-management" },
// ];

// const SCHOOL_ADMIN_MENU: MenuItem[] = [
//   { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
//   { icon: CalendarClock, label: "Academic Session", href: "/sessions" },
//   {
//     icon: Users2,
//     label: "User Management",
//     href: "/school",
//     submenu: [
//       { label: "Teachers", href: "/teacher", icon: GraduationCap },
//       { label: "Staff Members", href: "/staff", icon: ShieldCheck },
//       { label: "Parents", href: "/parent", icon: Users },
//       { label: "Students", href: "/student", icon: BookOpen },
//     ],
//   },
//   {
//     icon: GraduationCap,
//     label: "Academics",
//     href: "#",
//     submenu: [
//       { label: "Class", href: "/class", icon: Layers },
//       { label: "Section", href: "/section", icon: LayoutGrid },
//       { label: "Subject", href: "/subject", icon: BookMarked },
//       { label: "Teacher Assignment", href: "/teacher-subject", icon: ClipboardCheck },
//     ],
//   },
//   { icon: UserPlus, label: "Admissions", href: "/student-enrollment" },
//   {
//     icon: WalletCards,
//     label: "Accounts",
//     href: "#",
//     submenu: [
//       { label: "Fee Types", href: "/fee-type", icon: Tag },
//       { label: "Fee Structure", href: "/fee-structure", icon: Banknote },
//       { label: "Student Fee", href: "/student-fee", icon: WalletCards },
//       { label: "Payment Records", href: "/payment-record", icon: ClipboardCheck },
//       { label: "Expense Management", href: "/expense", icon: Receipt },
//     ],
//   },
//   {
//     icon: BookMarked,
//     label: "Notes & Homework",
//     href: "#",
//     submenu: [
//       { label: "Home Works", href: "/homework", icon: Tag },
//       { label: "Notes", href: "/notes", icon: BookOpen },
//     ],
//   },
//   { icon: CalendarDays, label: "Leave Application", href: "/leave-application" },
//   {
//     icon: Bell,
//     label: "Notifications",
//     href: "#",
//     submenu: [
//       { label: "All Notifications", href: "/notification", icon: Bell },
//       { label: "Complaints", href: "/complaint", icon: MessageSquareWarning },
//     ],
//   },
//   {
//     icon: CalendarCheck,
//     label: "Attendance",
//     href: "#",
//     submenu: [
//       { label: "Staff Attendance", href: "/attendance/staff-attendance", icon: UserCheck },
//       { label: "Student Attendance", href: "/attendance/student-attendance", icon: GraduationCap },
//     ],
//   },
// ];

// const TEACHER_MENU: MenuItem[] = [
//   { icon: LayoutDashboard, label: "Dashboard", href: "/teacher-dashboard" },
//   {
//     icon: CalendarCheck,
//     label: "Attendance",
//     href: "#",
//     submenu: [
//       { label: "Staff Attendance", href: "/attendance/staff-attendance", icon: UserCheck },
//       { label: "Student Attendance", href: "/attendance/student-attendance", icon: GraduationCap },
//     ],
//   },
//   { icon: CalendarDays, label: "Leave Application", href: "/leave-application" },
//   {
//     icon: BookMarked,
//     label: "Notes & Homework",
//     href: "#",
//     submenu: [
//       { label: "Home Works", href: "/homework", icon: Tag },
//       { label: "Notes", href: "/notes", icon: BookOpen },
//     ],
//   },
//   {
//     icon: Bell,
//     label: "Notifications",
//     href: "#",
//     submenu: [
//       { label: "All Notifications", href: "/notification", icon: Bell },
//       { label: "Complaints", href: "/complaint", icon: MessageSquareWarning },
//     ],
//   },
// ];

// const STUDENT_MENU: MenuItem[] = [
//   { icon: LayoutDashboard, label: "Dashboard", href: "/student-dashboard" },
//   {
//     icon: BookMarked,
//     label: "Notes & Homework",
//     href: "#",
//     submenu: [
//       { label: "Home Works", href: "/homework", icon: Tag },
//       { label: "Notes", href: "/notes", icon: BookOpen },
//     ],
//   },
//   { icon: CalendarDays, label: "Leave Application", href: "/leave-application" },
//   { icon: MessageSquareWarning, label: "Complaints", href: "/complaint" },
//   { icon: Bell, label: "Notifications", href: "/notification" },
// ];

// const PARENT_MENU: MenuItem[] = [
//   { icon: LayoutDashboard, label: "Dashboard", href: "/parent-dashboard" },
//   { icon: MessageSquareWarning, label: "Complaints", href: "/complaint" },
//   { icon: Bell, label: "Notifications", href: "/notification" },
// ];

// const STAFF_MENU: MenuItem[] = [
//   { icon: LayoutDashboard, label: "Dashboard", href: "/staff-dashboard" },
//   { icon: CalendarCheck, label: "Attendance", href: "/attendance/staff-attendance" },
//   {
//     icon: WalletCards,
//     label: "Accounts",
//     href: "#",
//     submenu: [
//       { label: "Fee Types", href: "/fee-type", icon: Tag },
//       { label: "Fee Structure", href: "/fee-structure", icon: Banknote },
//       { label: "Student Fee", href: "/student-fee", icon: WalletCards },
//       { label: "Payment Records", href: "/payment-record", icon: ClipboardCheck },
//       { label: "Expense Management", href: "/expense", icon: Receipt },
//     ],
//   },
//   { icon: CalendarDays, label: "Leave Application", href: "/leave-application" },
//   { icon: MessageSquareWarning, label: "Complaints", href: "/complaint" },
//   { icon: Bell, label: "Notifications", href: "/notification" },
// ];

// function getMenuByRole(role: string | undefined): MenuItem[] {
//   switch (role) {
//     case "superadmin": return SUPERADMIN_MENU;
//     case "admin":      return SCHOOL_ADMIN_MENU;
//     case "teacher":    return TEACHER_MENU;
//     case "student":    return STUDENT_MENU;
//     case "parent":     return PARENT_MENU;
//     case "staff":      return STAFF_MENU;
//     default:           return SCHOOL_ADMIN_MENU;
//   }
// }

// // ── Inner component ───────────────────────────────────────────────────────────
// function DashboardInner({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const { setThemeConfig } = useTheme();
//   const { user } = useAuth();

//   const role = user?.role;

//   const [mounted, setMounted] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [settingsOpen, setSettingsOpen] = useState(false);
//   const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
//   const [schoolName, setSchoolName] = useState<string>("");
//   // ✅ NEW: school logo state
//   const [schoolLogo, setSchoolLogo] = useState<string>("");
//   const [schoolLoading, setSchoolLoading] = useState(false);

//   const saved = loadSettings();
//   const [skinMode, setSkinMode] = useState(saved.skinMode);
//   const [sidebarStyle, setSidebarStyle] = useState(saved.sidebarStyle);
//   const [navStyle, setNavStyle] = useState(saved.navStyle);
//   const [primarySkin, setPrimarySkin] = useState(saved.primarySkin);
//   const [uiStyle, setUiStyle] = useState(saved.uiStyle);
//   const [direction, setDirection] = useState(saved.direction);
//   const [layoutMode, setLayoutMode] = useState(saved.layoutMode);
//   const [topbarColor, setTopbarColor] = useState(saved.topbarColor);
//   const [menuColor, setMenuColor] = useState(saved.menuColor);
//   const [sidebarSize, setSidebarSize] = useState(saved.sidebarSize);
//   const [customColor, setCustomColor] = useState(saved.customColor);
//   const { unreadCount } = useNotifications();

//   const [userPhoto, setUserPhoto] = useState<string>("");
//   const [userPhotoError, setUserPhotoError] = useState(false);

//   const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
// const [latestNotifications, setLatestNotifications] = useState<any[]>([]);
// const notifRef = useRef<HTMLDivElement>(null);

// // Fetch latest 5 notifications for dropdown
// useEffect(() => {
//   const fetchLatest = async () => {
//     try {
//       const res = await NotificationServices.getAllNotifications();
//       const all = Array.isArray(res) ? res : res?.results || res?.data || [];
//       setLatestNotifications([...all].reverse().slice(0, 5));
//     } catch {}
//   };
//   if (user) fetchLatest();
// }, [user]);

// // Close dropdown on outside click
// useEffect(() => {
//   const handler = (e: MouseEvent) => {
//     if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
//       setNotifDropdownOpen(false);
//     }
//   };
//   document.addEventListener("mousedown", handler);
//   return () => document.removeEventListener("mousedown", handler);
// }, []);



//   useEffect(() => { setMounted(true); }, []);

//   // ── Fetch + resolve user photo based on role ──────────────────────────────
//   useEffect(() => {
//     const fetchUserPhoto = async () => {
//       try {
//         const userInfoCookie = cookies.get("user_info");
//         const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
//         const cookiePhoto = cookieUser?.photo || (user as any)?.photo || "";

//         if (cookiePhoto) {
//           setUserPhoto(resolvePhoto(cookiePhoto));
//           return;
//         }

//         if (role === "teacher") {
//           const dash = await TeacherServices.getTeacherDashboard();
//           setUserPhoto(resolvePhoto(dash?.teacher?.photo));
//         } else if (role === "student") {
//           const dash = await StudentServices.getStudentDashboard();
//           const rawPhoto = dash?.student?.photo;
//           const resolved = resolvePhoto(rawPhoto);
//           console.log("Student photo raw:", rawPhoto, "→ resolved:", resolved); // ← debug
//           setUserPhoto(resolved);
//         } else if (role === "staff") {
//         const dash = await StaffServices.getStaffDashboard();
//         const photo = dash?.staff?.photo_url
//           || dash?.staff?.photo
//           || dash?.photo_url
//           || dash?.photo;
//         setUserPhoto(resolvePhoto(photo));
//       } else if (role === "parent") {
//       const dash = await ParentServices.getParentDashboard();
//       const photo = dash?.parent?.photo || "";
//       setUserPhoto(resolvePhoto(photo)); 
//     }
//             } catch {
//           setUserPhoto("");
//         }
//     };

//     if (user) {
//       fetchUserPhoto();
//     }
//   }, [user, role]);

//   // ── Active color ──────────────────────────────────────────────────────────
//   const activeColor =
//     primarySkin === "custom"
//       ? customColor
//       : (PRESET_COLORS[primarySkin] ?? "#10b981");

//   useEffect(() => {
//     setThemeConfig({ primaryColor: activeColor });
//   }, [activeColor]); // eslint-disable-line react-hooks/exhaustive-deps

//   useEffect(() => {
//     if (mounted) {
//       saveSettings({
//         skinMode, sidebarStyle, navStyle, primarySkin, uiStyle,
//         direction, layoutMode, topbarColor, menuColor, sidebarSize, customColor,
//       });
//     }
//   }, [skinMode, sidebarStyle, navStyle, primarySkin, uiStyle, direction,
//       layoutMode, topbarColor, menuColor, sidebarSize, customColor, mounted]);

//   // ── Fetch school name + logo ──────────────────────────────────────────────
//   useEffect(() => {
//     const fetchSchoolData = async () => {
//       const userInfoCookie = cookies.get("user_info");
//       const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
//       const schoolId =
//         user?.school_id || user?.school ||
//         cookieUser?.school_id || cookieUser?.school;

//       if (!schoolId) return;

//       try {
//         setSchoolLoading(true);
//         const res = await SchoolServices.getSingleSchool(schoolId);
//         const data = res?.data || res;

//         // ✅ Extract school name
//         const name = data?.name || data?.school_name;
//         setSchoolName(name || "");

//         // ✅ Extract and resolve school logo
//         // API returns logo_url or logo field — use whichever is present
//         const logoRaw = data?.logo_url || data?.logo || "";
//         setSchoolLogo(resolvePhoto(logoRaw));

//       } catch (error: any) {
//         console.error("School fetch error:", error?.response?.data || error);
//         setSchoolName("");
//         setSchoolLogo("");
//       } finally {
//         setSchoolLoading(false);
//       }
//     };

//     if (role && role !== "superadmin") {
//       fetchSchoolData();
//     }
//   }, [user?.school_id, user?.school, role]);

//   // ── Auto-open submenu if current path matches ─────────────────────────────
//   useEffect(() => {
//     const menuItems = getMenuByRole(role);
//     menuItems.forEach((item) => {
//       if (item.submenu) {
//         const hasActiveChild = item.submenu.some(
//           (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
//         );
//         if (hasActiveChild) {
//           setOpenSubmenus((prev) => ({ ...prev, [item.label]: true }));
//         }
//       }
//     });
//   }, [pathname, role]);

//   useEffect(() => {
//   setUserPhotoError(false);
// }, [userPhoto]);

//   const toggleSubmenu = (label: string) => {
//     setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
//   };

//   const handleReset = () => {
//     clearSettings();
//     setSkinMode(DEFAULTS.skinMode);
//     setSidebarStyle(DEFAULTS.sidebarStyle);
//     setNavStyle(DEFAULTS.navStyle);
//     setPrimarySkin(DEFAULTS.primarySkin);
//     setUiStyle(DEFAULTS.uiStyle);
//     setDirection(DEFAULTS.direction);
//     setLayoutMode(DEFAULTS.layoutMode);
//     setTopbarColor(DEFAULTS.topbarColor);
//     setMenuColor(DEFAULTS.menuColor);
//     setSidebarSize(DEFAULTS.sidebarSize);
//     setCustomColor(DEFAULTS.customColor);
//   };

//   const getLayoutWrapperClass = () => {
//     if (layoutMode === "boxed") return "max-w-[1280px] mx-auto shadow-2xl";
//     if (layoutMode === "detached") return "max-w-[1400px] mx-auto px-4 pt-3";
//     return "";
//   };

//   const menuItems: MenuItem[] = getMenuByRole(role);

//   const getRoleLabel = (r: string | undefined) => {
//     switch (r) {
//       case "superadmin": return "Super Admin";
//       case "admin":      return "School Admin";
//       case "teacher":    return "Teacher";
//       case "student":    return "Student";
//       case "parent":     return "Parent";
//       case "staff":      return "Staff";
//       default:           return r ?? "";
//     }
//   };

//   const getSidebarClass = () => {
//     if (menuColor === "dark") return "bg-[#1e293b] text-slate-300";
//     if (menuColor === "brand") return "text-white";
//     if (sidebarStyle === "white") return "bg-white text-slate-700 border-r border-gray-200";
//     if (sidebarStyle === "light") return "bg-[#192a3e] text-slate-300";
//     if (sidebarStyle === "dark") return "bg-slate-950 text-slate-300";
//     return "text-white";
//   };
//   const getSidebarInlineStyle = (): React.CSSProperties => {
//     if (menuColor === "brand") return { backgroundColor: activeColor };
//     if (menuColor !== "light") return {};
//     return sidebarStyle === "theme" ? { backgroundColor: activeColor } : {};
//   };
//   const isDarkSidebar = menuColor !== "light" || sidebarStyle !== "white";

//   const getSidebarWidth = () => {
//     if (!sidebarOpen || sidebarSize === "condensed") return "w-[58px]";
//     if (sidebarSize === "hover") return "w-[58px]";
//     if (sidebarSize === "compact") return "w-[160px]";
//     if (sidebarSize === "full") return "w-[280px]";
//     if (sidebarSize === "fullscreen") return "w-screen";
//     return "w-[220px]";
//   };
//   const showLabels = sidebarOpen && sidebarSize !== "condensed" && sidebarSize !== "hover";

//   const getNavClass = () => {
//     if (topbarColor === "dark") return "bg-slate-900 text-white border-b border-slate-800";
//     if (topbarColor === "theme") return "text-white";
//     if (navStyle === "dark") return "bg-slate-900 text-white border-b border-slate-800";
//     return "bg-white border-b border-gray-200 text-slate-700";
//   };
//   const getNavInlineStyle = () =>
//     topbarColor === "theme" ? { backgroundColor: activeColor } : {};
//   const isDarkNav =
//     topbarColor === "dark" ||
//     topbarColor === "theme" ||
//     (topbarColor === "light" && navStyle === "dark");

//   // ── Shared school logo component ──────────────────────────────────────────
//   /**
//    * Renders the school logo image if available, otherwise falls back to
//    * the original 2×2 grid of white squares (for superadmin or no-logo schools).
//    */
//   const SchoolLogoOrFallback = ({
//     size = "sm",
//   }: {
//     size?: "sm" | "md";
//   }) => {
//     const dim = size === "md" ? "w-6 h-6" : "w-20 h-20";

//     if (schoolLogo) {
//       return (
//         <img
//           src={schoolLogo}
//           alt={schoolName || "School Logo"}
//           className={`${dim} object-contain  flex-shrink-0 rounded-full  bg-white/80 `}
//           onError={(e) => {
//             // On broken image, hide it so the parent can show fallback
//             (e.target as HTMLImageElement).style.display = "none";
//           }}
//         />
//       );
//     }

//     // Fallback: original grid squares (superadmin or school with no logo)
//     return (
//       <div className={`${dim} grid grid-cols-2 gap-0.5 flex-shrink-0`}>
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="bg-white/80 rounded-sm" /> 
          
//         ))}
        
//       </div>
//     );
//   };

//   const renderNavItems = (items: MenuItem[]) =>
//     items.map((item) => {
//       const isActive =
//         item.href === "/dashboard"
//           ? pathname === "/dashboard"
//           : pathname === item.href || pathname.startsWith(item.href + "/");

//       const hasSubmenu = !!item.submenu?.length;
//       const isSubmenuOpen = openSubmenus[item.label] ?? false;

//       return (
//         <div key={item.label}>
//           {hasSubmenu ? (
//             <>
//               <div
//                 onClick={() => toggleSubmenu(item.label)}
//                 className={`flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors mx-3 rounded my-0.5 ${
//                   isActive
//                     ? "bg-white/20 text-white font-semibold"
//                     : isDarkSidebar
//                       ? "text-slate-200 hover:text-white hover:bg-white/10"
//                       : "text-slate-400 hover:text-slate-800 hover:bg-gray-100"
//                 }`}
//               >
//                 <div className="flex items-center gap-3 min-w-0">
//                   <item.icon
//                     size={16}
//                     className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`}
//                   />
//                   {showLabels && (
//                     <span className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}>
//                       {item.label}
//                     </span>
//                   )}
//                 </div>
//                 {showLabels && (
//                   <span className="flex-shrink-0">
//                     {isSubmenuOpen
//                       ? <ChevronDown size={13} className="text-slate-400" />
//                       : <ChevronRight size={13} className="text-slate-400" />
//                     }
//                   </span>
//                 )}
//               </div>

//               {isSubmenuOpen && showLabels && (
//                 <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
//                   {item.submenu!.map((sub) => {
//                     const isSubActive =
//                       pathname === sub.href || pathname.startsWith(sub.href + "/");
//                     return (
//                       <Link href={sub.href} key={sub.label}>
//                         <div
//                           className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-sm cursor-pointer transition-colors mx-1 ${
//                             isSubActive
//                               ? "bg-white/20 text-white font-semibold"
//                               : isDarkSidebar
//                                 ? "text-slate-300 hover:text-white hover:bg-white/10"
//                                 : "text-slate-500 hover:text-slate-800 hover:bg-gray-100"
//                           }`}
//                         >
//                           <sub.icon
//                             size={13}
//                             className={`flex-shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
//                           />
//                           <span className="truncate">{sub.label}</span>
//                         </div>
//                       </Link>
//                     );
//                   })}
//                 </div>
//               )}
//             </>
//           ) : (
//             <Link href={item.href}>
//               <div
//                 className={`flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors mx-3 rounded my-0.5 ${
//                   isActive
//                     ? "bg-white/20 text-white font-semibold"
//                     : isDarkSidebar
//                       ? "text-slate-200 hover:text-white hover:bg-white/10"
//                       : "text-slate-600 hover:text-slate-800 hover:bg-gray-100"
//                 }`}
//               >
//                 <div className="flex items-center gap-3 min-w-0">
//                   <item.icon
//                     size={16}
//                     className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`}
//                   />
//                   {showLabels && (
//                     <span className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}>
//                       {item.label}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </Link>
//           )}
//         </div>
//       );
//     });

//   return (
//     <div
//       dir={direction}
//       className={`flex h-screen font-sans overflow-hidden ${
//         skinMode === "dark" ? "bg-slate-950 text-white" : "bg-[#f0f2f5] text-slate-700"
//       }`}
//     >
//       <div className={`flex flex-1 h-full min-w-0 ${getLayoutWrapperClass()}`}>

//         {/* ── SIDEBAR ── */}
//         <aside
//           className={`${getSidebarWidth()} flex-shrink-0 transition-all duration-300 flex flex-col z-40 ${getSidebarClass()} ${
//             layoutMode === "detached" ? "rounded-xl mt-[60px] mb-2 ml-0 overflow-hidden" : ""
//           } ${sidebarSize === "hover" ? "group relative" : ""} ${
//             sidebarSize === "fullscreen" ? "absolute inset-0 z-50" : ""
//           }`}
//           style={getSidebarInlineStyle()}
//         >
//           {/* hover-expand overlay */}
//           {sidebarSize === "hover" && (
//             <div
//               className={`absolute left-full top-0 h-full w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 flex flex-col ${getSidebarClass()} shadow-xl`}
//               style={getSidebarInlineStyle()}
//             >
//               <div className={`h-14 flex items-center px-4 gap-3 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
//                 {/* ✅ School logo in hover sidebar */}
//                 <SchoolLogoOrFallback size="sm" />
//                 <span className="text-sm font-bold text-white tracking-wide truncate">
//                   {schoolName || "Dashboard"}
//                 </span>
//               </div>
//               <nav className="flex-1 py-3 overflow-y-auto">
//                 {menuItems.map((item) => {
//                   const isActive =
//                     item.href === "/dashboard"
//                       ? pathname === "/dashboard"
//                       : pathname === item.href || pathname.startsWith(item.href + "/");
//                   return (
//                     <Link href={item.href} key={item.label + "-hover"}>
//                       <div
//                         className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors mx-2 rounded-md my-0.5 ${
//                           isActive
//                             ? "bg-white/20 text-white font-semibold"
//                             : isDarkSidebar
//                               ? "text-slate-200 hover:text-white"
//                               : "text-slate-600 hover:text-slate-800"
//                         }`}
//                       >
//                         <item.icon size={15} className="flex-shrink-0 text-slate-300" />
//                         <span className="text-sm truncate">{item.label}</span>
//                       </div>
//                     </Link>
//                   );
//                 })}
//               </nav>
//             </div>
//           )}

//          <div className={`py-2 flex flex-col items-center justify-center gap-2 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
  
//   <div className="flex justify-center w-full">
//     <SchoolLogoOrFallback  /> 
//   </div>

//   {/* {showLabels && (
//     <span className="text-lg font-extrabold text-white tracking-wide truncate px-2 text-center uppercase">
//       {schoolName || "Dashboard"}
//     </span>
//   )} */}

//   {sidebarSize === "fullscreen" && (
//     <button
//       onClick={() => setSidebarSize("default")}
//       className="absolute top-4 right-4 text-white/60 hover:text-white"
//     >
//       <X size={18} />
//     </button>
//   )}
// </div>

//           {/* Nav items */}
//           <nav className="flex-1 py-2.5 overflow-y-auto overflow-x-hidden">
//             {renderNavItems(menuItems)}
//           </nav>
//         </aside>

//         {/* ── MAIN ── */}
//         <div className="flex-1 flex flex-col min-w-0 relative">

//           {/* HEADER */}
//           <header
//   className={`h-14 flex items-center justify-between px-5 sticky top-0 z-30 flex-shrink-0 ${getNavClass()} ${
//     layoutMode === "detached" ? "rounded-xl mb-1 mx-0" : ""
//   }`}
//   style={getNavInlineStyle()}
// >

//             {/* LEFT */}
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className={isDarkNav ? "text-white hover:text-white" : "text-slate-500 hover:text-slate-700"}
//               >
//                 <Menu size={20} />
//               </button>

//               {role !== "superadmin" && user ? (
//                 <div className="flex items-center gap-2">
//                   <div className="flex flex-col leading-tight">
//                     <span className={`text-sm font-bold tracking-tight ${isDarkNav ? "text-white" : "text-slate-700"}`}>
//                       {schoolLoading
//                         ? "Loading..."
//                         : schoolName
//                           ? schoolName
//                           : user?.name || getRoleLabel(role)}
//                     </span>
//                     {!schoolLoading && schoolName && (
//                       <span className={`text-[10px] font-normal ${isDarkNav ? "text-white/50" : "text-slate-400"}`}>
//                         {getRoleLabel(role)}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <span className={`text-sm font-bold tracking-tight ${isDarkNav ? "text-white" : "text-slate-700"}`}>
//                   {role && (
//                     <span className={`text-xs px-2 py-0.5 mr-2 font-medium ${
//                       role === "superadmin" ? "text-purple-700" : "text-emerald-700"
//                     }`}>
//                       {getRoleLabel(role)}
//                     </span>
//                   )}
//                 </span>
//               )}
//             </div>

//             {/* RIGHT */}
//             <div className="flex items-center gap-1 overflow-visible relative">
//               {/* Bell */}
//             {/* Bell with dropdown */}
//               <div ref={notifRef} className="relative" style={{ zIndex: 9999 }}>
//                 <button
//                   onClick={() => setNotifDropdownOpen((prev) => !prev)}
//                   className={`relative p-2 rounded ${
//                     isDarkNav
//                       ? "text-white/70 hover:text-white hover:bg-white/10"
//                       : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"
//                   }`}
//                 >
//                   <Bell size={20} />
//                   {/* {unreadCount > 0 && (
//                     <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white font-bold">
//                       {unreadCount}
//                     </span>
//                   )} */}
//                 </button>

//                 {/* Dropdown */}
//                         {notifDropdownOpen && (
//                           <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded shadow-xl z-[9999] overflow-hidden">
//                             {/* Header */}
//                             <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-700">
//                               <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
//                                 Notifications
//                               </span>
//                               {unreadCount > 0 && (
//                                 <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
//                                   {unreadCount} unread
//                                 </span>
//                               )}
//                             </div>

//                             {/* List */}
//                             <div>
//                               {latestNotifications.length === 0 ? (
//                                 <div className="py-8 text-center text-[12px] text-slate-400">
//                                   No notifications
//                                 </div>
//                               ) : (
//                                 latestNotifications.map((n) => (
//                                   <Link
//                                     href="/notification"
//                                     key={n.id}
//                                     onClick={() => setNotifDropdownOpen(false)}
//                                   >
//                                     <div
//                                       className={`flex gap-2.5 px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 cursor-pointer transition-colors ${
//                                         !n.is_read
//                                           ? "bg-blue-50/60 hover:bg-blue-50"
//                                           : "hover:bg-gray-50 dark:hover:bg-slate-800"
//                                       }`}
//                                     >
//                                       {/* Unread dot */}
//                                       <div className="mt-1.5 flex-shrink-0">
//                                         {!n.is_read ? (
//                                           <div className="w-2 h-2 rounded-full bg-blue-500" />
//                                         ) : (
//                                           <div className="w-2 h-2" />
//                                         )}
//                                       </div>
//                                       <div className="flex-1 min-w-0">
//                                         <p
//                                           className={`text-[12px] truncate ${
//                                             !n.is_read
//                                               ? "font-semibold text-slate-700"
//                                               : "text-slate-500"
//                                           }`}
//                                         >
//                                           {n.title}
//                                         </p>
//                                         <p className="text-[10px] text-slate-400 mt-0.5 truncate">
//                                           {n.created_by_email} · {n.target_role}
//                                         </p>
//                                         <p className="text-[10px] text-slate-400 mt-0.5">
//                                           {new Date(n.created_at).toLocaleDateString("en-US", {
//                                             month: "short", day: "numeric", year: "numeric",
//                                           })}
//                                         </p>
//                                       </div>
//                                     </div>
//                                   </Link>
//                                 ))
//                               )}
//                             </div>

//                             {/* Footer */}
//                             <Link href="/notification" onClick={() => setNotifDropdownOpen(false)}>
//                               <div className="px-4 py-2.5 text-center text-[12px] font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-gray-50 dark:bg-slate-800/50">
//                                 View all notifications →
//                               </div>
//                             </Link>
//                           </div>
//                         )}
//               </div>

//              {role && (
//                 <Link href={`/${role}/profile`}>
//                   <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-300 border-2 border-white/30 hover:opacity-90 transition-opacity cursor-pointer ml-1">
//                     {userPhoto ? (
//                       <img
//                         src={userPhoto}
//                         alt={user?.name || "Profile"}
//                         className="w-full h-full object-cover aspect-square"
//                         onError={(e) => {
//                           e.currentTarget.style.display = "none";
//                         }}
//                       />
//                     ) : schoolLogo ? (
//                       <img
//                         src={schoolLogo}
//                         alt={schoolName || "School"}
//                         className="w-full h-full object-cover aspect-square" 
//                         onError={(e) => {
//                           e.currentTarget.style.display = "none";
//                         }}
//                       />
//                     ) : (
//                       <User size={18} className="text-gray-600" />
//                     )}
//                   </div>
//                 </Link>
//               )}

//               {/* Settings */}
//               <button
//                 onClick={() => setSettingsOpen(true)}
//                 className={`p-2 rounded-md ${
//                   isDarkNav
//                     ? "text-white/70 hover:text-white hover:bg-white/10"
//                     : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"
//                 }`}
//               >
//                 <Settings size={18} />
//               </button>
//             </div>
//           </header>

//           {/* CONTENT */}
//           <main className="bg-white/80 flex-1 overflow-y-auto p-3">
//             {children}
//           </main>

//           {/* SETTINGS DRAWER */}
//           <SettingsDrawer
//             open={settingsOpen}
//             onClose={() => setSettingsOpen(false)}
//             onReset={handleReset}
//             activeColor={activeColor}
//             skinMode={skinMode}
//             setSkinMode={setSkinMode}
//             topbarColor={topbarColor}
//             setTopbarColor={setTopbarColor}
//             menuColor={menuColor}
//             setMenuColor={setMenuColor}
//             sidebarSize={sidebarSize}
//             setSidebarSize={setSidebarSize}
//             direction={direction}
//             setDirection={setDirection}
//             uiStyle={uiStyle}
//             setUiStyle={setUiStyle}
//             sidebarStyle={sidebarStyle}
//             setSidebarStyle={setSidebarStyle}
//             navStyle={navStyle}
//             setNavStyle={setNavStyle}
//             primarySkin={primarySkin}
//             setPrimarySkin={setPrimarySkin}
//             customColor={customColor}
//             setCustomColor={setCustomColor}
//           />

//           {/* Backdrop */}
//           {settingsOpen && (
//             <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSettingsOpen(false)} />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Outer shell ───────────────────────────────────────────────────────────────
// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <NotificationProvider>
//           <DashboardInner>{children}</DashboardInner>
//         </NotificationProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }