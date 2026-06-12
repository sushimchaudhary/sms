"use client";

import React, { useState, useRef } from "react";
import { X, RotateCcw, KeyRound, LogOut, Pipette } from "lucide-react";
import ChangePassword from "@/components/changePassword";
import axiosInstance from "@/lib/config/axios.config";

import { Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { logoutAction } from "@/action/auth";
import { useLanguage } from "@/lib/context/LanguageContext";
import { useT } from "@/lib/hooks/useT";

// ── Types ───────────────────────────────────────────────────────────────────
export type SkinMode = "light" | "dark";
export type SidebarStyle = "white" | "light" | "dark" | "theme";
export type NavStyle = "default" | "bluelight" | "dark" | "theme";
export type PrimarySkin =
  | "default"
  | "bluelight"
  | "egyptian"
  | "purple"
  | "blue"
  | "red"
  | "orange"
  | "pink"
  | "cyan"
  | "yellow"
  | "custom";
export type UiStyle = "default" | "softy";
export type Direction = "ltr" | "rtl";
export type TopbarColor = "light" | "dark" | "theme";
export type MenuColor = "light" | "dark" | "brand";
export type SidebarSize = "default" | "compact" | "condensed";

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  activeColor: string;

  skinMode: SkinMode;
  setSkinMode: (v: SkinMode) => void;
  topbarColor: TopbarColor;
  setTopbarColor: (v: TopbarColor) => void;
  menuColor: MenuColor;
  setMenuColor: (v: MenuColor) => void;
  sidebarSize: SidebarSize;
  setSidebarSize: (v: SidebarSize) => void;
  direction: Direction;
  setDirection: (v: Direction) => void;
  uiStyle: UiStyle;
  setUiStyle: (v: UiStyle) => void;
  sidebarStyle: SidebarStyle;
  setSidebarStyle: (v: SidebarStyle) => void;
  navStyle: NavStyle;
  setNavStyle: (v: NavStyle) => void;
  primarySkin: PrimarySkin;
  setPrimarySkin: (v: PrimarySkin) => void;
  // custom color picker
  customColor: string;
  setCustomColor: (v: string) => void;
}

// ── Mini preview SVG components ─────────────────────────────────────────────
function PreviewLight({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="0" y="0" width="20" height="60" fill="#e5e7eb" rx="2" />
      <rect x="3" y="8" width="14" height="3" fill="#9ca3af" rx="1" />
      <rect x="3" y="15" width="14" height="3" fill="#9ca3af" rx="1" />
      <rect x="3" y="22" width="14" height="3" fill="#9ca3af" rx="1" />
      <rect x="3" y="29" width="14" height="3" fill="#9ca3af" rx="1" />
      <rect x="22" y="0" width="58" height="60" fill="#f9fafb" rx="2" />
      <rect x="24" y="3" width="54" height="8" fill="#ffffff" rx="1" />
      <rect x="24" y="14" width="25" height="12" fill="#e5e7eb" rx="2" />
      <rect x="52" y="14" width="25" height="12" fill="#e5e7eb" rx="2" />
      <rect x="24" y="30" width="53" height="8" fill="#e5e7eb" rx="2" />
      <rect x="24" y="42" width="53" height="8" fill="#e5e7eb" rx="2" />
      {active && <circle cx="68" cy="52" r="5" fill="#6366f1" />}
      {active && (
        <text x="68" y="55" textAnchor="middle" fontSize="6" fill="white">
          ✓
        </text>
      )}
    </svg>
  );
}

function PreviewDark({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="0" y="0" width="20" height="60" fill="#374151" rx="2" />
      <rect x="3" y="8" width="14" height="3" fill="#6b7280" rx="1" />
      <rect x="3" y="15" width="14" height="3" fill="#6b7280" rx="1" />
      <rect x="3" y="22" width="14" height="3" fill="#6b7280" rx="1" />
      <rect x="3" y="29" width="14" height="3" fill="#6b7280" rx="1" />
      <rect x="22" y="0" width="58" height="60" fill="#1f2937" rx="2" />
      <rect x="22" y="0" width="58" height="10" fill="#111827" />
      <rect x="24" y="14" width="25" height="12" fill="#374151" rx="2" />
      <rect x="52" y="14" width="25" height="12" fill="#374151" rx="2" />
      <rect x="24" y="30" width="53" height="8" fill="#374151" rx="2" />
      <rect x="24" y="42" width="53" height="8" fill="#374151" rx="2" />
      {active && <circle cx="68" cy="52" r="5" fill="#6366f1" />}
      {active && (
        <text x="68" y="55" textAnchor="middle" fontSize="6" fill="white">
          ✓
        </text>
      )}
    </svg>
  );
}

function PreviewTopbar({
  color,
  activeColor,
  active,
}: {
  color: "light" | "dark" | "theme";
  activeColor: string;
  active: boolean;
}) {
  const topbarFill =
    color === "light" ? "#ffffff" : color === "dark" ? "#1f2937" : activeColor;
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="0" y="0" width="80" height="60" fill="#f3f4f6" rx="2" />
      <rect x="0" y="0" width="18" height="60" fill="#d1d5db" />
      <rect x="3" y="14" width="12" height="2.5" fill="#9ca3af" rx="1" />
      <rect x="3" y="20" width="12" height="2.5" fill="#9ca3af" rx="1" />
      <rect x="3" y="26" width="12" height="2.5" fill="#9ca3af" rx="1" />
      <rect x="18" y="0" width="62" height="12" fill={topbarFill} />
      <rect x="20" y="15" width="58" height="8" fill="#e5e7eb" rx="1" />
      <rect x="20" y="26" width="58" height="8" fill="#e5e7eb" rx="1" />
      <rect x="20" y="37" width="58" height="8" fill="#e5e7eb" rx="1" />
      {active && <circle cx="68" cy="52" r="5" fill="#6366f1" />}
      {active && (
        <text x="68" y="55" textAnchor="middle" fontSize="6" fill="white">
          ✓
        </text>
      )}
    </svg>
  );
}

function PreviewMenuColor({
  color,
  brandColor,
  active,
}: {
  color: "light" | "dark" | "brand";
  brandColor: string;
  active: boolean;
}) {
  const sidebarFill =
    color === "light" ? "#e5e7eb" : color === "dark" ? "#1e293b" : brandColor;
  const dotFill =
    color === "light"
      ? "#9ca3af"
      : color === "dark"
        ? "#475569"
        : "rgba(255,255,255,0.5)";
  const logoBg =
    color === "light"
      ? "#cbd5e1"
      : color === "dark"
        ? "#334155"
        : "rgba(255,255,255,0.25)";
  return (
    <svg viewBox="0 0 80 64" className="w-full h-full">
      <rect x="0" y="0" width="80" height="64" fill="#f1f5f9" rx="3" />
      <rect x="0" y="0" width="22" height="64" fill={sidebarFill} rx="3" />
      <rect x="4" y="4" width="14" height="7" fill={logoBg} rx="2" />
      {[14, 23, 32, 41, 50].map((y) => (
        <rect key={y} x="4" y={y} width="14" height="3" fill={dotFill} rx="1" />
      ))}
      <rect x="22" y="0" width="58" height="10" fill="#ffffff" />
      <rect x="25" y="13" width="25" height="14" fill="#e2e8f0" rx="2" />
      <rect x="52" y="13" width="25" height="14" fill="#e2e8f0" rx="2" />
      <rect x="25" y="30" width="52" height="7" fill="#e2e8f0" rx="2" />
      <rect x="25" y="40" width="52" height="7" fill="#e2e8f0" rx="2" />
      <rect x="25" y="50" width="52" height="7" fill="#e2e8f0" rx="2" />
      {active && <circle cx="70" cy="56" r="5" fill="#6366f1" />}
      {active && (
        <text x="70" y="59" textAnchor="middle" fontSize="6" fill="white">
          ✓
        </text>
      )}
    </svg>
  );
}

function PreviewSidebarSize({
  size,
  active,
}: {
  size: "default" | "compact" | "condensed" | "hover" | "full" | "fullscreen";
  active: boolean;
}) {
  const sw =
    size === "condensed"
      ? 8
      : size === "compact"
        ? 14
        : size === "hover"
          ? 8
          : size === "full"
            ? 28
            : size === "fullscreen"
              ? 80
              : 20;
  const isFullscreen = size === "fullscreen";
  const isHover = size === "hover";

  return (
    <svg viewBox="0 0 80 64" className="w-full h-full">
      <rect x="0" y="0" width="80" height="64" fill="#f1f5f9" rx="3" />
      {isFullscreen ? (
        <>
          <rect x="0" y="0" width="80" height="64" fill="#334155" rx="3" />
          {[10, 20, 30, 40, 50].map((y) => (
            <rect
              key={y}
              x="8"
              y={y}
              width="64"
              height="4"
              fill="#475569"
              rx="1"
            />
          ))}
        </>
      ) : (
        <>
          <rect x="0" y="0" width={sw} height="64" fill="#334155" rx="3" />
          {size === "condensed" || size === "hover"
            ? [10, 20, 30, 40, 50].map((y) => (
                <rect
                  key={y}
                  x="2"
                  y={y}
                  width="4"
                  height="4"
                  fill="#64748b"
                  rx="1"
                />
              ))
            : [10, 20, 30, 40, 50].map((y) => (
                <rect
                  key={y}
                  x="3"
                  y={y}
                  width={sw - 5}
                  height="3"
                  fill="#64748b"
                  rx="1"
                />
              ))}
          {isHover && (
            <>
              <rect
                x={sw}
                y="0"
                width="18"
                height="64"
                fill="#1e293b"
                opacity="0.92"
              />
              {[10, 20, 30, 40, 50].map((y) => (
                <rect
                  key={y}
                  x={sw + 2}
                  y={y}
                  width="14"
                  height="3"
                  fill="#64748b"
                  rx="1"
                />
              ))}
            </>
          )}
          <rect x={sw} y="0" width={80 - sw} height="10" fill="#ffffff" />
          {size !== "full" && (
            <>
              <rect
                x={sw + 3}
                y="13"
                width={(80 - sw - 6) / 2 - 1}
                height="14"
                fill="#e2e8f0"
                rx="2"
              />
              <rect
                x={sw + 3 + (80 - sw - 6) / 2 + 1}
                y="13"
                width={(80 - sw - 6) / 2 - 1}
                height="14"
                fill="#e2e8f0"
                rx="2"
              />
              <rect
                x={sw + 3}
                y="30"
                width={80 - sw - 6}
                height="7"
                fill="#e2e8f0"
                rx="2"
              />
              <rect
                x={sw + 3}
                y="40"
                width={80 - sw - 6}
                height="7"
                fill="#e2e8f0"
                rx="2"
              />
              <rect
                x={sw + 3}
                y="50"
                width={80 - sw - 6}
                height="7"
                fill="#e2e8f0"
                rx="2"
              />
            </>
          )}
          {size === "full" && (
            <>
              <rect
                x={sw + 3}
                y="13"
                width={80 - sw - 6}
                height="8"
                fill="#e2e8f0"
                rx="2"
              />
              <rect
                x={sw + 3}
                y="24"
                width={80 - sw - 6}
                height="8"
                fill="#e2e8f0"
                rx="2"
              />
              <rect
                x={sw + 3}
                y="35"
                width={80 - sw - 6}
                height="8"
                fill="#e2e8f0"
                rx="2"
              />
            </>
          )}
        </>
      )}
      {active && <circle cx="70" cy="56" r="5" fill="#6366f1" />}
      {active && (
        <text x="70" y="59" textAnchor="middle" fontSize="6" fill="white">
          ✓
        </text>
      )}
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SettingsDrawer({
  open,
  onClose,
  onReset,
  activeColor,
  skinMode,
  setSkinMode,
  topbarColor,
  setTopbarColor,
  menuColor,
  setMenuColor,
  sidebarSize,
  setSidebarSize,
  direction,
  setDirection,
  uiStyle,
  setUiStyle,
  sidebarStyle,
  setSidebarStyle,
  navStyle,
  setNavStyle,
  primarySkin,
  setPrimarySkin,
  customColor,
  setCustomColor,
}: SettingsDrawerProps) {
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale, isPending } = useLanguage();

  // ── Translations (each key translated individually) ──────────────────────
  const tLanguage       = useT("language");
  const tEnglish        = useT("english");
  const tNepali         = useT("nepali");
  const tLoading        = useT("loading");
  const tColorScheme    = useT("colorScheme");
  const tLight          = useT("light");
  const tDark           = useT("dark");
  const tTopbarColor    = useT("topbarColor");
  const tMenuColor      = useT("menuColor");
  const tSidebarSize    = useT("sidebarSize");
  const tDirection      = useT("direction");
  const tLtr            = useT("LTR");
  const tRtl            = useT("RTL");
  const tDefault        = useT("default");
  const tCompact        = useT("compact");
  const tCondensed      = useT("condensed");
  const tPrimarySkin    = useT("primarySkin");
  const tCustom         = useT("custom");
  const tPickAColor     = useT("pickAColor");
  const tActive         = useT("active");
  const tResetSettings  = useT("Reset Settings");
  const tChangePassword = useT("Change Password");
  const tLogout         = useT("Log Out");
  // Skin label translations
  const tDefault2       = useT("Default");
  const tBlueLight      = useT("Blue Light");
  const tEgyptian       = useT("Egyptian");
  const tPurple         = useT("Purple");
  const tBlue           = useT("Blue");
  const tRed            = useT("Red");
  const tOrange         = useT("Orange");
  const tPink           = useT("Pink");
  const tCyan           = useT("Cyan");
  const tYellow         = useT("Yellow");

  const closePassModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsPassModalOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const ring = (active: boolean) =>
    active ? "ring-2 ring-offset-1 ring-emerald-500" : "";

  const primarySkins = [
    {
      key: "default",
      label: tDefault2,
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      key: "bluelight",
      label: tBlueLight,
      gradient: "from-blue-300 to-blue-400",
    },
    {
      key: "egyptian",
      label: tEgyptian,
      gradient: "from-teal-600 to-[#0f4c3a]",
    },
    {
      key: "purple",
      label: tPurple,
      gradient: "from-purple-400 to-violet-600",
    },
    { key: "blue", label: tBlue, gradient: "from-blue-400 to-blue-600" },
    { key: "red", label: tRed, gradient: "from-red-400 to-rose-500" },
    {
      key: "orange",
      label: tOrange,
      gradient: "from-orange-400 to-orange-600",
    },
    { key: "pink", label: tPink, gradient: "from-pink-400 to-rose-400" },
    { key: "cyan", label: tCyan, gradient: "from-cyan-400 to-sky-500" },
    {
      key: "yellow",
      label: tYellow,
      gradient: "from-yellow-400 to-amber-500",
    },
  ] as const;

  const { confirm, destroyAll } = Modal;

  const showLogoutConfirm = () => {
    confirm({
      title: (
        <span className="text-lg font-bold text-slate-800">Confirm Logout</span>
      ),
      icon: <ExclamationCircleFilled className="text-rose-500" />,
      content: "You will need to login again to access your system.",
      okText: "Yes, Logout",
      cancelText: "No, Stay",

      okButtonProps: {
        className:
          "!border-red-400 !text-red-500 !bg-gray-50 hover:!text-red-600 hover:!border-red-600 transition-all duration-200",
        style: { fontWeight: 600 },
      },

      cancelButtonProps: {
        type: "default",
        className: "border-gray-200 text-gray-500 transition-all duration-200",
        style: {
          fontWeight: 600,
        },

        onMouseEnter: (e: any) => {
          e.currentTarget.style.color = activeColor;
          e.currentTarget.style.borderColor = activeColor;
        },
        onMouseLeave: (e: any) => {
          e.currentTarget.style.color = "#64748b";
          e.currentTarget.style.borderColor = "#e2e8f0";
        },
      },

      centered: true,

      async onOk() {
        delete axiosInstance.defaults.headers.common["Authorization"];
        destroyAll();
        onClose();
        await logoutAction();
      },
    });
  };

  return (
    <>
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-100 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest">
            Preview Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto h-full pb-24 text-xs">

          {/* ── LANGUAGE SWITCHER ── */}
          {/* <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              {tLanguage}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "en", flag: "En", label: tEnglish },
                { key: "ne", flag: "🇳🇵", label: tNepali },
              ] as const).map(({ key, flag, label }) => (
                <button
                  key={key}
                  onClick={() => setLocale(key)}
                  disabled={isPending}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold border rounded-lg transition-all ${
                    locale === key
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-gray-200 text-slate-500 hover:border-slate-300 hover:bg-gray-50"
                  } ${isPending ? "opacity-60 cursor-wait" : ""}`}
                >
                  <span className="text-base">{flag}</span>
                  <span>{label}</span>
                  {locale === key && <span className="text-emerald-600">✓</span>}
                </button>
              ))}
            </div>
            {isPending && (
              <p className="text-[10px] text-slate-400 mt-1.5 text-center animate-pulse">
                {tLoading}
              </p>
            )}
          </div> */}

          {/* ── COLOR SCHEME ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              {tColorScheme}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["light", "dark"] as const).map((mode) => (
                <div key={mode} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => setSkinMode(mode)}
                    className={`w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all ${
                      skinMode === mode ? "border-indigo-500" : "border-gray-200"
                    }`}
                  >
                    {mode === "light"
                      ? <PreviewLight active={skinMode === mode} />
                      : <PreviewDark active={skinMode === mode} />}
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {mode === "light" ? tLight : tDark}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── TOPBAR COLOR ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              {tTopbarColor}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "theme"] as const).map((color) => (
                <div key={color} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => setTopbarColor(color)}
                    className={`w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all ${
                      topbarColor === color
                        ? "border-indigo-500"
                        : "border-gray-200"
                    }`}
                  >
                    <PreviewTopbar
                      color={color}
                      activeColor={activeColor}
                      active={topbarColor === color}
                    />
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium capitalize">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── MENU COLOR ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              {tMenuColor}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "brand"] as const).map((color) => (
                <div key={color} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => setMenuColor(color)}
                    className={`w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all ${
                      menuColor === color
                        ? "border-indigo-500"
                        : "border-gray-200"
                    }`}
                  >
                    <PreviewMenuColor
                      color={color}
                      brandColor={activeColor}
                      active={menuColor === color}
                    />
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium capitalize">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── SIDEBAR SIZE ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              {tSidebarSize}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "default", label: tDefault },
                  { key: "compact", label: tCompact },
                  { key: "condensed", label: tCondensed },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => setSidebarSize(key)}
                    className={`w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all ${
                      sidebarSize === key
                        ? "border-indigo-500"
                        : "border-gray-200"
                    }`}
                  >
                    <PreviewSidebarSize
                      size={key}
                      active={sidebarSize === key}
                    />
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium text-center leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── DIRECTION ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              {tDirection}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["ltr", "rtl"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`py-2 text-xs font-bold border rounded transition-all ${
                    direction === d
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-slate-500"
                  }`}
                >
                  {d === "ltr" ? tLtr : tRtl}
                </button>
              ))}
            </div>
          </div>

          {/* ── MAIN UI STYLE ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Main UI Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["default", "softy"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setUiStyle(s)}
                  className={`py-2 text-xs font-bold border rounded transition-all ${
                    uiStyle === s
                      ? "border-emerald-500 text-emerald-700"
                      : "border-gray-200 text-slate-500"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── SIDEBAR STYLE ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Sidebar Style
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  key: "white",
                  cls: "bg-white border border-gray-300",
                  label: "White",
                },
                { key: "light", cls: "bg-[#192a3e]", label: "Light" },
                { key: "dark", cls: "bg-slate-950", label: "Dark" },
                { key: "theme", cls: "", label: "Theme" },
              ].map(({ key, cls, label }) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setSidebarStyle(key as SidebarStyle)}
                    className={`w-full h-8 rounded ${cls} relative ${ring(sidebarStyle === key)}`}
                    style={
                      key === "theme" ? { backgroundColor: activeColor } : {}
                    }
                  >
                    {sidebarStyle === key && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── NAV STYLE ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Nav Sidebar Style
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  key: "white",
                  cls: "bg-white border border-gray-300",
                  label: "White",
                },
                {
                  key: "light",
                  cls: "bg-slate-100 border border-gray-200",
                  label: "Light",
                },
                { key: "dark", cls: "bg-slate-900", label: "Dark" },
                { key: "theme", cls: "", label: "Theme" },
              ].map(({ key, cls, label }) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setNavStyle(key as NavStyle)}
                    className={`w-full h-8 rounded ${cls} relative ${ring(navStyle === key)}`}
                    style={
                      key === "theme" ? { backgroundColor: activeColor } : {}
                    }
                  >
                    {navStyle === key && (
                      <span className="absolute inset-0 flex items-center justify-center text-slate-700 text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── PRIMARY SKIN ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              {tPrimarySkin}
            </label>

            {/* Preset swatches */}
            <div className="grid grid-cols-3 gap-2">
              {primarySkins.map(({ key, label, gradient }) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setPrimarySkin(key as PrimarySkin)}
                    className={`w-full h-8 rounded bg-gradient-to-r ${gradient} relative ${ring(primarySkin === key)}`}
                  >
                    {primarySkin === key && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>

            {/* ── Custom color picker ── */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Custom Color
              </p>
              <div
                onClick={() => colorInputRef.current?.click()}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all hover:border-slate-300 ${
                  primarySkin === "custom"
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-gray-200"
                }`}
              >
                {/* Color preview circle — clicking it opens the native picker */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-md border border-gray-200 shadow-sm"
                    style={{ backgroundColor: customColor }}
                  />
                  {/* Hidden native input */}
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setPrimarySkin("custom");
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Pick a custom color"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-600 leading-tight">
                    {primarySkin === "custom" ? tCustom : tPickAColor}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
                    {customColor}
                  </p>
                </div>

                <Pipette size={14} className="text-slate-400 flex-shrink-0" />
              </div>

              {/* Hex input for manual entry */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-400 font-mono">#</span>
                <input
                  type="text"
                  maxLength={6}
                  value={customColor.replace("#", "")}
                  onChange={(e) => {
                    const val =
                      "#" + e.target.value.replace(/[^0-9a-fA-F]/g, "");
                    if (val.length === 7) {
                      setCustomColor(val);
                      setPrimarySkin("custom");
                    }
                  }}
                  placeholder="e.g. 10b981"
                  className="flex-1 h-7 px-2 text-[11px] font-mono border border-gray-200 rounded focus:outline-none focus:border-slate-400 bg-slate-50 text-slate-700 placeholder-slate-300"
                />
                {primarySkin === "custom" && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    {tActive}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── FOOTER ACTIONS ── */}
          <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-1">
            <button
              onClick={onReset}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all group"
            >
              <div className="p-1 rounded bg-slate-100 group-hover:bg-blue-100 transition-colors">
                <RotateCcw
                  size={14}
                  className="group-hover:rotate-[-45deg] transition-transform duration-300"
                />
              </div>
              {tResetSettings}
            </button>

            <button
              onClick={() => setIsPassModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-all group"
            >
              <div className="p-1 rounded bg-slate-100 group-hover:bg-amber-100 transition-colors">
                <KeyRound size={14} />
              </div>
              {tChangePassword}
            </button>

            <button
              onClick={showLogoutConfirm}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-all group w-full text-left"
            >
              <div className="p-1 rounded bg-rose-50 group-hover:bg-rose-100 transition-colors">
                <LogOut size={14} />
              </div>
              {tLogout}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePassword isOpen={isPassModalOpen} onClose={() => setIsPassModalOpen(false)} />
    </>
  );
}