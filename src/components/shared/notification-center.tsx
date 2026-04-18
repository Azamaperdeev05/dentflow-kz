"use client";

import { useEffect, useState } from "react";

type NotificationAlert = {
  id: string;
  title: string;
  body: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);

  useEffect(() => {
    // Poll for new notifications every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as { notifications?: NotificationAlert[] };
        if (data.notifications && data.notifications.length > 0) {
          const ids = data.notifications.map((item) => item.id);

          setNotifications((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const fresh = data.notifications!.filter((item) => !seen.has(item.id));
            return [...fresh, ...prev].slice(0, 5);
          });

          void fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          });

          // Auto-remove after 5 seconds
          setTimeout(() => {
            setNotifications((prev) => prev.slice(1));
          }, 5000);
        }
      } catch {
        // Silently fail
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: NotificationAlert["type"]) => {
    switch (type) {
      case "SUCCESS":
        return "✓";
      case "ERROR":
        return "✕";
      case "WARNING":
        return "!";
      case "INFO":
      default:
        return "ℹ";
    }
  };

  const getColors = (type: NotificationAlert["type"]) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-100 border-green-500 text-green-900";
      case "ERROR":
        return "bg-red-100 border-red-500 text-red-900";
      case "WARNING":
        return "bg-yellow-100 border-yellow-500 text-yellow-900";
      case "INFO":
      default:
        return "bg-blue-100 border-blue-500 text-blue-900";
    }
  };

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`rounded-lg border-l-4 p-3 shadow-lg ${getColors(notif.type)} max-w-sm animate-in fade-in slide-in-from-right`}
        >
          <div className="flex items-start gap-3">
            <span className="font-bold text-lg">{getIcon(notif.type)}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{notif.title}</p>
              <p className="text-xs opacity-90">{notif.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
