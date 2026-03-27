"use client";
import { useEffect } from "react";
import { requestPermission } from "@/lib/notifications";

export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    requestPermission();
  }, []);
  return null;
}
