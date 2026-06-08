// ─── Earnings Chart Tooltip ────────────────────────────────────────────────────
export function EarningsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const earnings = payload.find((p: any) => p.dataKey === "earnings");
  const expenses = payload.find((p: any) => p.dataKey === "expenses");

  return (
    <div
      className="bg-white border border-gray-200 rounded shadow-xl px-2 py-1.5 min-w-[150px]"
      style={{ backdropFilter: "blur(12px)" }}
    >
      <p className="text-[10px] font-black text-gray-800 mb-1 uppercase tracking-widest border-b border-gray-100 pb-2">
        {label}
      </p>
      {earnings && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-sm"
              style={{ backgroundColor: earnings.fill || earnings.stroke }}
            />
            <span className="text-[11px] text-gray-500 font-semibold">Payment Record</span>
          </div>
          <span className="text-[10px] font-black text-gray-900 tabular-nums">
            Rs. {Number(earnings.value).toLocaleString()}
          </span>
        </div>
      )}
      {expenses && (
        <div className="flex items-center justify-between gap-6 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-sm bg-rose-400" />
            <span className="text-[10px] text-gray-500 font-semibold">Expenses</span>
          </div>
          <span className="text-[10px] font-black text-rose-600 tabular-nums">
            Rs. {Number(expenses.value).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Standard Chart Tooltip ────────────────────────────────────────────────────
export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-100 rounded shadow-xl px-2 py-4 min-w-[140px]">
      <p className="text-[11px] font-extrabold text-gray-700 mb-2 uppercase tracking-wide">
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.fill || p.color }}
            />
            <span className="text-[10px] text-gray-500 font-medium">{p.name}</span>
          </div>
          <span className="text-[11px] font-extrabold text-gray-800">
            {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}