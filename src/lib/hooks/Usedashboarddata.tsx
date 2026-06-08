"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StudentServices } from "@/services/studentServices";
import { ParentServices } from "@/services/parentServices";
import { ClassServices } from "@/services/classServices";
import { SubjectServices } from "@/services/subjectServices";
import { SectionServices } from "@/services/sectionServices";
import { EnrollmentServices } from "@/services/studentEnrollment";
import { HomeworkServices } from "@/services/homeworkServices";
import { LeaveServices } from "@/services/leaveServices";
import { NotificationServices } from "@/services/notificationServices";
import { AttendanceServices } from "@/services/attendanceServices";
import { FeeServices } from "@/services/feeServices";
import { SessionServices } from "@/services/sessionsServices";
import { TeacherServices } from "@/services/teacherServices";
import { StaffServices } from "@/services/staffServices";
import {
  getCount,
  getItems,
  splitStaffAndTeachers,
} from "@/lib/Dashboardhelpers";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface DashboardCounts {
  students: number;
  teachers: number;
  staff: number;
  staffTeachers: number;
  parents: number;
  classes: number;
  subjects: number;
  sections: number;
  enrollments: number;
  homeworks: number;
  leaves: number;
  notifications: number;
}

export interface EnrollmentItem {
  name: string;
  enrolled: number;
  active: number;
  pct: number;
}

export interface EarningsDataItem {
  month: string;
  earnings: number;
  expenses: number;
  net: number;
}

export interface FeeSummary {
  totalFee: number;
  totalPaid: number;
  totalRemaining: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  collectionPct: number;
}

export interface GenderItem {
  name: string;
  value: number;
  color: string;
}

export interface AttendanceDay {
  day: string;
  present: number;
  absent: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useDashboardData(primaryColor: string) {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync]     = useState<Date | null>(null);

  const [counts, setCounts] = useState<DashboardCounts>({
    students: 0, teachers: 0, staff: 0, staffTeachers: 0,
    parents: 0, classes: 0, subjects: 0, sections: 0,
    enrollments: 0, homeworks: 0, leaves: 0, notifications: 0,
  });

  const [allStudents,    setAllStudents]    = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [allAttendance,  setAllAttendance]  = useState<any[]>([]);
  const [allPayments,    setAllPayments]    = useState<any[]>([]);
  const [allExpenses,    setAllExpenses]    = useState<any[]>([]);
  const [allStudentFees, setAllStudentFees] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentLeaves,   setRecentLeaves]   = useState<any[]>([]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await Promise.allSettled([
        StudentServices.getAllStudents(),
        TeacherServices.getAllTeachers(),
        ParentServices.getAllParents(),
        StaffServices.getAllstaffs(),
        ClassServices.getAllClasses(),
        SessionServices.getSessions(),
        SubjectServices.getAllSubjects(),
        SectionServices.getAllSections(),
        EnrollmentServices.getAllEnrollments(),
        HomeworkServices.getAllHomeworks(),
        LeaveServices.getAllLeaves(),
        NotificationServices.getAllNotifications(),
        AttendanceServices.getStudentAttendance(),
        FeeServices.getAllPayments(),
        FeeServices.getAllExpenses(),
        FeeServices.getAllStudentFees(),
      ]);

      const v = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" ? r.value : null;

      const [
        studR, tchR, parR, stfR,
        clsR, _sesR, subR, secR,
        enrR, hwR, lvR, ntR,
        attR, payR, expR, sfR,
      ] = res.map(v);

      const rawTeachers = getItems(tchR);
      const rawStaff    = getItems(stfR);

      let resolvedTeachers = rawTeachers;
      let resolvedStaff    = rawStaff;

      // Fallback: split only if both dedicated endpoints returned nothing
      if (rawTeachers.length === 0 && rawStaff.length === 0) {
        const combined = getItems(tchR).length ? getItems(tchR) : getItems(stfR);
        const split    = splitStaffAndTeachers(combined);
        resolvedTeachers = split.teachers;
        resolvedStaff    = split.staff;
      }

      setCounts({
        students:     getCount(studR),
        teachers:     resolvedTeachers.length,
        staff:        resolvedStaff.length,
        staffTeachers:[...resolvedTeachers, ...resolvedStaff].length,
        parents:      getCount(parR),
        classes:      getCount(clsR),
        subjects:     getCount(subR),
        sections:     getCount(secR),
        enrollments:  getCount(enrR),
        homeworks:    getCount(hwR),
        leaves:       getCount(lvR),
        notifications:getCount(ntR),
      });

      setAllStudents(getItems(studR));
      setAllEnrollments(getItems(enrR));
      setAllAttendance(getItems(attR));
      setAllPayments(getItems(payR));
      setAllExpenses(getItems(expR));
      setAllStudentFees(getItems(sfR));
      setRecentStudents(getItems(studR).slice(0, 5));
      setRecentLeaves(getItems(lvR).slice(0, 2));
      setLastSync(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived: Gender ───────────────────────────────────────────────────────
  const genderData = useMemo<GenderItem[]>(() => {
    const boys  = allStudents.filter(s => (s.gender || "").toLowerCase() === "male").length;
    const girls = allStudents.filter(s => (s.gender || "").toLowerCase() === "female").length;
    const other = allStudents.length - boys - girls;
    const fallbackBoys  = Math.round(allStudents.length * 0.45);
    const fallbackGirls = allStudents.length - fallbackBoys;
    return [
      { name: "Boys",  value: boys  || fallbackBoys,  color: "#1e293b" },
      { name: "Girls", value: girls || fallbackGirls, color: primaryColor },
      ...(other > 0 && (boys > 0 || girls > 0)
        ? [{ name: "Other", value: other, color: "#94a3b8" }]
        : []),
    ].filter(d => d.value > 0);
  }, [allStudents, primaryColor]);

  // ── Derived: Enrollment by Class ──────────────────────────────────────────
  const enrollmentByClass = useMemo<EnrollmentItem[]>(() => {
    if (!allEnrollments.length) return [];
    const map: Record<string, { total: number; active: number }> = {};
    allEnrollments.forEach((e: any) => {
      const cls =
        e.class_name ||
        e.class_assigned_name ||
        `Class ${e.class_assigned}` ||
        "Unknown";
      if (!map[cls]) map[cls] = { total: 0, active: 0 };
      map[cls].total++;
      if (e.is_active !== false) map[cls].active++;
    });
    return Object.entries(map)
      .map(([name, { total, active }]) => ({
        name,
        enrolled: total,
        active,
        pct: total > 0 ? Math.round((active / total) * 100) : 0,
      }))
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 8);
  }, [allEnrollments]);

  // ── Derived: Earnings Chart ───────────────────────────────────────────────
  const earningsChartData = useMemo<EarningsDataItem[]>(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, { earnings: number; expenses: number }> = {};
    MONTHS.forEach(m => { map[m] = { earnings: 0, expenses: 0 }; });

    allPayments.forEach((p: any) => {
      const d = new Date(p.paid_at || p.created_at || p.date || "");
      if (isNaN(d.getTime())) return;
      map[MONTHS[d.getMonth()]].earnings += Number(p.amount) || 0;
    });
    allExpenses.forEach((e: any) => {
      const d = new Date(e.date || e.created_at || "");
      if (isNaN(d.getTime())) return;
      map[MONTHS[d.getMonth()]].expenses += Number(e.amount) || 0;
    });

    return MONTHS.map(month => ({
      month,
      earnings: map[month].earnings,
      expenses: map[month].expenses,
      net: map[month].earnings - map[month].expenses,
    })).filter(d => d.earnings > 0 || d.expenses > 0);
  }, [allPayments, allExpenses]);

  // ── Derived: Fee Summary ──────────────────────────────────────────────────
  const feeSummary = useMemo<FeeSummary>(() => {
    const totalFee       = allStudentFees.reduce((s, i) => s + Number(i.total_amount     || 0), 0);
    const totalPaid      = allStudentFees.reduce((s, i) => s + Number(i.paid_amount      || 0), 0);
    const totalRemaining = allStudentFees.reduce((s, i) => s + Number(i.remaining_amount || 0), 0);
    const paidCount      = allStudentFees.filter(i => i.status === "paid").length;
    const partialCount   = allStudentFees.filter(i => i.status === "partial").length;
    const unpaidCount    = allStudentFees.filter(i => i.status === "unpaid").length;
    const collectionPct  = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
    return { totalFee, totalPaid, totalRemaining, paidCount, partialCount, unpaidCount, collectionPct };
  }, [allStudentFees]);

  // ── Derived: Attendance by Weekday ────────────────────────────────────────
  const attendanceChartData = useMemo<AttendanceDay[] | null>(() => {
    const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat"];
    const map: Record<string, { present: number; absent: number }> = {};
    DAYS.forEach(d => { map[d] = { present: 0, absent: 0 }; });

    allAttendance.forEach((a: any) => {
      const d = new Date(a.date || a.created_at || "");
      if (isNaN(d.getTime())) return;
      const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
      if (!map[day]) return;
      const s = (a.status || "").toLowerCase();
      if (s === "present" || s === "late") map[day].present++;
      else map[day].absent++;
    });

    const res = DAYS.map(day => ({ day, ...map[day] }))
      .filter(d => d.present > 0 || d.absent > 0);
    return res.length > 0 ? res : null;
  }, [allAttendance]);

  // ── Derived scalars ───────────────────────────────────────────────────────
  const presentTotal  = allAttendance.filter(a =>
    ["present","late"].includes((a.status || "").toLowerCase())
  ).length;
  const absentTotal   = allAttendance.length - presentTotal;
  const attendancePct = allAttendance.length > 0
    ? Math.round((presentTotal / allAttendance.length) * 100) : 0;

  const totalEarnings = earningsChartData.reduce((s, d) => s + d.earnings, 0);
  const totalExpenses = earningsChartData.reduce((s, d) => s + d.expenses, 0);
  const totalPayCount = allPayments.length;
  const avgEnrollPct  = enrollmentByClass.length
    ? Math.round(enrollmentByClass.reduce((s, d) => s + d.pct, 0) / enrollmentByClass.length) : 0;

  const bestMonth = earningsChartData.length
    ? earningsChartData.reduce((best, d) => d.net > best.net ? d : best, earningsChartData[0])
    : null;

  return {
    // State
    loading, error, refreshing, lastSync,
    // Counts
    counts,
    // Lists
    recentStudents, recentLeaves,
    // Derived
    genderData,
    enrollmentByClass,
    earningsChartData,
    feeSummary,
    attendanceChartData,
    // Scalars
    presentTotal, absentTotal, attendancePct,
    totalEarnings, totalExpenses, totalPayCount,
    avgEnrollPct, bestMonth,
    // Actions
    refresh: () => fetchAll(true),
  };
}