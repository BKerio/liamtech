"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "danger" };

/** Fire from anywhere on the client: showToast("Added to basket") */
export function showToast(message: string, tone: Toast["tone"] = "success") {
  window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, tone } }));
}

export default function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const { message, tone } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    };
    window.addEventListener("app:toast", on);
    return () => window.removeEventListener("app:toast", on);
  }, []);
  return (
    <div id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
          <div className={`toast-body text-${t.tone}`}>{t.message}</div>
        </div>
      ))}
    </div>
  );
}
