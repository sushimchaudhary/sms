"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  BadgeCheck,
  BadgeX,
  ArrowLeft,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Select } from "antd";
import { PublicServices } from "@/services/publicsServices";
import Image from "next/image";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface StaffAttendance {
  id: number;
  full_name: string;
  user_email: string;
  date: string;
  status: "present" | "absent";
  check_in: string;
  check_out: string;
  remarks: string;
  is_self_marked: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const today = new Date().toISOString().split("T")[0];

const StatusBadge = ({ status }: { status: string }) =>
  status === "present" ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
      <BadgeCheck size={12} /> Present
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
      <BadgeX size={12} /> Absent
    </span>
  );

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function StaffAttendanceAllPage() {
  const [staff, setStaff] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await PublicServices.getPublicStaffAttendance();
        setStaff(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayStaff = useMemo(
    () => staff.filter((s) => s.date === today),
    [staff],
  );

  const filtered = useMemo(
    () =>
      todayStaff.filter(
        (s) =>
          (!statusFilter || s.status === statusFilter) &&
          (!searchQuery ||
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.user_email.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [todayStaff, statusFilter, searchQuery],
  );

  const presentCount = todayStaff.filter((s) => s.status === "present").length;
  const absentCount  = todayStaff.filter((s) => s.status === "absent").length;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 shadow-sm relative z-10">
            <Image src="/edify.png" alt="Loading..." width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div className="absolute w-24 h-24 border-4 border-transparent border-t-[#2b98e1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#2b98e1] transition-colors"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to Overview</span>
          </Link>
          <span className="text-gray-200 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            <span className="text-[15px] font-semibold text-gray-800">
              Staff Attendance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Image width={80} height={32} src="/logo_edify.png" alt="Logo" className="h-8 w-auto" />
        </div>
      </nav>

      {/* ── Hero strip ── */}
      <div className="bg-gradient-to-r from-[#243c5a] to-[#2b98e1] px-6 py-8">
        <p className="text-blue-200 text-[11px] tracking-widest uppercase mb-1">{dateLabel}</p>
        <h1 className="text-white text-xl font-semibold">All Staff Attendance</h1>
        <p className="text-blue-300 text-sm mt-1">Complete list of staff check-ins for today</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-800">{todayStaff.length}</div>
              <div className="text-[11px] text-gray-500">Total staff</div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-green-50 text-green-600 flex items-center justify-center">
              <BadgeCheck size={18} />
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-800">{presentCount}</div>
              <div className="text-[11px] text-gray-500">Present</div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-red-50 text-red-600 flex items-center justify-center">
              <BadgeX size={18} />
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-800">{absentCount}</div>
              <div className="text-[11px] text-gray-500">Absent</div>
            </div>
          </div>
        </div>

        {/* ── Full table ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header with filters */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
              <Users size={15} className="text-blue-600" />
              Staff list
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({filtered.length} of {todayStaff.length})
              </span>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {/* Search box */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 text-[12px] border border-gray-200 rounded outline-none focus:border-[#2b98e1] transition-colors w-[200px]"
                />
              </div>

              <Select
                size="small"
                style={{ width: 130 }}
                placeholder="All statuses"
                allowClear
                value={statusFilter || undefined}
                onChange={(value) => setStatusFilter(value ?? "")}
                options={[
                  { value: "present", label: "Present" },
                  { value: "absent",  label: "Absent"  },
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                {todayStaff.length === 0
                  ? "No staff attendance recorded for today."
                  : "No records match the selected filters."}
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">#</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">Name</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">Email</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">Check-in</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">Check-out</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">Remarks</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">Self-marked</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 border-b border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-[11px]">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.full_name}</td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">{s.user_email}</td>
                      <td className="px-4 py-3 text-gray-600">{s.check_in  || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{s.check_out || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-[11px]">{s.remarks || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {s.is_self_marked ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400">
              Showing {filtered.length} of {todayStaff.length} staff records for {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}