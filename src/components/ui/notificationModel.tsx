"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, UserCircle, CalendarDays, Tag, Radio } from "lucide-react";

const NotificationDetailModal = ({ notification, onClose }: any) => {
  const [isClosing, setIsClosing] = useState(false);

  // Close handler with delay for fade-out animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Animation duration सँग मिलाउने
  };

  if (!notification) return null;

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
          relative bg-white rounded shadow-2xl border border-gray-100 w-full max-w-md mx-4 
          transition-all duration-300 transform
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
              <Bell size={15} className="text-[#364a63]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#8094ae] uppercase tracking-wider">
                Notification
              </p>
              <h3 className="text-[14px] font-extrabold text-[#364a63] leading-tight">
                {notification.title}
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

        {/* Meta Row */}
        <div className="grid grid-cols-2 gap-2 px-5 py-3 bg-[#f8fafc] border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <UserCircle size={11} className="text-[#8094ae]" />
            <span className="text-[10px] text-[#526484] truncate">{notification.created_by_email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={11} className="text-[#8094ae]" />
            <span className="text-[10px] text-[#526484]">
              {new Date(notification.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag size={11} className="text-[#8094ae]" />
            <span className="text-[10px] text-[#526484] capitalize">
              {notification.target_role === "all" ? "All Roles" : notification.target_role}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {notification.is_broadcast ? (
              <Radio size={11} className="text-emerald-500" />
            ) : (
              <Bell size={11} className="text-[#8094ae]" />
            )}
            <span className="text-[10px] text-[#526484]">
              {notification.is_broadcast ? "Broadcast" : "Targeted"}
            </span>
          </div>
        </div>

        {/* Message Body */}
        <div className="px-5 py-4 min-h-[100px]">
          <p className="text-[11px] font-semibold text-[#8094ae] uppercase tracking-wider mb-2">
            Message
          </p>
          <p className="text-[13px] text-[#364a63] leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 pb-4">
          <button
            className="group flex items-center gap-2 px-4 py-1.5 rounded 
              text-red-500 border border-red-400 text-[11px] font-bold uppercase tracking-tight
              hover:bg-red-50 hover:border-red-500 transition-all duration-200"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;