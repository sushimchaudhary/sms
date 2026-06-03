"use client";

import React, { useState } from 'react';
import sopData from '@/data/sopData.json'; 
import activeData from '@/data/activeData.json';
import { useTheme } from '@/lib/context/ThemeContext';
import CalendarGrid from '@/components/ui/CalendarGrid';
import NepaliDate from 'nepali-date-converter';

const AcademicCalendar = () => {
  const { primaryColor } = useTheme();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new NepaliDate().getMonth());
  const activeMonthData = activeData.major_activities_timeline.find(
    (m: any) => m.month_index === selectedMonthIndex + 1
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-8">
      
      {/* 1. LEFT & CENTER COLUMN (Calendar + Activities) */}
      {/* डेस्कटपमा ७ col र मोबाइलमा पूरै width */}
      <div className="md:col-span-8 flex flex-col gap-8 order-1">
        
        {/* Calendar (w-full) */}
        <div className="w-full flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4 text-center" style={{ color: primaryColor }}>
            शैक्षिक क्यालेन्डर २०८३
          </h2>
          <div className="w-full">
            <CalendarGrid 
              selectedMonthIndex={selectedMonthIndex} 
              setSelectedMonthIndex={setSelectedMonthIndex} 
            />
          </div>
        </div>

        {/* Major Activities (Calendar को मुनि) */}
        <div className="w-full">
          <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
            प्रमुख गतिविधिहरू
          </h2>
          <div className="space-y-6">
            {activeMonthData ? (
              <div className="border-l-2 pl-4 w-full" style={{ borderColor: primaryColor }}>
                <h3 className="font-bold text-lg" style={{ color: primaryColor }}>{activeMonthData.month}</h3>
                <ul className="text-md mt-2 space-y-1">
                  {activeMonthData.activities.map((act: any, i: number) => (
                    <li key={i} className="flex justify-between">
                      <span>{act.activity}</span>
                      <span className="font-medium text-gray-500">{act.timeline}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 italic">यस महिना कुनै गतिविधिहरू छैनन्।</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN (SOPs) */}
      <div className="md:col-span-4 order-2">
        <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
          कार्यविधि (SOPs)
        </h2>
        <div className="space-y-4">
          {sopData.standard_operating_procedures.map((cat: any, idx: number) => (
            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg mb-2" style={{ color: primaryColor }}>{cat.category}</h3>
              <ul className="text-md text-gray-600 space-y-2">
                {cat.items.map((item: any, i: number) => (
                  <li key={i}>• <strong>{item.title}:</strong> {item.description}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AcademicCalendar;