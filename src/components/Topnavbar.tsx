"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { US, NP } from "country-flag-icons/react/3x2";
import {
  Menu,
  Bell,
  Settings,
  User,
  Globe,
  Calendar,
  Clock,
  GlobeLock,
  ChevronDown,
} from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { SchoolServices } from "@/services/schoolServices";
import { TeacherServices } from "@/services/teacherServices";
import { StudentServices } from "@/services/studentServices";
import { StaffServices } from "@/services/staffServices";
import { ParentServices } from "@/services/parentServices";
import { NotificationServices } from "@/services/notificationServices";
import { useNotifications } from "@/lib/context/NotificationContext";
import { useLanguage } from "@/lib/context/LanguageContext";
import cookies from "js-cookie";
import { SessionServices } from "@/services/sessionsServices";
// नेपाली मितिको लागि (यदि यो लाइब्रेरी छैन भने install गर्नुहोला: npm i nepali-date-converter)
import NepaliDate from "nepali-date-converter";
import { useTheme } from "@/lib/context/ThemeContext";

// Map our UI language codes → Google Translate language codes
const LANGUAGES = [
  { code: "ne", label: "नेपाली" },
  { code: "en", label: "English" },
];

// ── Base URL + resolvePhoto ───────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function resolvePhoto(photo?: string | null): string {
  if (!photo) return "";
  return photo.startsWith("http") ? photo : `${BASE_URL}${photo}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type NavStyle = "default" | "dark";
export type TopbarColor = "light" | "dark" | "theme";

interface TopNavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  topbarColor: TopbarColor;
  navStyle: NavStyle;
  activeColor: string;
  layoutMode: "fluid" | "boxed" | "detached";
  onSettingsOpen: () => void;
}

interface AcademicSession {
  id: number;
  name: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

function triggerGoogleTranslate(langCode: string) {
  // "en" means restore original — Google uses "/" as the cookie value for that
  const selectEl = document.querySelector<HTMLSelectElement>(
    "#google_translate_element select",
  );
  if (!selectEl) return;

  selectEl.value = langCode;
  selectEl.dispatchEvent(new Event("change"));
}

// ── TopNavbar Component ───────────────────────────────────────────────────────
export default function TopNavbar({
  sidebarOpen,
  setSidebarOpen,
  topbarColor,
  navStyle,
  activeColor,
  layoutMode,
  onSettingsOpen,
}: TopNavbarProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const { locale, setLocale, isPending } = useLanguage();
  const role = user?.role;

  const [schoolName, setSchoolName] = useState<string>("");
  const [schoolLogo, setSchoolLogo] = useState<string>("");
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string>("");
  const { primaryColor } = useTheme();
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadNotifications = latestNotifications.filter((n) => !n.is_read);
  const currentUnreadCount = unreadNotifications.length;
  const { refreshNotifications } = useNotifications();
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[1]);

  // ── Session States ──
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const sessionRef = useRef<HTMLDivElement>(null);

  // ── Live Date State ──
  const [formattedDates, setFormattedDates] = useState({ eng: "", nep: "" });

  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Formatted Dates Generator ──
  useEffect(() => {
    const today = new Date();

    // English Date Format (e.g., Mon, Jun 1, 2026)
    const engDateStr = today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Nepali Date Format (e.g., २०८३ जेठ १८)
    let nepDateStr = "";
    try {
      const nepaliDate = new NepaliDate(today);
      nepDateStr = nepaliDate.format("ddd, DD MMMM YYYY", "np");
    } catch (e) {
      nepDateStr = today.toLocaleDateString("ne-NP");
    }

    setFormattedDates({ eng: engDateStr, nep: nepDateStr });
  }, []);

  // ── Fetch Sessions ──
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await SessionServices.getSessions();
        const sessionData: AcademicSession[] = Array.isArray(res)
          ? res
          : res?.results || res?.data || [];
        setSessions(sessionData);

        const savedSession =
          cookies.get("selected_session_id") ||
          localStorage.getItem("selected_session_id");

        if (savedSession) {
          setSelectedSessionId(Number(savedSession));
        } else {
          const activeSession = sessionData.find((s) => s.is_active);
          if (activeSession) {
            setSelectedSessionId(activeSession.id);
            cookies.set("selected_session_id", String(activeSession.id));
            localStorage.setItem(
              "selected_session_id",
              String(activeSession.id),
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    };

    if (user && role !== "superadmin") {
      fetchSessions();
    }
  }, [user, role]);

  // ── Handle Session Change ──
  const handleSessionChange = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    cookies.set("selected_session_id", String(sessionId));
    localStorage.setItem("selected_session_id", String(sessionId));
    setSessionDropdownOpen(false);
    window.location.reload();
  };

  const handleMarkAsRead = async (id: number, isRead: boolean) => {
    // यदि पहिले नै read भइसकेको छ भने केही नगर्ने
    if (isRead) {
      setNotifDropdownOpen(false);
      return;
    }

    try {
      await NotificationServices.getAllNotifications();

      await refreshNotifications();

      // ३. UI मा तत्काल status अपडेट गर्ने
      setLatestNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      console.error("Error marking as read", err);
    }
    setNotifDropdownOpen(false);
  };

  // ── Fetch latest 5 notifications ──
  // useEffect(() => {
  //   const fetchLatest = async () => {
  //     try {
  //       const res = await NotificationServices.getAllNotifications();
  //       const all = Array.isArray(res) ? res : res?.results || res?.data || [];
  //       setLatestNotifications([...all].reverse().slice(0, 3));
  //     } catch {}
  //   };
  //   if (user) fetchLatest();
  // }, [user]);

  // TopNavbar.tsx को useEffect
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await NotificationServices.getAllNotifications();
        const all = Array.isArray(res) ? res : res?.results || res?.data || [];

        // फिल्टर नहटाउने हो भने, कम्तिमा पछिल्ला ५-१० वटा नोटिफिकेसन राख्नुहोस्
        // आजको मात्र भन्दा पनि पछिल्ला नोटिफिकेसन देखाउनु राम्रो हुन्छ
        const sorted = [...all].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setLatestNotifications(sorted.slice(0, 5)); // ५ वटा सम्म देखाउनुहोस्
      } catch (error) {
        console.error("Error", error);
      }
    };

    if (user) fetchLatest();
  }, [user]);
  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (
        sessionRef.current &&
        !sessionRef.current.contains(e.target as Node)
      ) {
        setSessionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch user photo ──
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
          const photo =
            dash?.staff?.photo_url ||
            dash?.staff?.photo ||
            dash?.photo_url ||
            dash?.photo;
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

  // ── Fetch school name + logo ──
  useEffect(() => {
    const fetchSchoolData = async () => {
      const userInfoCookie = cookies.get("user_info");
      const cookieUser = userInfoCookie ? JSON.parse(userInfoCookie) : null;
      const schoolId =
        user?.school_id ||
        user?.school ||
        cookieUser?.school_id ||
        cookieUser?.school;

      if (!schoolId) return;

      try {
        setSchoolLoading(true);
        const res = await SchoolServices.getSingleSchool(schoolId);
        const data = res?.data || res;
        setSchoolName(data?.name || data?.school_name || "");
        setSchoolLogo(resolvePhoto(data?.logo_url || data?.logo || ""));
      } catch {
        setSchoolName("");
        setSchoolLogo("");
      } finally {
        setSchoolLoading(false);
      }
    };

    if (role && role !== "superadmin") fetchSchoolData();
  }, [user?.school_id, user?.school, role]);

  // ── Style helpers ──
  const isDarkNav =
    topbarColor === "dark" ||
    topbarColor === "theme" ||
    (topbarColor === "light" && navStyle === "dark");

  const getNavClass = () => {
    if (topbarColor === "dark")
      return "bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm";
    if (topbarColor === "theme") return "text-white shadow-sm";
    if (navStyle === "dark")
      return "bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm";
    return "bg-white/95 backdrop-blur-md border-b border-gray-100 text-slate-700 shadow-sm";
  };

  const getNavInlineStyle = () =>
    topbarColor === "theme" ? { backgroundColor: activeColor } : {};

  const getRoleLabel = (r: string | undefined) => {
    if (!r) return "";
    try {
      return t(`roles.${r}`);
    } catch {
      return r;
    }
  };

  const langBtnClass = (key: "en" | "ne") =>
    `flex items-center justify-center p-1 rounded-md transition-all select-none w-7 h-7 flex-shrink-0 ${
      isPending ? "opacity-50 cursor-wait" : "cursor-pointer"
    } ${
      locale === key
        ? isDarkNav
          ? "bg-white/20 text-white shadow-inner ring-1 ring-white/30"
          : "bg-slate-100 text-slate-900 shadow-inner ring-1 ring-slate-200"
        : isDarkNav
          ? "text-white/60 hover:text-white hover:bg-white/10"
          : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
    }`;

  const currentSessionName =
    sessions.find((s) => s.id === selectedSessionId)?.name || "Select Session";

  const getShortName = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  function handleLangChange(lang: (typeof LANGUAGES)[0]) {
    setSelectedLang(lang);
    setLangOpen(false);
    triggerGoogleTranslate(lang.code);
  }

  return (
    <header
      className={`h-16 flex items-center justify-between px-1 sticky top-0 z-40 transition-all ${getNavClass()} ${
        layoutMode === "detached" ? "rounded-2xl mt-2 mx-4" : ""
      }`}
      style={getNavInlineStyle()}
    >
      {/* ── LEFT SECTION ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-2 rounded-lg transition-colors ${
            isDarkNav
              ? "text-slate-300 hover:text-white hover:bg-white/10"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <Menu size={22} />
        </button>

        {role !== "superadmin" && user ? (
          <div className="flex items-center gap-3">
            {/* {schoolLogo && (
              <img src={schoolLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm hidden sm:block" />
            )} */}
            <div className="flex flex-col leading-tight border-r pr-4 border-slate-200 dark:border-slate-700">
              <span
                className={`text-sm font-semibold tracking-tight ${isDarkNav ? "text-white" : "text-slate-800"}`}
              >
                {schoolLoading ? (
                  t("common.loading")
                ) : (
                  <>
                    {/* डेस्कटप (md+) को लागि पूरा नाम */}
                    <span className="hidden md:inline">
                      {schoolName || user?.name}
                    </span>

                    {/* मोबाइल (sm) को लागि पहिलो अक्षर मात्र (उदा: S) */}
                    <span className="md:hidden">
                      {getShortName(schoolName || user?.name || "")}
                    </span>
                  </>
                )}
              </span>
              <span
                className={`text-[11px] font-medium opacity-70 mt-0.5 ${isDarkNav ? "text-slate-300" : "text-slate-500"}`}
              >
                {getRoleLabel(role)}
              </span>
            </div>
          </div>
        ) : (
          role === "superadmin" && (
            <div className="border-r pr-4 border-slate-200 dark:border-slate-700">
              <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50">
                {getRoleLabel(role)}
              </span>
            </div>
          )
        )}

        {/* ── LIVE MULTI-LANGUAGE DATE ── */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium pl-1">
          <Clock
            size={14}
            className={`opacity-60 ${isDarkNav ? "text-slate-300" : "text-slate-500"}`}
          />
          <div className="flex items-center gap-1.5">
            <span className={isDarkNav ? "text-slate-200" : "text-slate-700"}>
              {formattedDates.eng}
            </span>
            <span className="opacity-40">|</span>
            <span className="font-semibold" style={{ color: primaryColor }}>
              {formattedDates.nep}
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT SECTION ── */}
      <div className="flex items-center gap-4 overflow-visible relative">
        {/* ── SESSION DROPDOWN ── */}
        {role !== "superadmin" && sessions.length > 0 && (
          <div ref={sessionRef} className="relative">
            <button
              onClick={() => setSessionDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm ${
                isDarkNav
                  ? "bg-white/10 border-white/10 text-white hover:bg-white/25"
                  : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Calendar size={14} className="opacity-70 text-blue-500" />

              {/* sm डिभाइसमा नाम लुक्छ, md देखि माथि देखिन्छ */}
              <span className="hidden md:inline">{currentSessionName}</span>

              <span className="text-[9px] opacity-50 scale-75">▼</span>
            </button>

            {sessionDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-[99999] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  Academic Sessions
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSessionChange(session.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors mb-0.5 last:mb-0 ${
                        selectedSessionId === session.id
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="truncate mr-2">{session.name}</span>
                      {session.is_active && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-medium flex-shrink-0">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Language Switcher ── */}
        {/* <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 flex-shrink-0 select-none">
          <button
            onClick={() => setLocale("en")}
            disabled={isPending}
            className={langBtnClass("en")}
            title="Switch to English"
          >
            <US
              title="United States"
              className="w-4 h-auto rounded-sm object-cover aspect-[3/2]"
            />
          </button>
          <button
            onClick={() => setLocale("ne")}
            disabled={isPending}
            className={langBtnClass("ne")}
            title="नेपालीमा बदल्नुहोस्"
          >
            <NP
              title="Nepal"
              className="w-4 h-auto rounded-sm object-cover aspect-[3/2]"
            />
          </button>
        </div> */}

        {/* ── Google Translate custom trigger ── */}
        <div className="relative" ref={langRef}>
         <button
            onClick={() => setLangOpen((o) => !o)}
            // border र text मा primaryColor प्रयोग गरियो
            className="flex items-center gap-1.5 cursor-pointer rounded px-2.5 py-1 text-xs font-medium transition-colors hover:bg-gray-50 border"
            style={{ 
              borderColor: primaryColor, 
              color: primaryColor 
            }}
          >
            <Globe className="w-4 h-4" style={{ color: primaryColor }} />
            <span>{selectedLang.label}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`}
            />
          </button>

          {langOpen && (
            <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[130px] overflow-hidden z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 flex items-center justify-between ${
                    selectedLang.code === lang.code
                      ? "font-bold"
                      : "text-gray-600"
                  }`}
                  // Active छ भने primaryColor प्रयोग गर्ने, नत्र ग्रे
                  style={{
                    color: selectedLang.code === lang.code ? primaryColor : "",
                  }}
                >
                  {lang.label}
                  {selectedLang.code === lang.code && (
                    <span className="ml-2">▸</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Notification Bell ── */}
        <div ref={notifRef} className="relative isolate">
          <button
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            className={`relative p-2 ...`}
          >
            <Bell size={20} />
            {/* यहाँ unreadCount को साटो currentUnreadCount प्रयोग गर्नुहोस् */}
            {currentUnreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {notifDropdownOpen && (
            <div className="fixed right-4 top-16 w-[340px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-[99999] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t("nav.notifications")}
                </span>
                {currentUnreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                    {currentUnreadCount}
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                {latestNotifications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    {t("nav.notifications")}
                  </div>
                ) : (
                  latestNotifications.map((n) => (
                    <Link
                      href="/notification"
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.is_read)}
                      className="block"
                    >
                      <div
                        className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          !n.is_read
                            ? "bg-blue-50/40 dark:bg-blue-950/10 hover:bg-blue-50/70"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        {/* ── DOT INDICATOR ── */}
                        <div className="mt-1 flex-shrink-0">
                          {!n.is_read ? (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                          ) : (
                            <div className="w-2 h-2" /> // यो भाग खाली छोड्नुहोस् वा read को लागि icon राख्न सक्नुहुन्छ
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs truncate ${!n.is_read ? "font-semibold text-slate-800 dark:text-slate-200" : "text-slate-500"}`}
                          >
                            {n.title}
                          </p>

                          {/* ── READ STATUS LABEL (थपिएको भाग) ── */}
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-slate-400 truncate">
                              {n.created_by_email} · {n.target_role}
                            </p>
                            {n.is_read && (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                Read
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            {new Date(n.created_at).toLocaleDateString(
                              locale === "ne" ? "ne-NP" : "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <Link
                href="/notification"
                onClick={() => setNotifDropdownOpen(false)}
              >
                <div className="px-4 py-3 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                  {t("nav.allNotifications")} →
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* ── Profile Avatar ── */}
        {role && (
          <Link href={`/${role}/profile`}>
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:scale-105 active:scale-95 shadow-sm transition-all cursor-pointer">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={user?.name || "Profile"}
                  className="w-full h-full object-cover aspect-square"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={schoolName || "School"}
                  className="w-full h-full object-cover aspect-square"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <User size={18} className="text-slate-500" />
              )}
            </div>
          </Link>
        )}

        {/* ── Settings Toggle ── */}
        <button
          onClick={onSettingsOpen}
          className={`p-2 rounded-lg transition-colors ${
            isDarkNav
              ? "text-slate-300 hover:text-white hover:bg-white/10"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
