// ─── Data Helpers ─────────────────────────────────────────────────────────────

export function getCount(d: any): number {
  if (!d) return 0;
  if (Array.isArray(d)) return d.length;
  if (typeof d?.count === "number") return d.count;
  if (d?.results) return Array.isArray(d.results) ? d.results.length : 0;
  if (d?.data) return Array.isArray(d.data) ? d.data.length : 0;
  return 0;
}

export function getItems(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (d?.results) return d.results;
  if (d?.data && Array.isArray(d.data)) return d.data;
  return [];
}

export function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getName(obj: any): string {
  return (
    obj?.full_name ||
    obj?.name ||
    obj?.username ||
    obj?.user?.full_name ||
    `#${obj?.id ?? "?"}`
  );
}

export function splitStaffAndTeachers(items: any[]) {
  const teachers: any[] = [];
  const staff: any[] = [];
  items.forEach((u) => {
    const role = (u.role || u.user_type || "").toLowerCase();
    const isTeacher =
      role === "teacher" || u.is_teacher === true || u.qualification !== undefined;
    if (isTeacher) teachers.push(u);
    else staff.push(u);
  });
  return { teachers, staff };
}

export function formatRs(val: number | string): string {
  const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
  if (isNaN(num)) return "0";
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return num.toLocaleString();
}

export function getGreeting(): string {
  const now = new Date();
  const nepalTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })
  );
  const hour = nepalTime.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}