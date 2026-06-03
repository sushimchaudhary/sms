"use client";

import React, { useState } from 'react';
import { Select } from 'antd';
import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import calendarData from '@/data/calendar.json';
import NepaliDate from 'nepali-date-converter';
import { useTheme } from '@/lib/context/ThemeContext';

const CalendarGrid = ({ selectedMonthIndex, setSelectedMonthIndex }: any) => {
  const [direction, setDirection] = useState(0);
  const { primaryColor } = useTheme();
  const today = new NepaliDate();

  const currentMonth = calendarData.months_data[selectedMonthIndex] as any;
  const startDayIndex = currentMonth.start_day_index || 0;

  const changeMonth = (newIndex: number) => {
    setDirection(newIndex > selectedMonthIndex ? 1 : -1);
    setSelectedMonthIndex(newIndex);
  };

  const handleDateSelect = (date: string) => {
    console.log("Selected Date:", date);
  };

  return (
    <div className="w-full font-sans  overflow-visible bg-white p-2 rounded-lg shadow-md border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-1 border-b mb-1">
        <button onClick={() => changeMonth(Math.max(0, selectedMonthIndex - 1))} className="p-1 hover:bg-gray-100 rounded-full">
          <DoubleLeftOutlined />
        </button>
        <div className="flex items-center gap-4 font-bold text-gray-700">
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

      {/* Calendar Body */}
      <div className="relative h-66 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>  
        <motion.div
          key={selectedMonthIndex}
          custom={direction}
          initial={{ x: direction * 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -50, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute w-full flex flex-col items-center" // यहाँ items-center थप्नुहोस्
        >
          {/* Days Header */}
          <div className="grid grid-cols-7 w-full text-center text-[10px] text-gray-400 p-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} className="flex justify-center">{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 w-full gap-y-2 gap-x-1 justify-items-center">
            {Array.from({ length: startDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}       
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
    </div>
  );
};

export default CalendarGrid;