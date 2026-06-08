import { Sk } from "@/components/ui/Dashboardprimitives";

interface EnrollmentItem {
  name: string;
  enrolled: number;
  active: number;
  pct: number;
}

interface EnrollmentByClassProps {
  data: EnrollmentItem[];
  loading: boolean;
  primaryColor: string;
  avgEnrollPct: number;
}

export function EnrollmentByClass({
  data,
  loading,
  primaryColor,
  avgEnrollPct,
}: EnrollmentByClassProps) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Enrollment by Class</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Active enrollment % per class</p>
        </div>
        {!loading && (
          <span
            className="text-[11px] font-extrabold px-2.5 py-1 rounded"
            style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
          >
            Avg {avgEnrollPct}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Sk key={i} h={14} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-[11px] text-gray-400">
          No enrollment data
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(({ name, enrolled, active, pct }) => {
            const bc =
              pct >= 80 ? "#10b981" : pct >= 60 ? primaryColor : "#f59e0b";
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[120px]">
                    {name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                      {active}/{enrolled}
                    </span>
                    <span
                      className="text-[11px] font-extrabold tabular-nums"
                      style={{ color: bc }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: bc }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
          {[
            { label: "Classes", value: data.length },
            { label: "Enrolled", value: data.reduce((s, d) => s + d.enrolled, 0) },
            { label: "Active", value: data.reduce((s, d) => s + d.active, 0) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-gray-50 rounded py-2">
              <p className="text-[14px] font-extrabold text-gray-800 tabular-nums">
                {value}
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}