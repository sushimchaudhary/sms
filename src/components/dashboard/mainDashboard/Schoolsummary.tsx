import { School, Layers, BookOpen, UserCheck } from "lucide-react";

interface SchoolSummaryProps {
  counts: {
    classes: number;
    sections: number;
    subjects: number;
    enrollments: number;
  };
  loading: boolean;
  primaryColor: string;
}

export function SchoolSummary({ counts, loading, primaryColor }: SchoolSummaryProps) {
  const items = [
    { label: "Classes",  value: counts.classes,     color: "#2563EB", icon: School },
    { label: "Sections", value: counts.sections,    color: primaryColor, icon: Layers },
    { label: "Subjects", value: counts.subjects,    color: "#D97706", icon: BookOpen },
    { label: "Enrolled", value: counts.enrollments, color: "#16A34A", icon: UserCheck },
  ];

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
      <h3 className="text-sm font-bold text-gray-800 mb-3">School Summary</h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="rounded p-3 flex items-center gap-2"
            style={{ backgroundColor: color + "10" }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: color + "20" }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-800 tabular-nums leading-none">
                {loading ? "—" : value.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}