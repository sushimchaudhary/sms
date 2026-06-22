"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Link from "next/link";
import { getGreeting } from "@/lib/Dashboardhelpers";

interface DashboardHeaderProps {
  userName?: string;
  primaryColor: string;
}

export function DashboardHeader({ userName, primaryColor }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: Greeting */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-700 tracking-tight">
            {getGreeting()},{" "}
            <span style={{ color: primaryColor }}>
              {userName?.split(" ")[0] || "User"}
            </span>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[13px] text-slate-700 font-medium flex items-center gap-1">
              <Clock size={14} className="text-slate-500" />
              {`Time: ${currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}`}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Admission Button */}
     {/* Right: Admission Button and Website Link */}
      <div className="flex items-center gap-4">
        
        <Link 
    href="/" 
    className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors z-10 cursor-pointer"
  >
    View Website
  </Link>

        {/* Admission Button */}
        <Link href="/student-admissions">
          <button
            style={{ backgroundColor: primaryColor }}
            className="flex items-center gap-2 px-4 cursor-pointer py-2 text-white text-sm font-semibold rounded-md shadow-sm hover:opacity-90 transition-opacity"
          >
            <span>Admission</span>
          </button>
        </Link>
      </div>
    </div>
  );
}