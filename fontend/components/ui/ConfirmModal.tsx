"use client";
import React from "react";
import { FaExclamationTriangle, FaTrashAlt, FaQuestionCircle } from "react-icons/fa";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, type = "warning", onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;
  const themes = {
    danger: { icon: <FaTrashAlt className="text-rose-600" size={24} />, btnConfirm: "bg-rose-600 hover:bg-rose-700 shadow-rose-200", border: "border-rose-100", bgIcon: "bg-rose-100" },
    warning: { icon: <FaExclamationTriangle className="text-amber-600" size={24} />, btnConfirm: "bg-amber-600 hover:bg-amber-700 shadow-amber-200", border: "border-amber-100", bgIcon: "bg-amber-100" },
    info: { icon: <FaQuestionCircle className="text-indigo-600" size={24} />, btnConfirm: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200", border: "border-indigo-100", bgIcon: "bg-indigo-100" }
  };
  const style = themes[type];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel} />
      <div className={`relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border ${style.border} overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl ${style.bgIcon} flex items-center justify-center shrink-0`}>{style.icon}</div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">Security Protocol</p>
            </div>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed mb-8">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all active:scale-95">HỦY BỎ</button>
            <button onClick={() => { onConfirm(); onCancel(); }} className={`flex-[1.5] py-4 px-6 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${style.btnConfirm}`}>XÁC NHẬN</button>
          </div>
        </div>
      </div>
    </div>
  );
}