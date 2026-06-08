import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell,
} from "recharts";
import {
  BarChart2, Hash, Wallet, CheckCircle2,
  Clock3, AlertCircle, ArrowUpRight, CircleDollarSign,
} from "lucide-react";
import { Sk } from "@/components/ui/Dashboardprimitives";
import { EarningsTooltip } from "@/components/ui/Charttooltips";
import { formatRs } from "@/lib/Dashboardhelpers";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface EarningsDataItem {
  month: string;
  earnings: number;
  expenses: number;
  net: number;
}

interface FeeSummary {
  totalFee: number;
  totalPaid: number;
  totalRemaining: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  collectionPct: number;
}

interface EarningsCardProps {
  earningsChartData: EarningsDataItem[];
  feeSummary: FeeSummary;
  totalPayCount: number;
  totalExpenses: number;
  bestMonth: EarningsDataItem | null;
  loading: boolean;
  primaryColor: string;
}

// ─── Student Fee Summary sub-section ──────────────────────────────────────────
function StudentFeeSummary({
  feeSummary,
  loading,
  primaryColor,
}: {
  feeSummary: FeeSummary;
  loading: boolean;
  primaryColor: string;
}) {
  return (
    <div className="mx-1 mb-5 overflow-hidden">
      {/* Fee Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 bg-white">
        <span className="text-[11px] font-black text-gray-700 flex items-center gap-1.5">
          <CircleDollarSign size={12} style={{ color: primaryColor }} />
          Student Fee Collection
        </span>
        {!loading && feeSummary.totalFee > 0 && (
          <span
            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
          >
            {feeSummary.collectionPct}% collected
          </span>
        )}
      </div>

      <div className="p-2 space-y-3">
        {/* Progress Bar */}
        {!loading && feeSummary.totalFee > 0 && (
          <div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${feeSummary.collectionPct}%`,
                  backgroundColor: primaryColor,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-gray-500 font-semibold">
                Rs. {feeSummary.totalPaid.toLocaleString()} paid
              </span>
              <span className="text-[9px] text-gray-400">
                of Rs. {feeSummary.totalFee.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        {loading && (
          <div>
            <Sk h={10} r={5} />
            <div className="flex justify-between mt-1.5">
              <Sk w="38%" h={9} />
              <Sk w="30%" h={9} />
            </div>
          </div>
        )}

        {/* Donut Charts: Paid & Remaining */}
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-2">
                <Sk w={60} h={60} r={30} />
                <Sk w="70%" h={10} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Paid",
                value: feeSummary.totalPaid.toLocaleString(),
                pct: feeSummary.collectionPct,
                color: primaryColor,
                track: primaryColor + "22",
                bg: primaryColor + "0d",
              },
              {
                label: "Remaining",
                value: feeSummary.totalRemaining.toLocaleString(),
                pct: 100 - feeSummary.collectionPct,
                color: "#f43f5e",
                track: "#fee2e2",
                bg: "#fff1f2",
              },
            ].map(({ label, value, pct, color, track, bg }) => {
              const safe = Math.max(0, Math.min(100, pct));
              return (
                <div
                  key={label}
                  className="flex flex-col items-center rounded py-3 px-2"
                  style={{ backgroundColor: bg }}
                >
                  <div className="relative" style={{ width: 62, height: 62 }}>
                    <ResponsiveContainer width={62} height={62}>
                      <RechartsPie>
                        <Pie
                          data={[{ v: safe }, { v: 100 - safe }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={28}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="v"
                          stroke="none"
                          paddingAngle={safe > 0 && safe < 100 ? 2 : 0}
                        >
                          <Cell fill={color} />
                          <Cell fill={track} />
                        </Pie>
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[11px] font-black tabular-nums"
                        style={{ color }}
                      >
                        {safe}%
                      </span>
                    </div>
                  </div>
                  <p
                    className="text-[12px] font-black tabular-nums mt-1.5 leading-tight text-center"
                    style={{ color }}
                  >
                    Rs.{formatRs(value)}
                  </p>
                  <p
                    className="text-[8px] font-black uppercase tracking-wider mt-0.5"
                    style={{ color }}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Status Pills */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            {
              label: "Paid",
              value: feeSummary.paidCount,
              color: primaryColor,
              bg: primaryColor + "10",
              icon: CheckCircle2,
            },
            {
              label: "Partial",
              value: feeSummary.partialCount,
              color: "#d97706",
              bg: "#fffbeb",
              icon: Clock3,
            },
            {
              label: "Unpaid",
              value: feeSummary.unpaidCount,
              color: "#dc2626",
              bg: "#fff1f2",
              icon: AlertCircle,
            },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div
              key={label}
              className="rounded px-2.5 py-2 flex items-center gap-1.5"
              style={{ backgroundColor: bg }}
            >
              <Icon size={11} style={{ color }} />
              <div>
                {loading ? (
                  <Sk w={20} h={12} />
                ) : (
                  <p
                    className="text-[13px] font-black tabular-nums leading-none"
                    style={{ color }}
                  >
                    {value}
                  </p>
                )}
                <p
                  className="text-[8px] font-black uppercase tracking-wide mt-0.5"
                  style={{ color }}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main EarningsCard ─────────────────────────────────────────────────────────
export function EarningsCard({
  earningsChartData,
  feeSummary,
  totalPayCount,
  totalExpenses,
  bestMonth,
  loading,
  primaryColor,
}: EarningsCardProps) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className="px-3 pt-3 pb-2"
        style={{ background: `linear-gradient(135deg, ${primaryColor}08 0%, #fff 60%)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ backgroundColor: primaryColor + "20" }}
              >
                <BarChart2 size={11} style={{ color: primaryColor }} />
              </div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight">
                Earnings Analytics
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 font-medium ml-7">
              Total income vs expenses · monthly
            </p>
          </div>
          {!loading && totalPayCount > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border"
              style={{
                backgroundColor: primaryColor + "10",
                borderColor: primaryColor + "30",
                color: primaryColor,
              }}
            >
              <Hash size={9} /> {totalPayCount}
            </div>
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div
            className="rounded px-3 py-2.5"
            style={{
              backgroundColor: primaryColor + "10",
              border: `1px solid ${primaryColor}20`,
            }}
          >
            <p
              className="text-[9px] font-black uppercase tracking-widest mb-1"
              style={{ color: primaryColor }}
            >
              Income
            </p>
            {loading ? (
              <Sk w="80%" h={16} />
            ) : (
              <p
                className="text-[15px] font-black tabular-nums leading-none"
                style={{ color: primaryColor }}
              >
                Rs.{formatRs(feeSummary.totalPaid)}
              </p>
            )}
          </div>
          <div className="rounded px-3 py-2.5 bg-rose-50 border border-rose-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1">
              Expenses
            </p>
            {loading ? (
              <Sk w="80%" h={16} />
            ) : (
              <p className="text-[15px] font-black tabular-nums leading-none text-rose-600">
                Rs.{totalExpenses.toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-2 flex-1">
        {loading ? (
          <div className="h-[148px] flex items-center justify-center">
            <Sk w="85%" h={90} r={10} />
          </div>
        ) : earningsChartData.length === 0 ? (
          <div className="h-[148px] flex flex-col items-center justify-center text-gray-300">
            <Wallet size={30} className="mb-2" />
            <p className="text-[11px] font-bold text-gray-400">No payment data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={148}>
            <AreaChart
              data={earningsChartData}
              margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
            >
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatRs(v)}
              />
              <Tooltip content={<EarningsTooltip />} />
              <Area
                type="monotone"
                dataKey="earnings"
                name="Income"
                stroke={primaryColor}
                strokeWidth={2.5}
                fill="url(#incomeGrad)"
                dot={false}
                activeDot={{ r: 5, fill: primaryColor, stroke: "#fff", strokeWidth: 2.5 }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fill="url(#expenseGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend + Best Month Footer */}
      <div className="px-5 pb-4 pt-1 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
            <span
              className="w-5 h-[2.5px] rounded-full inline-block"
              style={{ backgroundColor: primaryColor }}
            />
            Income
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
            <span className="w-5 h-[2.5px] rounded-full inline-block bg-rose-400" />
            Expenses
          </span>
        </div>
        {!loading && bestMonth && bestMonth.net > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <ArrowUpRight size={10} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700">
              Peak: {bestMonth.month} · Rs.{formatRs(bestMonth.net)}
            </span>
          </div>
        )}
      </div>

      {/* Student Fee Summary */}
      <StudentFeeSummary
        feeSummary={feeSummary}
        loading={loading}
        primaryColor={primaryColor}
      />
    </div>
  );
}