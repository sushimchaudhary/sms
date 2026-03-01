"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, Bell, Settings, X,
  LayoutDashboard, User, Building2, Layers,
  Truck, Package, ShoppingCart, Receipt,
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import SettingsDrawer, {
  type PrimarySkin, type SkinMode, type SidebarStyle, type NavStyle,
  type UiStyle, type Direction, type TopbarColor, type MenuColor, type SidebarSize,
} from "@/components/ui/setting";

// ── Default values ──────────────────────────────────────────────────────────
const DEFAULTS = {
  skinMode:     "light"   as SkinMode,
  sidebarStyle: "light"   as SidebarStyle,
  navStyle:     "default" as NavStyle,
  primarySkin:  "default" as PrimarySkin,
  uiStyle:      "default" as UiStyle,
  direction:    "ltr"     as Direction,
  layoutMode:   "fluid"   as "fluid" | "boxed" | "detached",
  topbarColor:  "light"   as TopbarColor,
  menuColor:    "light"   as MenuColor,
  sidebarSize:  "default" as SidebarSize,
  customColor:  "#10b981",
};

const LS_KEY = "pharmacy_settings";

function loadSettings() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}
function saveSettings(s: typeof DEFAULTS) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}
function clearSettings() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ── Preset color map ────────────────────────────────────────────────────────
const PRESET_COLORS: Record<string, string> = {
  default:   "#10b981",
  bluelight: "#60a5fa",
  egyptian:  "#0f4c3a",
  purple:    "#8b5cf6",
  blue:      "#3b82f6",
  red:       "#ef4444",
  orange:    "#f97316",
  pink:      "#ec4899",
  cyan:      "#06b6d4",
  yellow:    "#eab308",
};

// ── Inner component — inside ThemeProvider so it can call useTheme() ────────
function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setThemeConfig } = useTheme(); // ← syncs color into context

  const [mounted,      setMounted]      = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const saved = loadSettings();
  const [skinMode,     setSkinMode]     = useState(saved.skinMode);
  const [sidebarStyle, setSidebarStyle] = useState(saved.sidebarStyle);
  const [navStyle,     setNavStyle]     = useState(saved.navStyle);
  const [primarySkin,  setPrimarySkin]  = useState(saved.primarySkin);
  const [uiStyle,      setUiStyle]      = useState(saved.uiStyle);
  const [direction,    setDirection]    = useState(saved.direction);
  const [layoutMode,   setLayoutMode]   = useState(saved.layoutMode);
  const [topbarColor,  setTopbarColor]  = useState(saved.topbarColor);
  const [menuColor,    setMenuColor]    = useState(saved.menuColor);
  const [sidebarSize,  setSidebarSize]  = useState(saved.sidebarSize);
  const [customColor,  setCustomColor]  = useState(saved.customColor);

  useEffect(() => { setMounted(true); }, []);

  // ── Derive the active hex color ───────────────────────────────────────────
  // If "custom" is selected, use the picker value; otherwise use the preset map.
  const activeColor = primarySkin === "custom"
    ? customColor
    : (PRESET_COLORS[primarySkin] ?? "#10b981");

  // ── Push activeColor into ThemeContext so ThemedButton/ThemedInput update ──
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
  }, [skinMode, sidebarStyle, navStyle, primarySkin, uiStyle,
      direction, layoutMode, topbarColor, menuColor, sidebarSize, customColor, mounted]);

  const handleReset = () => {
    clearSettings();
    setSkinMode(DEFAULTS.skinMode);       setSidebarStyle(DEFAULTS.sidebarStyle);
    setNavStyle(DEFAULTS.navStyle);       setPrimarySkin(DEFAULTS.primarySkin);
    setUiStyle(DEFAULTS.uiStyle);         setDirection(DEFAULTS.direction);
    setLayoutMode(DEFAULTS.layoutMode);   setTopbarColor(DEFAULTS.topbarColor);
    setMenuColor(DEFAULTS.menuColor);     setSidebarSize(DEFAULTS.sidebarSize);
    setCustomColor(DEFAULTS.customColor);
  };

  // ── Layout wrapper ────────────────────────────────────────────────────────
  const getLayoutWrapperClass = () => {
    if (layoutMode === "boxed")    return "max-w-[1280px] mx-auto shadow-2xl";
    if (layoutMode === "detached") return "max-w-[1400px] mx-auto px-4 pt-3";
    return "";
  };

  // ── Menu items ────────────────────────────────────────────────────────────
  const menuItems = [
    { icon: Building2, label: "company",    href: "/dashboard/company" },
    { icon: LayoutDashboard, label: "category", href: "/dashboard/category" },
    { icon: LayoutDashboard, label: "text 3",     href: "/#" },
    
  ];

  // ── Sidebar helpers ───────────────────────────────────────────────────────
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
  const isDarkSidebar = menuColor !== "light" || sidebarStyle !== "white";

  // ── Sidebar size → width ──────────────────────────────────────────────────
  const getSidebarWidth = () => {
    if (!sidebarOpen || sidebarSize === "condensed") return "w-[58px]";
    if (sidebarSize === "hover")      return "w-[58px]";
    if (sidebarSize === "compact")    return "w-[160px]";
    if (sidebarSize === "full")       return "w-[280px]";
    if (sidebarSize === "fullscreen") return "w-screen";
    return "w-[220px]";
  };
  const showLabels = sidebarOpen && sidebarSize !== "condensed" && sidebarSize !== "hover";

  // ── Nav helpers ───────────────────────────────────────────────────────────
  const getNavClass = () => {
    if (topbarColor === "dark")  return "bg-slate-900 text-white border-b border-slate-800";
    if (topbarColor === "theme") return "text-white";
    if (navStyle === "dark")     return "bg-slate-900 text-white border-b border-slate-800";
    return "bg-white border-b border-gray-200 text-slate-700";
  };
  const getNavInlineStyle = () =>
    topbarColor === "theme" ? { backgroundColor: activeColor } : {};
  const isDarkNav =
    topbarColor === "dark" ||
    topbarColor === "theme" ||
    (topbarColor === "light" && navStyle === "dark");

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
              className={`absolute left-full top-0 h-full w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 flex flex-col ${getSidebarClass()} shadow-xl`}
              style={getSidebarInlineStyle()}
            >
              <div className={`h-14 flex items-center px-4 gap-3 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
                <span className="text-sm font-bold text-white tracking-wide">Pharmacy</span>
              </div>
              <nav className="flex-1 py-3 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link href={item.href} key={item.label + "-hover"}>
                      <div className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors mx-2 rounded-md my-0.5 ${
                        isActive ? "bg-white/20 text-white font-semibold"
                          : isDarkSidebar ? "text-slate-200 hover:text-white"
                          : "text-slate-600 hover:text-slate-800"
                      }`}>
                        <item.icon size={15} className="flex-shrink-0 text-slate-300" />
                        <span className="text-sm truncate">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Logo */}
          <div className={`h-14 flex items-center px-5 gap-3 border-b ${isDarkSidebar ? "border-white/10" : "border-gray-100"}`}>
            <div className="w-6 h-6 grid grid-cols-2 gap-0.5 flex-shrink-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-sm" />
              ))}
            </div>
            {showLabels && (
              <span className="text-base font-bold text-white tracking-wide">Pharmacy</span>
            )}
            {sidebarSize === "fullscreen" && (
              <button onClick={() => setSidebarSize("default")} className="ml-auto text-white/60 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
            {menuItems.map((item) => {
              const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link href={item.href} key={item.label}>
                  <div className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors mx-2 rounded-md my-0.5 ${
                    isActive ? "bg-white/20 text-white font-semibold"
                      : isDarkSidebar ? "text-slate-200 hover:text-white"
                      : "text-slate-600 hover:text-slate-800"
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon size={16} className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`} />
                      {showLabels && (
                        <span className={`text-sm truncate ${isActive ? "font-semibold text-white" : ""}`}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={isDarkNav ? "text-white hover:text-white" : "text-slate-500 hover:text-slate-700"}
              >
                <Menu size={20} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button className={`p-2 rounded-md ${isDarkNav ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"}`}>
                <Bell size={18} />
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold ml-1 cursor-pointer">
                <User size={14} />
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className={`p-2 rounded-md ${isDarkNav ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-gray-100"}`}
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
            skinMode={skinMode}         setSkinMode={setSkinMode}
            topbarColor={topbarColor}   setTopbarColor={setTopbarColor}
            menuColor={menuColor}       setMenuColor={setMenuColor}
            sidebarSize={sidebarSize}   setSidebarSize={setSidebarSize}
            direction={direction}       setDirection={setDirection}
            uiStyle={uiStyle}           setUiStyle={setUiStyle}
            sidebarStyle={sidebarStyle} setSidebarStyle={setSidebarStyle}
            navStyle={navStyle}         setNavStyle={setNavStyle}
            primarySkin={primarySkin}   setPrimarySkin={setPrimarySkin}
            customColor={customColor}   setCustomColor={setCustomColor}
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

// ── Outer shell — just provides ThemeProvider ────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardInner>{children}</DashboardInner>
    </ThemeProvider>
  );
}