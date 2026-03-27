"use client";
import { useEffect } from "react";
import { registerSW, requestPermission, scheduleReminders } from "@/lib/notifications";

export default function SwRegister() {
  useEffect(() => {
    registerSW();
    requestPermission().then((granted) => {
      if (granted) scheduleReminders();
    });
  }, []);
  return null;
}
