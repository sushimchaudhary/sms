"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarDays,
  ArrowLeft,
  Search,
  ChevronRight,
  X,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Select } from "antd";
import { PublicServices } from "@/services/publicsServices";
import Image from "next/image";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface LeaveSummaryDetail {
  casual: number;
  sick: number;
  festival: number;
  maternity: number;
  funeral: number;
}

interface LeaveSummary {
  allocated: LeaveSummaryDetail;
  used: LeaveSummaryDetail;
  remaining: LeaveSummaryDetail;
  total_allocated: number;
  total_used: number;
  total_remaining: number;
}

interface LeaveAllocation {
  id: number;
  teacher_name: string | null;
  staff_name: string | null;
  summary: LeaveSummary;
  casual_leave: number;
  sick_leave: number;
  festival_leave: number;
  maternity_leave: number;
  funeral_leave: number;
}

/* ─── Leave type config ──────────────────────────────────────────────────── */
const LEAVE_TYPE_KEYS: {
  key: keyof LeaveSummaryDetail;
  label: string;
  dot: string;
  allocatedCls: string;
  barCls: string;
}[] = [
  { key: "casual",    label: "Casual",    dot: "bg-blue-400",   allocatedCls: "bg-blue-50 text-blue-700",    barCls: "bg-blue-400"   },
  { key: "sick",      label: "Sick",      dot: "bg-red-400",    allocatedCls: "bg-red-50 text-red-700",      barCls: "bg-red-400"    },
  { key: "festival",  label: "Festival",  dot: "bg-purple-400", allocatedCls: "bg-purple-50 text-purple-700", barCls: "bg-purple-400" },
  { key: "maternity", label: "Maternity", dot: "bg-orange-400", allocatedCls: "bg-orange-50 text-orange-700", barCls: "bg-orange-400" },
  { key: "funeral",   label: "Funeral",   dot: "bg-slate-400",  allocatedCls: "bg-slate-50 text-slate-700",   barCls: "bg-slate-400"  },
];

/* ─── Detail Modal ───────────────────────────────────────────────────────── */
const DetailModal = ({
  l,
  onClose,
}: {
  l: LeaveAllocation;
  onClose: () => void;
}) => {
  const name = l.teacher_name || l.staff_name || "Unknown";
  const role = l.teacher_name ? "Teacher" : "Staff";
  const { total_allocated, total_used, total_remaining } = l.summary;
  const usagePercent =
    total_allocated > 0
      ? Math.min(100, Math.round((total_used / total_allocated) * 100))
      : 0;
  const overUsed = total_remaining < 0;

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Modal header */}
        <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#243c5a] to-[#2b98e1]">
          <div>
            <div className="text-white font-semibold text-[15px]">{name}</div>
            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
              role === "Teacher" ? "bg-blue-400/30 text-blue-100" : "bg-amber-400/30 text-amber-100"
            }`}>
              {role}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-2 space-y-3">
          {/* Summary totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-1 text-center">
              <div className="text-[11px] text-gray-400 mb-1">Allocated</div>
              <div className="text-[22px] font-semibold text-gray-700">{total_allocated}</div>
              <div className="text-[10px] text-gray-400">days</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-1 text-center">
              <div className="text-[11px] text-amber-500 mb-1">Used</div>
              <div className="text-[22px] font-semibold text-amber-600">{total_used}</div>
              <div className="text-[10px] text-amber-400">days</div>
            </div>
            <div className={`rounded-lg p-1 text-center ${overUsed ? "bg-red-50" : "bg-green-50"}`}>
              <div className={`text-[11px] mb-1 ${overUsed ? "text-red-400" : "text-green-500"}`}>Remaining</div>
              <div className={`text-[22px] font-semibold ${overUsed ? "text-red-600" : "text-green-600"}`}>{total_remaining}</div>
              <div className={`text-[10px] ${overUsed ? "text-red-400" : "text-green-400"}`}>days</div>
            </div>
          </div>

          {/* Overall progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500 font-medium">Overall usage</span>
              <span className={`text-[11px] font-semibold ${overUsed ? "text-red-600" : "text-gray-600"}`}>
                {usagePercent}%{overUsed && " — over limit"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overUsed ? "bg-red-500" : usagePercent >= 80 ? "bg-amber-400" : "bg-[#2b98e1]"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Per-type breakdown */}
          <div>
            <div className="text-[11px] font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              Leave breakdown by type
            </div>
            <div className="space-y-2">
              {LEAVE_TYPE_KEYS.map((t) => {
                const allocated = l.summary.allocated[t.key];
                const used      = l.summary.used[t.key];
                const remaining = l.summary.remaining[t.key];
                const isOver    = remaining < 0;
                const pct       = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;

                return (
                  <div key={t.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                        <span className="text-[12px] text-gray-700 font-medium">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-gray-400">{used}/{allocated} used</span>
                        <span className={`font-semibold ${isOver ? "text-red-600" : remaining === 0 ? "text-gray-400" : "text-green-600"}`}>
                          {isOver ? `${remaining} (over)` : remaining === allocated ? "none used" : `${remaining} left`}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? "bg-red-400" : t.barCls}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed table */}
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-1 text-left font-semibold text-gray-400">Type</th>
                  <th className="px-3 py-1 text-center font-semibold text-gray-400">Allocated</th>
                  <th className="px-3 py-1 text-center font-semibold text-gray-400">Used</th>
                  <th className="px-3 py-1 text-center font-semibold text-gray-400">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {LEAVE_TYPE_KEYS.map((t) => {
                  const allocated = l.summary.allocated[t.key];
                  const used      = l.summary.used[t.key];
                  const remaining = l.summary.remaining[t.key];
                  const isOver    = remaining < 0;
                  return (
                    <tr key={t.key} className="border-t border-gray-50">
                      <td className="px-3 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                          <span className="text-gray-600 font-medium">{t.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${t.allocatedCls}`}>{allocated}</span>
                      </td>
                      <td className="px-3 py-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${used > 0 ? "bg-amber-50 text-amber-700" : "text-gray-400"}`}>
                          {used > 0 ? used : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${
                          isOver                    ? "bg-red-50 text-red-700"
                          : remaining === allocated  ? "text-gray-400"
                          :                           "bg-green-50 text-green-700"
                        }`}>
                          {isOver ? remaining : remaining === allocated ? "—" : remaining}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── List Row ───────────────────────────────────────────────────────────── */
const AllocationRow = ({
  l,
  index,
  onClick,
}: {
  l: LeaveAllocation;
  index: number;
  onClick: () => void;
}) => {
  const name = l.teacher_name || l.staff_name || "Unknown";
  const role = l.teacher_name ? "Teacher" : "Staff";
  const { total_allocated, total_used, total_remaining } = l.summary;
  const usagePercent =
    total_allocated > 0
      ? Math.min(100, Math.round((total_used / total_allocated) * 100))
      : 0;
  const overUsed = total_remaining < 0;

  return (
    <tr
      className="border-b border-gray-50 hover:bg-slate-50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <td className="px-4 py-3 text-[11px] text-gray-400 w-8">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-800 text-[13px]">{name}</div>
        <span className={`mt-0.5 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
          role === "Teacher" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
        }`}>
          {role}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-[13px] font-semibold text-gray-700">{total_allocated}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-[13px] font-semibold text-amber-600">{total_used}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-[13px] font-semibold ${overUsed ? "text-red-600" : "text-green-600"}`}>
          {total_remaining}
          {overUsed && (
            <span className="ml-1 text-[9px] bg-red-50 text-red-500 px-1 py-0.5 rounded-full font-medium">over</span>
          )}
        </span>
      </td>
      <td className="px-4 py-3 w-40">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                overUsed ? "bg-red-400" : usagePercent >= 80 ? "bg-amber-400" : "bg-green-400"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <span className={`text-[10px] font-medium w-7 text-right shrink-0 ${overUsed ? "text-red-500" : "text-gray-400"}`}>
            {usagePercent}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center gap-1 text-[11px] text-[#2b98e1] font-medium">
          View <ChevronRight size={13} />
        </span>
      </td>
    </tr>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LeaveAllocationsAllPage() {
  const [leaves, setLeaves]     = useState<LeaveAllocation[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<LeaveAllocation | null>(null);

  const [searchQuery,  setSearchQuery]  = useState("");
  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState<"over" | "normal" | "">("");

  useEffect(() => {
    (async () => {
      try {
        const data = await PublicServices.getPublicLeaveAllocations();
        setLeaves(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      leaves.filter((l) => {
        const name = (l.teacher_name || l.staff_name || "").toLowerCase();
        const role = l.teacher_name ? "teacher" : "staff";
        const over = l.summary.total_remaining < 0;
        return (
          (!searchQuery  || name.includes(searchQuery.toLowerCase())) &&
          (!roleFilter   || role === roleFilter) &&
          (!statusFilter || (statusFilter === "over" ? over : !over))
        );
      }),
    [leaves, searchQuery, roleFilter, statusFilter],
  );

  const totalAllocated = leaves.reduce((a, l) => a + l.summary.total_allocated, 0);
  const totalUsed      = leaves.reduce((a, l) => a + l.summary.total_used,      0);
  const totalRemaining = leaves.reduce((a, l) => a + l.summary.total_remaining, 0);
  const overLimitCount = leaves.filter((l) => l.summary.total_remaining < 0).length;

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
            <CalendarDays size={16} className="text-amber-500" />
            <span className="text-[15px] font-semibold text-gray-800">Leave Allocations</span>
          </div>
        </div>
        <Image width={80} height={32} src="/logo_edify.png" alt="Logo" className="h-8 w-auto" />
      </nav>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-[#243c5a] to-[#56c5de] px-6 py-8">
        <p className="text-amber-100 text-[11px] tracking-widest uppercase mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-white text-xl font-semibold">All Leave Allocations</h1>
        <p className="text-amber-100 text-sm mt-1">Click any row to view full leave breakdown</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-100 rounded p-4 shadow-sm">
            <div className="text-xl font-semibold text-gray-800">{leaves.length}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Total people</div>
          </div>
          <div className="bg-white border border-gray-100 rounded p-4 shadow-sm">
            <div className="text-xl font-semibold text-gray-700">{totalAllocated}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Days allocated</div>
          </div>
          <div className="bg-white border border-gray-100 rounded p-4 shadow-sm">
            <div className="text-xl font-semibold text-amber-600">{totalUsed}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Days used</div>
          </div>
          <div className="bg-white border border-gray-100 rounded p-4 shadow-sm">
            <div className={`text-xl font-semibold ${overLimitCount > 0 ? "text-red-600" : "text-green-600"}`}>
              {overLimitCount > 0 ? overLimitCount : totalRemaining}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {overLimitCount > 0 ? "people over quota" : "days remaining"}
            </div>
          </div>
        </div>

        {/* ── List table ── */}
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
              <CalendarDays size={15} className="text-amber-500" />
              All allocations
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({filtered.length} of {leaves.length})
              </span>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 text-[12px] border border-gray-200 rounded outline-none focus:border-[#2b98e1] transition-colors w-[160px]"
                />
              </div>
              <Select
                size="small" style={{ width: 120 }} placeholder="All roles" allowClear
                value={roleFilter || undefined}
                onChange={(value) => setRoleFilter(value ?? "")}
                options={[{ value: "teacher", label: "Teacher" }, { value: "staff", label: "Staff" }]}
              />
              <Select
                size="small" style={{ width: 130 }} placeholder="All statuses" allowClear
                value={statusFilter || undefined}
                onChange={(value) => setStatusFilter((value ?? "") as "over" | "normal" | "")}
                options={[{ value: "normal", label: "Within limit" }, { value: "over", label: "Over limit" }]}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                {leaves.length === 0 ? "No leave allocations found." : "No records match the selected filters."}
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 border-b border-gray-100">#</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 border-b border-gray-100">Name</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 border-b border-gray-100 text-center">Allocated</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 border-b border-gray-100 text-center">Used</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 border-b border-gray-100 text-center">Remaining</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 border-b border-gray-100">Usage</th>
                    <th className="px-4 py-3 border-b border-gray-100" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => (
                    <AllocationRow
                      key={l.id}
                      l={l}
                      index={i}
                      onClick={() => setSelected(l)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400">
              Showing {filtered.length} of {leaves.length} leave allocations · Click a row to view full details
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <DetailModal l={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}