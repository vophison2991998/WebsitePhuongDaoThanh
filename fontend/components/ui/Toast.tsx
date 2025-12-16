"use client";

import { useEffect } from "react";
import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

export type ToastType = "success" | "error" | "info" | "warning";

const styles: Record<
  ToastType,
  {
    icon: React.ReactNode;
    bg: string;
    border: string;
    iconBg: string;
    bar: string;
    title: string;
  }
> = {
  success: {
    icon: <FaCheckCircle />,
    title: "Thành công",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-500/40",
    iconBg: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  error: {
    icon: <FaTimesCircle />,
    title: "Lỗi",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    border: "border-rose-500/40",
    iconBg: "bg-rose-500",
    bar: "bg-rose-500",
  },
  info: {
    icon: <FaInfoCircle />,
    title: "Thông tin",
    bg: "bg-sky-50 dark:bg-sky-900/30",
    border: "border-sky-500/40",
    iconBg: "bg-sky-500",
    bar: "bg-sky-500",
  },
  warning: {
    icon: <FaExclamationTriangle />,
    title: "Cảnh báo",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-500/40",
    iconBg: "bg-amber-500",
    bar: "bg-amber-500",
  },
};

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  duration = 3500,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const style = styles[type];

  return (
    <div
      className={`
        w-[360px] overflow-hidden rounded-2xl
        border ${style.border}
        backdrop-blur-xl
        shadow-[0_20px_40px_rgba(0,0,0,0.35)]
        animate-toast-in
        ${style.bg}
      `}
    >
      {/* HEADER */}
      <div className="flex items-start gap-4 p-4">
        {/* ICON */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${style.iconBg}`}
        >
          {style.icon}
        </div>

        {/* CONTENT */}
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-white">
            {style.title}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
            {message}
          </p>
        </div>

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* PROGRESS */}
      <div className="h-[3px] bg-black/10 dark:bg-white/10">
        <div
          className={`h-full ${style.bar} animate-toast-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}
