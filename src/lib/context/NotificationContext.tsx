// lib/context/NotificationContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { NotificationServices } from "@/services/notificationServices";

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = async () => {
  try {
    const res = await NotificationServices.getUnreadCount();
    

    const count = 
      res.count !== undefined ? res.count :       
      res.total_count !== undefined ? res.total_count : 
      Array.isArray(res) ? res.length :            
      0;

    // console.log("अन्तिममा सेट गरिएको Count:", count);
    setUnreadCount(count);
  } catch (err) {
    console.error("Failed to fetch notification count", err);
  }
};

  useEffect(() => {
    refreshNotifications();
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};