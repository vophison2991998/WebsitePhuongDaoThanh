// frontend/app/portal/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { validateAuthOrLogout } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/sidebar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Kiểm tra cookies ngay khi vào trang
    const isValid = validateAuthOrLogout();
    if (isValid) {
      setIsAuthorized(true);
    }
  }, []);

  // Nếu chưa xác thực xong hoặc không có cookies, không hiển thị gì cả (hoặc hiển thị loading)
  if (!isAuthorized) {
    return <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* 1. Phần trên đầu */}
      <Header />

      <div className="flex pt-16">
        {/* 2. Phần bên trái */}
        <Sidebar />

        {/* 3. Phần nội dung chính (Thư mục mã hóa a9f3x, m2k8q...) */}
        <main className="flex-1 ml-64 p-8 transition-all">
          <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[calc(100vh-120px)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}