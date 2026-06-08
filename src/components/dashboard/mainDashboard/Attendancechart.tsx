import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users } from "lucide-react";
import { Sk } from "@/components/ui/Dashboardprimitives";
import { ChartTooltip } from "@/components/ui/Charttooltips";

interface AttendanceDay {
  day: string;
  present: number;
  absent: number;
}

interface AttendanceChartProps {
  data: AttendanceDay[] | null;
  presentTotal: number;
  absentTotal: number;
  attendancePct: number;
  loading: boolean;
  primaryColor: string;
}

export function AttendanceChart({
  data,
  presentTotal,
  absentTotal,
  attendancePct,
  loading,
  primaryColor,
}: AttendanceChartProps) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Student Attendance</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Weekly attendance breakdown</p>
        </div>
        {!loading && data && (
          <span
            className="text-[11px] font-extrabold px-2.5 py-1 rounded"
            style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
          >
            {attendancePct}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-[150px] flex items-center justify-center">
          <Sk w="80%" h={100} />
        </div>
      ) : !data ? (
        <div className="h-[150px] flex flex-col items-center justify-center text-gray-400">
          <Users size={28} className="mb-2 opacity-30" />
          <p className="text-[11px] font-semibold">No attendance records yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: -30 }}
            barSize={18}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar
              dataKey="present"
              name="Present"
              stackId="a"
              fill={primaryColor}
              radius={[4, 4, 0, 0]}
            />
            <Bar dataKey="absent" name="Absent" stackId="a" fill="#e2e8f0" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {!loading && data && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-[10px] text-gray-500 font-medium">
                Present <b className="text-gray-700">{presentTotal}</b>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-[10px] text-gray-500 font-medium">
                Absent <b className="text-gray-700">{absentTotal}</b>
              </span>
            </div>
          </div>
          <span
            className="text-[14px] font-extrabold tabular-nums"
            style={{ color: primaryColor }}
          >
            {attendancePct}%
          </span>
        </div>
      )}
    </div>
  );
}