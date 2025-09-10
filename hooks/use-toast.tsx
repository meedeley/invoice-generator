"use client";

import React, { createContext, useContext, useState } from "react";

type Toast = { id: number; title: string; description?: string };
type ToastContextType = {
  toasts: Toast[];
  toast: (opts: { title: string; description?: string }) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (opts: { title: string; description?: string }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...opts }]);
    setTimeout(() => removeToast(id), 3000); // auto-close 3 detik
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-gray-800 text-white px-4 py-2 rounded shadow"
          >
            <strong>{t.title}</strong>
            {t.description && (
              <div className="text-sm text-gray-300">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
