import React, { useEffect, useState } from 'react';
import { PublicServices } from '@/services/publicsServices';
import { GraduationCap, Users, CalendarDays } from 'lucide-react';

interface StudentAttendance {
  status: string;
  date: string;
}

interface StaffAttendance {
  status: string;
  date: string;
}

interface LeaveAllocation {
  teacher_name: string | null;
  staff_name: string | null;
  casual_leave: number;
  sick_leave: number;
  festival_leave: number;
  maternity_leave: number;
  funeral_leave: number;
}

const PublicSection = () => {
  const [stats, setStats] = useState<{
    presentStudents: number;
    presentStaff: number;
    leaveSummary: { name: string; totalLeaves: number }[];
  }>({
    presentStudents: 0,
    presentStaff: 0,
    leaveSummary: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentAtt, staffAtt, leaveAlloc] = await Promise.all([
          PublicServices.getPublicStudentAttendance(),
          PublicServices.getPublicStaffAttendance(),
          PublicServices.getPublicLeaveAllocations()
        ]);

        const today = new Date().toISOString().split('T')[0];

        const presentStudents = studentAtt.filter((s: StudentAttendance) =>
          s.status === 'present' && s.date === today
        ).length;

        const presentStaff = staffAtt.filter((s: StaffAttendance) =>
          s.status === 'present' && s.date === today
        ).length;

        const leaveSummary = leaveAlloc.map((item: LeaveAllocation) => ({
          name: item.teacher_name || item.staff_name || "Unknown",
          totalLeaves: item.casual_leave + item.sick_leave + item.festival_leave + item.maternity_leave + item.funeral_leave
        }));

        setStats({ presentStudents, presentStaff, leaveSummary });
      } catch (error) {
        console.error("Data fetch error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Present Students */}
        <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-sky-500 to-sky-700 text-white p-5 shadow-sm">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-100">Present Today</p>
              <p className="text-[13px] font-medium text-white/90 mt-0.5">Students</p>
              <p className="text-3xl font-extrabold mt-2">{stats.presentStudents}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <GraduationCap size={22} />
            </div>
          </div>
        </div>

        {/* Present Staff */}
        <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 shadow-sm">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">Present Today</p>
              <p className="text-[13px] font-medium text-white/90 mt-0.5">Staff</p>
              <p className="text-3xl font-extrabold mt-2">{stats.presentStaff}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Leave Summary */}
        <div className="rounded-sm bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <CalendarDays size={16} />
            </div>
            <h3 className="text-[13px] font-bold text-slate-700">Staff Leave Summary</h3>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {stats.leaveSummary.length === 0 ? (
              <p className="text-[12px] text-slate-400">No data available</p>
            ) : (
              stats.leaveSummary.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-[12px]">
                  <span className="text-slate-600 font-medium truncate">{item.name}</span>
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0 ml-2">
                    {item.totalLeaves} days
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSection;