"use client";

import React, { useState } from "react";
import { 
  X, 
  UserCircle, 
  CalendarDays, 
  ShieldAlert, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ScanSearch, 
  BadgeCheck, 
  UserCheck 
} from "lucide-react";
import NepaliDate from "nepali-date-converter";
import { ThemedButton } from "@/components/ui/themedButton";
import { CancelButton } from "@/components/ui/CancleButton";

const convertADtoBS = (adDateString: string): string => {
  if (!adDateString) return "N/A";
  try {
    // मितिलाई सही ढाँचामा बदल्ने
    const nd = new NepaliDate(new Date(adDateString));
    const y = nd.getYear();
    const m = String(nd.getMonth() + 1).padStart(2, "0");
    const d = String(nd.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch (error) {
    return adDateString;
  }
};

// Status configuration for colors and icons
const STATUS_CONFIG: any = {
  pending: {
    label: "Pending",
    icon: <Clock size={12} />,
    textCls: "text-amber-600",
    bgCls: "bg-amber-50",
    borderCls: "border-amber-100",
  },
  in_review: {
    label: "In Review",
    icon: <ScanSearch size={12} />,
    textCls: "text-blue-600",
    bgCls: "bg-blue-50",
    borderCls: "border-blue-100",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 size={12} />,
    textCls: "text-emerald-600",
    bgCls: "bg-emerald-50",
    borderCls: "border-emerald-100",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle size={12} />,
    textCls: "text-rose-600",
    bgCls: "bg-rose-50",
    borderCls: "border-rose-100",
  },
};

const ComplaintDetailModal = ({ complaint, onClose }: any) => {
  const [isClosing, setIsClosing] = useState(false);
   const formatToNepaliBS = (adDateString: string) => {
    return convertADtoBS(adDateString);
  };


  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!complaint) return null;

  const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;

  return (
    <div
      className={`
        fixed inset-0 z-[100] flex items-center justify-center 
        bg-black/30 backdrop-blur-[2px] transition-opacity duration-200
        ${isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in"}
      `}
      onClick={handleClose}
    >
      <div
        className={`
          relative bg-white rounded shadow-2xl border border-gray-100 w-full max-w-lg mx-4 
          transition-all duration-300 transform overflow-hidden
          ${isClosing 
            ? "opacity-0 scale-95 translate-y-4 ease-in" 
            : "opacity-100 scale-100 translate-y-0 animate-in slide-in-from-bottom-4"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#364a63]/10 rounded">
              <ShieldAlert size={15} className="text-[#364a63]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
                Complaint Details
              </p>
              <h3 className="text-[14px] font-extrabold text-[#364a63] leading-tight">
                {complaint.subject}
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-red-500 hover:text-red-600 transition-all active:scale-90"
          >
            <X size={14} />
          </button>
        </div>

        {/* Meta Grid Section */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 px-5 py-4 bg-[#f8fafc] border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <UserCircle size={11} className="text-[#8094ae]" />
            <div className="flex flex-col">
                <span className="text-[9px] text-[#8094ae] uppercase font-bold leading-none mb-0.5">Raised By</span>
                <span className="text-[10px] text-[#526484] font-medium truncate">{complaint.raised_by_email || "System User"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <CalendarDays size={11} className="text-[#8094ae]" />
            <div className="flex flex-col">
                <span className="text-[9px] text-[#8094ae] uppercase font-bold leading-none mb-0.5">Created At</span>
                <span className="text-[10px] text-[#526484] font-medium">
                {formatToNepaliBS(complaint.created_at)}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${statusCfg.bgCls} ${statusCfg.borderCls}`}>
                <span className={statusCfg.textCls}>{statusCfg.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${statusCfg.textCls}`}>
                    {statusCfg.label}
                </span>
            </div>
          </div>

          {complaint.reviewed_by_email && (
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
               <BadgeCheck size={11} className="text-emerald-500" />
               <div className="flex flex-col">
                    <span className="text-[9px] text-[#8094ae] uppercase font-bold leading-none mb-0.5">Reviewed By</span>
                    <span className="text-[10px] text-[#526484] font-medium">{complaint.reviewed_by_email}</span>
               </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="px-5 py-5 space-y-5">
          {/* Complaint Message */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare size={11} className="text-[#364a63]" />
                <p className="text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
                    Complaint Message
                </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[13px] text-[#364a63] leading-relaxed whitespace-pre-wrap">
                    {complaint.message}
                </p>
            </div>
          </div>

          {/* Admin Response Section */}
          {complaint.response && (
             <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-1.5 mb-2">
                    <UserCheck size={11} className="text-emerald-600" />
                    <p className="text-[11px] font-bold text-emerald-600/80 uppercase tracking-wider">
                        Official Response
                    </p>
                </div>
                <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100 italic">
                    <p className="text-[13px] text-emerald-900 leading-relaxed">
                        "{complaint.response}"
                    </p>
                    {complaint.reviewed_at && (
                        <p className="text-[9px] text-emerald-600 mt-2 font-medium">
                            Replied on: {new Date(complaint.reviewed_at).toLocaleString()}
                        </p>
                    )}
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 pb-5 pt-2">
          <CancelButton
            
            onClick={handleClose}
          >
           
          </CancelButton>
          
          {complaint.status === 'pending' && (
             <ThemedButton

                onClick={() => {
                    // Logic to open edit/response mode
                    handleClose();
                }}
             >
               Take Action
             </ThemedButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;