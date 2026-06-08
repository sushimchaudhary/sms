import { ChevronRight } from "lucide-react";
import { Sk } from "@/components/ui/Dashboardprimitives";

// ─── TopStatCard ───────────────────────────────────────────────────────────────
interface TopStatCardProps {
  label: string;
  value: number;
  icon: any;
  bg: string;
  href: string;
  loading: boolean;
}

export function TopStatCard({ label, value, icon: Icon, bg, href, loading }: TopStatCardProps) {
  return (
    <a
      href={href}
      className="relative bg-white rounded border border-gray-100 p-3 flex items-center gap-4 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-200"
        style={{ background: `linear-gradient(135deg, ${bg}dd, ${bg})` }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <>
            <Sk w={56} h={28} />
            <div className="mt-2">
              <Sk w={80} h={11} />
            </div>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-700 tabular-nums leading-none">
              {value.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1.5 font-semibold truncate">{label}</p>
          </>
        )}
      </div>
      <div
        className="absolute -right-5 -bottom-5 w-18 h-18 rounded-full opacity-[0.07]"
        style={{ backgroundColor: bg }}
      />
      <ChevronRight
        size={14}
        className="text-gray-300 flex-shrink-0 group-hover:text-gray-500 transition-colors"
      />
    </a>
  );
}

// ─── MiniStatCard ──────────────────────────────────────────────────────────────
interface MiniStatCardProps {
  label: string;
  value: number;
  icon: any;
  bg: string;
  ic: string;
  href: string;
  loading: boolean;
}

export function MiniStatCard({ label, value, icon: Icon, bg, ic, href, loading }: MiniStatCardProps) {
  return (
    <a
      href={href}
      className="bg-white rounded border border-gray-100 p-2 flex items-center gap-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group shadow-sm"
    >
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-transform"
        style={{ backgroundColor: bg }}
      >
        <Icon size={15} style={{ color: ic }} />
      </div>
      <div className="min-w-0">
        {loading ? (
          <>
            <Sk w={36} h={18} />
            <div className="mt-1">
              <Sk w={56} h={10} />
            </div>
          </>
        ) : (
          <>
            <p className="text-lg font-extrabold text-gray-900 tabular-nums leading-none">
              {value.toLocaleString()}
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5 font-semibold truncate">{label}</p>
          </>
        )}
      </div>
    </a>
  );
}