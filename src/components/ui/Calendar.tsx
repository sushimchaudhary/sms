"use client";

import React, { useState } from 'react';
import { Select, Popover, Button } from 'antd';
import { DoubleLeftOutlined, DoubleRightOutlined, CalendarOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import calendarData from '@/data/calendar.json';
import NepaliDate from 'nepali-date-converter';
import { useTheme } from '@/lib/context/ThemeContext';

const bsToADValue = (bsStr: string): string => {
  if (!bsStr) return "";
  try {
    const [y, m, d] = bsStr.split("-").map(Number);
    const nd = new NepaliDate(y, m - 1, d);
    const ad = nd.toJsDate();
    const ay = ad.getFullYear();
    const am = String(ad.getMonth() + 1).padStart(2, "0");
    const adDay = String(ad.getDate()).padStart(2, "0");
    return `${ay}-${am}-${adDay}`;
  } catch {
    return "";
  }
};
const CalendarPicker = ({ value, onChange }: { value: string, onChange: (date: string) => void }) => {
  const today = new NepaliDate();
const [selectedMonthIndex, setSelectedMonthIndex] = useState(today.getMonth());
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const { primaryColor } = useTheme();
  

  const currentMonth = calendarData.months_data[selectedMonthIndex] as any;
  const startDayIndex = currentMonth.start_day_index || 0;
  

  const changeMonth = (newIndex: number) => {
    setDirection(newIndex > selectedMonthIndex ? 1 : -1);
    setSelectedMonthIndex(newIndex);
  };

  const handleDateSelect = (date: string) => {
    onChange(date);
    setIsOpen(false);
  };

  const content = (
    <div className="w-72 font-sans overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between p-1 border-b mb-2">
        <button onClick={() => changeMonth(Math.max(0, selectedMonthIndex - 1))} className="p-1 hover:bg-gray-100 rounded-full">
          <DoubleLeftOutlined />
        </button>
        <div className="flex items-center gap-2 font-bold text-gray-700">
          <span>{calendarData.calendar_year_bs}</span>
          <Select value={selectedMonthIndex} onChange={changeMonth} bordered={false} style={{ width: 100 }} popupClassName="hide-scrollbar">
            {calendarData.months_data.map((m: any) => (
              <Select.Option key={m.month_index} value={m.month_index - 1}>{m.month_name_en}</Select.Option>
            ))}
          </Select>
        </div>
        <button onClick={() => changeMonth(Math.min(11, selectedMonthIndex + 1))} className="p-1 hover:bg-gray-100 rounded-full">
          <DoubleRightOutlined />
        </button>
      </div>

      <div className="relative h-52 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={selectedMonthIndex}
            custom={direction}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -50, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute w-full"
          >
            <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 py-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* खाली कोठाहरू (Offset) */}
              {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} className="h-7 w-7" />)}
              
               {Array.from({ length: currentMonth.total_days }, (_, i) => {
                            const day = i + 1;
                            const dayIndex = (startDayIndex + i) % 7;
                            
                            const isExamDay = currentMonth.exam_days?.includes(day); 
                            
                            const isHoliday = currentMonth.holidays?.includes(day);
                            const isSunSat = dayIndex === 0 || dayIndex === 6;
                            const isToday = day === today.getDate() && (selectedMonthIndex + 1) === (today.getMonth() + 1) && parseInt(calendarData.calendar_year_bs) === today.getYear();
              
                            return (
                              <div 
                                key={day} 
                                onClick={() => handleDateSelect(`${calendarData.calendar_year_bs}-${selectedMonthIndex + 1}-${day}`)}
                                style={isToday ? { backgroundColor: primaryColor } : {}} 
                                className={`h-7 w-7 flex items-center justify-center text-xs rounded-full cursor-pointer
                                  ${isToday 
                                    ? 'text-white font-bold' 
                                    : isExamDay 
                                      ? 'bg-blue-100 text-blue-700 font-bold border border-blue-200' 
                                      : (isHoliday || isSunSat) 
                                        ? 'text-red-500 font-bold' 
                                        : 'text-gray-600 hover:bg-blue-50'
                                  }`}
                              >
                                {day}
                              </div>
                            );
                         })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Today Button */}
<div className="border-t text-center pt-2">
  <Button 
    type="link" // 'primary' बाट 'link' मा बदल्नुहोस्
    size="small" 
    onClick={() => {
      setSelectedMonthIndex(today.getMonth());
      handleDateSelect(`${today.getYear()}-${today.getMonth() + 1}-${today.getDate()}`);
      setIsOpen(false);
    }} 
    // तपाईंको primaryColor टेक्स्टमा लगाउन यो style थप्नुहोस्
    style={{ color: primaryColor }} 
    className="text-xs font-bold"
  >
    Today
  </Button>
</div>
    </div>
  );

  return (
   <Popover 
  open={isOpen} 
  onOpenChange={(visible) => { 
    if (visible) { 
      // यदि भ्यालु छ भने त्यही महिना सेट गर्नुहोस्, नत्र आजको महिना
      const initialDate = value ? new NepaliDate(new Date(bsToADValue(value))) : today;
      setSelectedMonthIndex(initialDate.getMonth()); 
    } 
    setIsOpen(visible); 
  }} 
  content={content} 
  trigger="click" 
  placement="bottomLeft" 
  overlayClassName="custom-calendar-popover"
>
      <div className="flex items-center border border-gray-300 rounded px-2 py-2 cursor-pointer bg-white w-full">
        <CalendarOutlined className="text-gray-400 mr-2" />
        <span className="text-xs text-gray-600">{value || "YYYY-MM-DD"}</span>
      </div>
    </Popover>
  );
};

export default CalendarPicker;

