import { ChevronRight } from "lucide-react";
import { Sk, Ava } from "@/components/ui/Dashboardprimitives";
import { getName } from "@/lib/Dashboardhelpers";

interface RecentStudentsProps {
  students: any[];
  totalStudents: number;
  loading: boolean;
  primaryColor: string;
}

export function RecentStudents({
  students,
  totalStudents,
  loading,
  primaryColor,
}: RecentStudentsProps) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800">Recent Students</h3>
          {totalStudents > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
            >
              {totalStudents}
            </span>
          )}
        </div>
        <a
          href="/students"
          className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5"
        >
          View all <ChevronRight size={12} />
        </a>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <Sk w={30} h={30} r={99} />
              <div className="flex-1">
                <Sk w="65%" h={12} />
                <div className="mt-1">
                  <Sk w="40%" h={10} />
                </div>
              </div>
            </div>
          ))
        ) : students.length === 0 ? (
          <p className="text-center text-[11px] text-gray-400 py-4">
            No students found
          </p>
        ) : (
          students.map((s, i) => {
            const name = getName(s);
            const email =
              s.user_email || s.email || `ID: ${s.student_id || s.id}`;

            return (
              <div key={s.id ?? i} className="flex gap-2.5 items-center">
                <Ava name={name} color={primaryColor} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-800 uppercase truncate leading-tight">
                    {name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{email}</p>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    s.is_active !== false
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {s.is_active !== false ? "active" : "inactive"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}