import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Sk } from "@/components/ui/Dashboardprimitives";

interface GenderItem {
  name: string;
  value: number;
  color: string;
}

interface GenderChartProps {
  data: GenderItem[];
  totalStudents: number;
  loading: boolean;
}

export function GenderChart({ data, totalStudents, loading }: GenderChartProps) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">Students by Gender</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
          {totalStudents} total
        </span>
      </div>

      <div className="flex flex-col items-center">
        {loading ? (
          <div className="w-[160px] h-[160px] flex items-center justify-center">
            <Sk w={160} h={160} r={80} />
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <RechartsPie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) =>
                    [value.toLocaleString(), name] as [any, any]
                  }
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-extrabold text-gray-800 tabular-nums leading-none">
                {totalStudents.toLocaleString()}
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">Students</p>
            </div>
          </div>
        )}

        <div className="flex gap-5 mt-3 flex-wrap justify-center">
          {data.map(({ name, value, color }) => (
            <div key={name} className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] font-bold text-gray-700">{name}</span>
              </div>
              <p className="text-base font-extrabold text-gray-800 mt-0.5 tabular-nums">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}