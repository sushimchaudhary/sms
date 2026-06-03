"use client";

import React, { useState } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import {
  Search,
  X,
  Users,
  Filter,
  SlidersHorizontal,
  Calendar,
} from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import StudentAttendanceTable from "@/components/dashboard/attendance/studentAttendanceTable";
import BulkAttendanceForm from "@/components/dashboard/attendance/bulkStudentAttendanceForm";
import { Select } from "antd";
import dayjs from "dayjs";
import StudentAttendanceForm from "@/components/dashboard/attendance/studentAttendanceForm";

// ─── नेपाली मिति डिपेंडेन्सीहरू ──────────────────────────────────────────────────
import NepaliDate from "nepali-date-converter";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import CalendarPicker from "@/components/ui/Calendar";

/** AD "YYYY-MM-DD" → BS "YYYY-MM-DD" */
const adToBSValue = (adStr: any): string => {
  if (!adStr) return "";
  const cleanAdStr = dayjs.isDayjs(adStr)
    ? adStr.format("YYYY-MM-DD")
    : String(adStr);

  try {
    const nd = new NepaliDate(new Date(cleanAdStr));
    const y = nd.getYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const d = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return "";
  }
};

/** BS "YYYY-MM-DD" → AD "YYYY-MM-DD" */
const bsToADValue = (bsStr: string): string => {
  if (!bsStr) return "";
  try {
    const [y, m, d] = bsStr.split("-").map(Number);
    const nd = new NepaliDate(y, m - 1, d);
    const ad = nd.toJsDate();
    const ay = ad.getFullYear();
    const am = String(ad.getMonth() + 1).padStart(2, "0");
    const adDay = String(ad.getDate()).padStart(2, "0");
    return `${ay}-${am}-${adDay}`;
  } catch {
    return "";
  }
};

export default function AttendancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Page-level filters ── */
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // टेबलले [string, string] वा null आशा गर्छ (AD फॉर्मेटमा)
  const [filterDateRange, setFilterDateRange] = useState<
    [string, string] | null
  >(null);

  /* ── Class/section options ── */
  const [classOptions, setClassOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [sectionOptions, setSectionOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const activeFilterCount = [
    filterClass,
    filterSection,
    filterStatus,
    filterDateRange,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterClass(null);
    setFilterSection(null);
    setFilterStatus(null);
    setFilterDateRange(null);
  };

  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "leave", label: "Leave" },
    { value: "late", label: "Late" },
  ];

  const handleSuccess = () => setRefreshTrigger((p) => p + 1);
  const handleCloseSingle = () => {
    setIsModalOpen(false);
    setEditData(null);
  };
  const handleEdit = (data: any) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  // छुट्टाछुट्टै स्टार्ट र एन्ड डेट ह्यान्डलरहरू
  const handleStartDateChange = (bsVal: string) => {
    const adStart = bsToADValue(bsVal);
    if (!bsVal) {
      setFilterDateRange(null);
    } else {
      const currentEnd = filterDateRange?.[1] || adStart; // यदि एन्ड डेट छैन भने स्टार्ट डेटलाई नै राख्ने
      setFilterDateRange([adStart, currentEnd]);
    }
  };

  const handleEndDateChange = (bsVal: string) => {
    const adEnd = bsToADValue(bsVal);
    if (!bsVal) {
      setFilterDateRange(null);
    } else {
      const currentStart = filterDateRange?.[0] || adEnd; // यदि स्टार्ट डेट छैन भने एन्ड डेटलाई नै राख्ने
      setFilterDateRange([currentStart, adEnd]);
    }
  };

  return (
    <div className="space-y-3 font-mukta">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Student Attendance"
          description="Monitor and manage daily student attendance records."
        />

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <ThemedInput
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={15} />}
              className="h-7 w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-20"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bulk Mark */}
          <ThemedButton
            onClick={() => setIsBulkOpen(true)}
            size="sm"
            className="py-1.5 flex items-center gap-2"
          >
            <Users size={14} />
            <span> Mark Attendance</span>
          </ThemedButton>
        </div>
      </div>

      {/* ── Filter Row ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded shadow-sm border border-gray-200 flex-wrap">
        <SlidersHorizontal size={13} className="text-[#8094ae]" />
        <span className="text-[10px] font-bold text-[#8094ae] uppercase tracking-wide mr-1">
          Filter:
        </span>

        {/* Class */}
        <Select
          allowClear
          placeholder="All Classes"
          className="h-[28px] min-w-[130px] text-[11px]"
          options={classOptions}
          value={filterClass}
          onChange={(val) => {
            setFilterClass(val ?? null);
            setFilterSection(null);
          }}
          size="small"
        />

        {/* Section */}
        <Select
          allowClear
          placeholder={filterClass ? "All Sections" : "Select class first"}
          className="h-[28px] min-w-[130px] text-[11px]"
          options={sectionOptions}
          value={filterSection}
          onChange={(val) => setFilterSection(val ?? null)}
          disabled={!filterClass}
          size="small"
        />

        {/* Status */}
        <Select
          allowClear
          placeholder="All Status"
          className="h-[28px] min-w-[110px] text-[11px]"
          options={statusOptions}
          value={filterStatus}
          onChange={(val) => setFilterStatus(val ?? null)}
          size="small"
        />

       {/* ── नेपाली मिति रेन्ज फिल्टर ── */}
        <div className="flex items-center gap-2 dynamic-nepali-container [&>.ndp-container]:!z-[9999] [&>.ndp-container]:!left-auto [&>.ndp-container]:!right-0">
          
          {/* Start Date Picker */}
          <div className="w-[145px]">
            <CalendarPicker
              value={filterDateRange ? adToBSValue(filterDateRange[0]) : ""}
              onChange={(date: string) => {
                handleStartDateChange(date); // यहाँ Start Date को लागि फङ्सन बोलाउनुहोस्
              }}
            />
          </div>

          <span className="text-[10px] font-bold text-[#8094ae] px-0.5">to</span>

          {/* End Date Picker */}
          <div className="w-[145px]">
            <CalendarPicker
              value={filterDateRange ? adToBSValue(filterDateRange[1]) : ""}
              onChange={(date: string) => {
                handleEndDateChange(date); // यहाँ End Date को लागि फङ्सन बोलाउनुहोस्
              }}
            />
          </div>
        </div>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold text-red-500 hover:bg-red-100 transition-all"
          >
            <X size={9} /> Clear ({activeFilterCount})
          </button>
        )}

        {/* Record count */}
        <span className="ml-auto text-[10px] font-bold text-[#8094ae] flex items-center gap-1">
          <Filter size={10} />
          {activeFilterCount > 0
            ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`
            : "No filters"}
        </span>
      </div>

      {/* ── Table ── */}
      <StudentAttendanceTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
        filterClass={filterClass}
        filterSection={filterSection}
        filterStatus={filterStatus}
        filterDateRange={filterDateRange}
        onClassOptionsChange={setClassOptions}
        onSectionOptionsChange={setSectionOptions}
      />

      {/* Modals */}
      <StudentAttendanceForm
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleCloseSingle}
        onSuccess={handleSuccess}
      />
      <BulkAttendanceForm
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
