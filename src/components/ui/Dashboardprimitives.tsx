import { initials } from "@/lib/Dashboardhelpers";

// ─── Skeleton ──────────────────────────────────────────────────────────────────
interface SkProps {
  w?: string | number;
  h?: number;
  r?: number;
}

export function Sk({ w = "100%", h = 14, r = 8 }: SkProps) {
  return (
    <div
      className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
      style={{ width: w, height: h, borderRadius: r }}
    />
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
interface AvaProps {
  name: string;
  color: string;
  size?: number;
}

export function Ava({ name, color, size = 32 }: AvaProps) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-extrabold flex-shrink-0 uppercase"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.34 }}
    >
      {initials(name)}
    </span>
  );
}