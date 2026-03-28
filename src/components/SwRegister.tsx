"use client";
import { useEffect } from "react";
import { registerSW, requestPermission, scheduleReminders, subscribePush } from "@/lib/notifications";

export default function SwRegister() {
  useEffect(() => {
    registerSW();
    requestPermission().then((granted) => {
      if (granted) {
        scheduleReminders();
        subscribePush();
      }
    });
  }, []);
  return null;
}
