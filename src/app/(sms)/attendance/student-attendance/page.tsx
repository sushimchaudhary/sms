"use client";

import React, { useState,  } from "react";
import { ThemedButton } from "@/components/ui/themedButton";
import { PageHeader } from "@/components/PageHeader";
import {  Search, X, Users, Filter, SlidersHorizontal } from "lucide-react";
import { ThemedInput } from "@/components/ui/ThemedInput";
import StudentAttendanceTable from "@/components/dashboard/attendance/studentAttendanceTable";
import BulkAttendanceForm from "@/components/dashboard/attendance/bulkStudentAttendanceForm";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export default function AttendancePage() {
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isBulkOpen, setIsBulkOpen]     = useState(false);
  const [editData, setEditData]         = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery]   = useState("");

  /* ── Page-level filters ── */
  const [filterClass, setFilterClass]     = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus]   = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<[string, string] | null>(null);

  /* ── Class/section options are passed UP from the table via a callback ── */
  const [classOptions, setClassOptions]     = useState<{ value: string; label: string }[]>([]);
  const [sectionOptions, setSectionOptions] = useState<{ value: string; label: string }[]>([]);

  const activeFilterCount = [filterClass, filterSection, filterStatus, filterDateRange].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterClass(null);
    setFilterSection(null);
    setFilterStatus(null);
    setFilterDateRange(null);
  };

  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "absent",  label: "Absent"  },
    { value: "leave",   label: "Leave"   },
    { value: "late",    label: "Late"    },
  ];

  const handleSuccess    = () => setRefreshTrigger((p) => p + 1);
  const handleCloseSingle = () => { setIsModalOpen(false); setEditData(null); };
  const handleEdit        = (data: any) => { setEditData(data); setIsModalOpen(true); };

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

          {/* Single Mark */}
          {/* <ThemedButton
            onClick={() => { setEditData(null); setIsModalOpen(true); }}
            size="sm"
            className="py-1.5 flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Mark Attendance</span>
          </ThemedButton> */}
        </div>
      </div>

      {/* ── Filter Row ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded shadow-sm border border-gray-200 flex-wrap">
        <SlidersHorizontal size={13} className="text-[#8094ae]" />
        <span className="text-[10px] font-bold text-[#8094ae] uppercase tracking-wide mr-1">Filter:</span>

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

        {/* Date Range */}
        <RangePicker
          size="small"
          className="h-[28px] text-[11px]"
          format="YYYY-MM-DD"
          onChange={(_, dateStrings) => {
            if (dateStrings[0] && dateStrings[1]) {
              setFilterDateRange([dateStrings[0], dateStrings[1]]);
            } else {
              setFilterDateRange(null);
            }
          }}
          value={
            filterDateRange
              ? [dayjs(filterDateRange[0]), dayjs(filterDateRange[1])]
              : null
          }
        />

        {/* Clear */}
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
          {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active` : "No filters"}
        </span>
      </div>

      {/* ── Table ── */}
      <StudentAttendanceTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
        /* pass filters down */
        filterClass={filterClass}
        filterSection={filterSection}
        filterStatus={filterStatus}
        filterDateRange={filterDateRange}
        /* pass options up */
        onClassOptionsChange={setClassOptions}
        onSectionOptionsChange={setSectionOptions}
      />

      {/* Modals */}
      {/* <StudentAttendanceForm
        isOpen={isModalOpen}
        initialData={editData}
        onClose={handleCloseSingle}
        onSuccess={handleSuccess}
      /> */}
      <BulkAttendanceForm
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}