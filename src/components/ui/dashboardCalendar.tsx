import React from 'react';
import { Calendar, theme, ConfigProvider } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const DashboardCalendar: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const { token } = theme.useToken();

  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>['mode']) => {
    console.log(value.format('YYYY-MM-DD'), mode);
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 p-2">
      {/* Header */}
      <div className="flex items-center gap-1 mb-1">
        <div className="p-1.5 rounded" style={{ backgroundColor: primaryColor + "15" }}>
          <CalendarIcon size={12} style={{ color: primaryColor }} />
        </div>
        <h3 className="text-sm font-bold text-gray-800">School Calendar</h3>
      </div>

      {/* Ant Design Calendar with Custom Theme */}
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: primaryColor, // Tapaiko dashboard ko main color yaha apply hunchha
            borderRadiusSM: 6,
          },
        }}
      >
        <div className="antd-wrapper">
          <Calendar 
            fullscreen={false} 
            onPanelChange={onPanelChange}
            headerRender={({ value, onChange }) => {
              const month = value.month();
              const year = value.year();
              const monthName = value.format('MMMM');

              return (
                <div className="flex justify-between items-center pb-2 px-1">
                  <span className="text-[10px] font-bold text-slate-700">
                    {monthName} {year}
                  </span>
                  <div className="flex gap-1">
                    <button
                      className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400"
                      onClick={() => onChange(value.clone().subtract(1, 'month'))}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400"
                      onClick={() => onChange(value.clone().add(1, 'month'))}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </ConfigProvider>

      {/* Global Style to clean up Ant Design's default padding/borders */}
      <style jsx global>{`
        .antd-wrapper .ant-picker-calendar {
          background: transparent !important;
        }
        .antd-wrapper .ant-picker-calendar-header {
          padding: 0 !important;
          display: block !important;
        }
        .antd-wrapper .ant-picker-content th {
          font-size: 10px !important;
          color: #94a3b8 !important; /* slate-400 */
          font-weight: 700 !important;
          text-transform: uppercase;
        }
        .antd-wrapper .ant-picker-cell {
          padding: 2px 0 !important;
        }
        .antd-wrapper .ant-picker-cell-inner {
          font-size: 11px !important;
          font-weight: 600 !important;
          height: 28px !important;
          line-height: 28px !important;
          width: 28px !important;
        }
        .antd-wrapper .ant-picker-calendar-full .ant-picker-panel, 
        .antd-wrapper .ant-picker-calendar-mini {
          border-top: none !important;
        }
      `}</style>
    </div>
  );
};

export default DashboardCalendar;