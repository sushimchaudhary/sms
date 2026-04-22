"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  MessageSquare,
  MessageSquareWarning,
  UserCheck,
  CalendarCheck,
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

// ── Types ────────────────────────────────────────────────────────────────────
type SubMenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type MenuItem = {
  icon: React.ElementType;
  label: string;
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

// ── Role-based menu definitions ──────────────────────────────────────────────
const SUPERADMIN_MENU: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: School, label: "School", href: "/school" },
  { icon: User, label: "User", href: "/user-management" },
];

const SCHOOL_ADMIN_MENU: MenuItem[] = [
{ 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/dashboard" 
  },

  { 
    icon: LayoutDashboard, 
    label: "Dashboard", 
    href: "/teacher-dashboard" 
  },
  { 
    icon: CalendarClock, 
    label: "Academic Session", 
    href: "/sessions" 
  },
  {
    icon: Users2,
    label: "User Management",
    href: "/school",
    submenu: [
      { label: "Teachers", href: "/teacher", icon: GraduationCap },
      { label: "Staff Members", href: "/staff", icon: ShieldCheck }, 
      { label: "Parents", href: "/parent", icon: Users },
      { label: "Students", href: "/student", icon: BookOpen },
    ],
  },
  { 
    icon: GraduationCap, // Icon change gareko matching label ko lagi
    label: "Academics", 
    href: "#", // Parent link click garna nahoos bhanera # rakheko
    submenu: [
      { label: "Class", href: "/class", icon: Layers },
      { label: "Section", href: "/section", icon: LayoutGrid },
      { label: "Subject", href: "/subject", icon: BookMarked },
      { label: "Teacher Assignment", href: "/teacher-subject", icon: ClipboardCheck },
    ]
  },
  { 
    icon: UserPlus, 
    label: "Admissions", 
    href: "/student-enrollment" 
  },
  { 
    icon: WalletCards, 
    label: "Accounts", 
    href: "#",
    submenu: [
      { label: "Fee Types", href: "/fee-type", icon: Tag },     
      { label: "Fee Structure", href: "/fee-structure", icon: Banknote },
       { label: "Student Fee ", href: "/student-fee", icon: WalletCards },
        { label: "Payment Records", href: "/payment-record", icon: ClipboardCheck },
        { label: "Expense Management", href: "/expense", icon: Receipt },
    ]
  },

  
  { 
    icon: BookMarked, 
    label: "Notes & Homework", 
    href: "#",
    submenu: [
      { label: "Home Works", href: "/homework", icon: Tag },     
      { label: "Notes", href: "/notes", icon: BookOpen },
    
    ]
  },

    { 
    icon:CalendarDays , 
    label: "Leave Application", 
    href: "/leave-application" 
  },

  { 
  icon: Bell, 
  label: "Notifications", 
  href: "#",
  submenu: [
    { label: "All Notifications", href: "/notification", icon: Bell },     
    { label: "Complaints", href: "/complaint", icon: MessageSquareWarning },
  ]
},

 { 
  icon: CalendarCheck, 
  label: "Attendance", 
  href: "#",
  submenu: [
    { label: "Staff Attendance", href: "/attendance/staff-attendance", icon: UserCheck },     
    { label: "Student Attendance", href: "/attendance/student-attendance", icon: GraduationCap },
  ]
}


  
];

// ── Inner component ───────────────────────────────────────────────────────────
function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setThemeConfig } = useTheme();
  const { user } = useAuth();

  const role = user?.role; // 'superadmin' | 'admin'

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  // ── School name state ─────────────────────────────────────────────────────
  const [schoolName, setSchoolName] = useState<string>("");
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


  useEffect(() => {
    setMounted(true);
  }, []);

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
        skinMode,
        sidebarStyle,
        navStyle,
        primarySkin,
        uiStyle,
        direction,
        layoutMode,
        topbarColor,
        menuColor,
        sidebarSize,
        customColor,
      });
    }
  }, [
    skinMode,
    sidebarStyle,
    navStyle,
    primarySkin,
    uiStyle,
    direction,
    layoutMode,
    topbarColor,
    menuColor,
    sidebarSize,
    customColor,
    mounted,
  ]);

  // ── Fetch school name (only for non-superadmin) ───────────────────────────
  useEffect(() => {
    const fetchSchoolName = async () => {
      // Cookie बाट user_info पढ्ने
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie
        ? JSON.parse(userInfoCookie)
        : null;

      // school_id: useAuth user वा cookie बाट — जुन पनि उपलब्ध छ
      const schoolId =
        user?.school_id ||
        user?.school ||
        cookieUser?.school_id ||
        cookieUser?.school;

      console.log("Resolved School ID:", schoolId);
      console.log("useAuth user:", user);
      console.log("Cookie user:", cookieUser);

      if (!schoolId) {
        console.warn("No school_id found on user");
        return;
      }

      try {
        setSchoolLoading(true);
        const res = await SchoolServices.getSingleSchool(schoolId);

        const name =
          res?.data?.name ||
          res?.name ||
          res?.data?.school_name ||
          res?.school_name;

        setSchoolName(name || "");
        console.log("School Name Set:", name);
      } catch (error: any) {
        console.error("School fetch error:", error?.response?.data || error);
        setSchoolName("");
      } finally {
        setSchoolLoading(false);
      }
    };

    if (role && role !== "superadmin") {
      fetchSchoolName();
    }
  }, [user?.school_id, user?.school, role]); 

  // ── Auto-open submenu if current path matches ─────────────────────────────
  useEffect(() => {
    const menuItems =
      role === "superadmin" ? SUPERADMIN_MENU : SCHOOL_ADMIN_MENU;
    menuItems.forEach((item) => {
      if (item.submenu) {
        const hasActiveChild = item.submenu.some(
          (sub) =>
            pathname === sub.href || pathname.startsWith(sub.href + "/")
        );
        if (hasActiveChild) {
          setOpenSubmenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname, role]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
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

  // ── Layout wrapper ────────────────────────────────────────────────────────
  const getLayoutWrapperClass = () => {
    if (layoutMode === "boxed") return "max-w-[1280px] mx-auto shadow-2xl";
    if (layoutMode === "detached") return "max-w-[1400px] mx-auto px-4 pt-3";
    return "";
  };

  // ── Menu items based on role ──────────────────────────────────────────────
  const menuItems: MenuItem[] =
    role === "superadmin" ? SUPERADMIN_MENU : SCHOOL_ADMIN_MENU;

  // ── Sidebar helpers ───────────────────────────────────────────────────────
  const getSidebarClass = () => {
    if (menuColor === "dark") return "bg-[#1e293b] text-slate-300";
    if (menuColor === "brand") return "text-white";
    if (sidebarStyle === "white")
      return "bg-white text-slate-700 border-r border-gray-200";
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

  // ── Sidebar size → width ──────────────────────────────────────────────────
  const getSidebarWidth = () => {
    if (!sidebarOpen || sidebarSize === "condensed") return "w-[58px]";
    if (sidebarSize === "hover") return "w-[58px]";
    if (sidebarSize === "compact") return "w-[160px]";
    if (sidebarSize === "full") return "w-[280px]";
    if (sidebarSize === "fullscreen") return "w-screen";
    return "w-[220px]";
  };
  const showLabels =
    sidebarOpen && sidebarSize !== "condensed" && sidebarSize !== "hover";

  // ── Nav helpers ───────────────────────────────────────────────────────────
  const getNavClass = () => {
    if (topbarColor === "dark")
      return "bg-slate-900 text-white border-b border-slate-800";
    if (topbarColor === "theme") return "text-white";
    if (navStyle === "dark")
      return "bg-slate-900 text-white border-b border-slate-800";
    return "bg-white border-b border-gray-200 text-slate-700";
  };
  const getNavInlineStyle = () =>
    topbarColor === "theme" ? { backgroundColor: activeColor } : {};
  const isDarkNav =
    topbarColor === "dark" ||
    topbarColor === "theme" ||
    (topbarColor === "light" && navStyle === "dark");

  // ── Render nav items ──────────────────────────────────────────────────────
  const renderNavItems = (items: MenuItem[]) =>
    items.map((item) => {
      const isActive =
        item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname === item.href || pathname.startsWith(item.href + "/");

      const hasSubmenu = !!item.submenu?.length;
      const isSubmenuOpen = openSubmenus[item.label] ?? false;

      return (
        <div key={item.label}>
          {hasSubmenu ? (
            <>
              <div
                onClick={() => toggleSubmenu(item.label)}
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
                    <span
                      className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
                {showLabels && (
                  <span className="flex-shrink-0">
                    {isSubmenuOpen ? (
                      <ChevronDown size={13} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={13} className="text-slate-400" />
                    )}
                  </span>
                )}
              </div>

              {/* Submenu items */}
              {isSubmenuOpen && showLabels && (
                <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
                  {item.submenu!.map((sub) => {
                    const isSubActive =
                      pathname === sub.href ||
                      pathname.startsWith(sub.href + "/");
                    return (
                      <Link href={sub.href} key={sub.label}>
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
                          <span className="truncate">{sub.label}</span>
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
                    <span
                      className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}
                    >
                      {item.label}
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
        skinMode === "dark"
          ? "bg-slate-950 text-white"
          : "bg-[#f0f2f5] text-slate-700"
      }`}
    >
      <div className={`flex flex-1 h-full min-w-0 ${getLayoutWrapperClass()}`}>
        {/* ── SIDEBAR ── */}
        <aside
          className={`${getSidebarWidth()} flex-shrink-0 transition-all duration-300 flex flex-col z-40 ${getSidebarClass()} ${
            layoutMode === "detached"
              ? "rounded-xl mt-[60px] mb-2 ml-0 overflow-hidden"
              : ""
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
              <div
                className={`h-14 flex items-center px-4 gap-3 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}
              >
                <span className="text-sm font-bold text-white tracking-wide">
                  Dashboard
                </span>
              </div>
              <nav className="flex-1 py-3 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                  return (
                    <Link href={item.href} key={item.label + "-hover"}>
                      <div
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors mx-2 rounded-md my-0.5 ${
                          isActive
                            ? "bg-white/20 text-white font-semibold"
                            : isDarkSidebar
                              ? "text-slate-200 hover:text-white"
                              : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <item.icon
                          size={15}
                          className="flex-shrink-0 text-slate-300"
                        />
                        <span className="text-sm truncate">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Logo */}
          <div
            className={`h-14 flex items-center px-5 gap-3 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}
          >
            <div className="w-6 h-6 grid grid-cols-2 gap-0.5 flex-shrink-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-sm" />
              ))}
            </div>
            {showLabels && (
              <span className="text-base font-bold text-white tracking-wide">
                Dashboard
              </span>
            )}
            {sidebarSize === "fullscreen" && (
              <button
                onClick={() => setSidebarSize("default")}
                className="ml-auto text-white/60 hover:text-white"
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
            {/* ── LEFT: Hamburger + Title ── */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={
                  isDarkNav
                    ? "text-white hover:text-white"
                    : "text-slate-500 hover:text-slate-700"
                }
              >
                <Menu size={20} />
              </button>

              {role !== "superadmin" && user ? (
                // ── School Admin: show assigned school name ──
                <div className="flex items-center gap-2">
                  

                  {/* School name + sub-label */}
                  <div className="flex flex-col leading-tight">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        isDarkNav ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {schoolLoading
                        ? "Loading..."
                        : schoolName
                          ? schoolName
                          : user?.name || "School Admin"}
                    </span>

                    {/* Sub-label: show role label below school name */}
                    {!schoolLoading && schoolName && (
                      <span
                        className={`text-[10px] font-normal ${
                          isDarkNav ? "text-white/50" : "text-slate-400"
                        }`}
                      >
                        {role === "admin" ? "School Admin" : role}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                // ── Superadmin: show plain Dashboard ──
                <span
                  className={`text-sm font-bold tracking-tight ${
                    isDarkNav ? "text-white" : "text-slate-700"
                  }`}
                >
                  {role && (
                <span
                  className={`text-xs px-2 py-0.5  mr-2 font-medium ${
                    role === "superadmin"
                      ? " text-purple-700"
                      : " text-emerald-700"
                  }`}
                >
                  {role === "superadmin" ? "Super Admin" : "School Admin"}
                </span>
              )}
                </span>
              )}
            </div>

            {/* ── RIGHT: Role badge + Bell + Avatar + Settings ── */}
            <div className="flex items-center gap-1">
              

             <button
  // यहाँ relative थप्नु अनिवार्य छ ताकि भित्रको absolute span यसकै माथि बसोस्
  className={`relative p-2 rounded-md ${
    isDarkNav
      ? "text-white/70 hover:text-white hover:bg-white/10"
      : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"
  }`}
>
  <Bell size={20} />
  {unreadCount > 0 && (
    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white font-bold">
      {unreadCount}
    </span>
  )}
</button>

              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold ml-1 cursor-pointer">
                <User size={14} />
              </div>

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
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Outer shell ───────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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