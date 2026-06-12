"use client";

import { useEffect } from "react";
import { subscribePush } from "@/lib/push-client";

export default function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    // 已授權過通知的話，靜默確保訂閱還活著（不會跳權限視窗）
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      subscribePush();
    }
  }, []);
  return null;
}
