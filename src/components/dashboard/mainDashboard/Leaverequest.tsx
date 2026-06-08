import { ChevronRight } from "lucide-react";
import { Sk, Ava } from "@/components/ui/Dashboardprimitives";
import { getName } from "@/lib/Dashboardhelpers";

interface LeaveRequestsProps {
  leaves: any[];
  totalLeaves: number;
  loading: boolean;
}

export function LeaveRequests({ leaves, totalLeaves, loading }: LeaveRequestsProps) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800">Leave Requests</h3>
          {totalLeaves > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
              {totalLeaves}
            </span>
          )}
        </div>
        <a
          href="/leave-application"
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
        ) : leaves.length === 0 ? (
          <p className="text-center text-[11px] text-gray-400 py-4">
            No leave requests
          </p>
        ) : (
          leaves.map((l, i) => {
            const name = l.teacher_name || l.student_name || l.name || getName(l);
            const type = l.leave_type || l.type || "Leave";
            const status = (l.status || "pending").toLowerCase();
            const ac =
              status === "approved"
                ? "#16A34A"
                : status === "rejected"
                ? "#DC2626"
                : "#D97706";

            return (
              <div key={l.id ?? i} className="flex gap-2.5 items-center">
                <Ava name={name} color={ac} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-800 uppercase truncate leading-tight">
                    {name}
                  </p>
                  <p className="text-[10px] text-gray-400">{type}</p>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                    status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "rejected"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}