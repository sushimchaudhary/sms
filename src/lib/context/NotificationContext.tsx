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

  // NotificationContext.tsx मा
// NotificationContext.tsx मा यो परिवर्तन गर्नुहोस्
const refreshNotifications = async () => {
  try {
    const res = await NotificationServices.getUnreadCount();
    
    // यहाँ log गरेर हेर्नुहोस् कि यो '2' कहिले '0' हुन्छ
    console.log("API बाट आएको ताजा Count:", res); 

    const count = Array.isArray(res) ? res.length : (res.count || 0);
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