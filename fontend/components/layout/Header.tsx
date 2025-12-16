// frontend/components/layout/Header.tsx
"use client";

import { logout } from "@/lib/auth";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 fixed top-0 w-full z-10">
      <div className="font-bold text-blue-800 text-lg uppercase tracking-wider">
        Hệ thống Quản lý Nội bộ
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700">
          <FaUserCircle size={24} />
          <span className="text-sm font-medium">Cán bộ hệ thống</span>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-1 text-red-500 hover:text-red-700 transition font-medium text-sm border-l pl-4"
        >
          <FaSignOutAlt /> Thoát
        </button>
      </div>
    </header>
  );
}