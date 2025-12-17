"use client";

import LoginForm from "@/components/auth/LoginForm";
import { useToast } from "@/components/ui/ToastContext";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Landmark, Phone, Lock, ChevronRight, Scale, Bell } from "lucide-react";

export default function LoginPage() {
  const year = new Date().getFullYear();
  const toast = useToast();
  const shown = useRef(false);
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDateTime(now.toLocaleDateString("vi-VN", {
        weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      }));
    }, 1000);

    if (!shown.current) {
      toast.showToast("Cổng thông tin xác thực quốc gia sẵn sàng");
      shown.current = true;
    }
    return () => clearInterval(timer);
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F4F7] font-sans antialiased text-slate-900">
      
      {/* 1. TOP HEADER - CÔNG BÁO & THỜI GIAN */}
      <div className="w-full bg-[#A80000] py-1.5 px-6 text-white text-[11px] font-medium border-b border-yellow-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Bell size={12} /> Thông báo: Hệ thống bảo trì định kỳ vào 00:00 Chủ nhật</span>
          </div>
          <div className="hidden md:block italic opacity-90">{dateTime}</div>
        </div>
      </div>

      {/* 2. CHÍNH QUY HEADER - NHẬN DIỆN CƠ QUAN */}
      <header className="w-full bg-white border-b-4 border-[#A80000] py-4 px-6 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-[#A80000] rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-500">
                <Landmark size={28} className="text-white" />
              </div>
              {/* Decorative Circle bao quanh */}
              <div className="absolute -inset-1 border border-red-200 rounded-full animate-spin-slow opacity-20" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-[#A80000] leading-none uppercase tracking-tight">
                Cổng thông tin điện tử nội bộ
              </h1>
              <p className="text-[11px] md:text-xs font-bold text-slate-600 uppercase tracking-[2px] mt-1">
                Cơ quan quản lý hành chính tập trung
              </p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Đường dây nóng</p>
              <p className="text-sm font-black text-red-700 flex items-center gap-2">
                <Phone size={14} /> 1900.XXXX
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. KHÔNG GIAN ĐĂNG NHẬP CHÍNH */}
      <main className="flex-1 relative flex items-center justify-center p-6 lg:p-12 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]">
        
        {/* Họa tiết chìm quốc hồn quốc túy (giả lập Trống Đồng) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="w-[800px] h-[800px] border-[40px] border-slate-900 rounded-full flex items-center justify-center font-black text-[400px]">
            <Landmark strokeWidth={0.5} size={500} />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-200">
          
          {/* CỘT TRÁI: TUYÊN NGÔN & PHÁP LÝ */}
          <div className="flex-1 bg-[#1e293b] p-10 lg:p-14 flex flex-col justify-between relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent opacity-50" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded text-red-400 text-[10px] font-black uppercase tracking-widest mb-8 border border-red-600/30">
                <ShieldCheck size={12} /> Hệ thống bảo mật quản lý nội bộ
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
                Xác thực định danh <br /> Cán bộ, Công chức
              </h2>
              <div className="h-1.5 w-20 bg-yellow-500 mb-8" />
              <ul className="space-y-4">
                {[
                  "Quản lý công việc tập trung",
                  "Bảo mật dữ liệu công vụ",
                  "Truy vết lịch sử thao tác"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <ChevronRight size={16} className="text-yellow-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 pt-10 border-t border-slate-700 flex items-center gap-4 text-slate-500">
              <Scale size={32} strokeWidth={1} />
              <p className="text-[10px] font-medium leading-relaxed italic uppercase tracking-tighter">
                Thực hiện theo Nghị định số 13/2023/NĐ-CP <br /> về bảo vệ dữ liệu cá nhân.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: KHU VỰC ĐĂNG NHẬP */}
          <div className="flex-[1.2] p-8 md:p-16 lg:p-20 bg-white flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <div className="flex justify-center md:justify-start mb-8 lg:hidden">
                <div className="w-12 h-12 bg-red-700 rounded-full flex items-center justify-center">
                  <Landmark size={24} className="text-white" />
                </div>
              </div>

              <div className="text-center md:text-left mb-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Đăng nhập tài khoản</h3>
                <p className="text-slate-500 text-xs font-bold flex items-center justify-center md:justify-start gap-2 uppercase tracking-wide">
                  <Lock size={12} className="text-red-700" /> Khu vực dành cho cán bộ
                </p>
              </div>

              {/* FORM COMPONENT */}
              <LoginForm />

              <div className="mt-12 text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px]">
                  Cổng xác thực tập trung - SSO
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. FOOTER HÀNH CHÍNH TỔNG THỂ */}
      <footer className="w-full bg-white border-t border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center font-medium">
          <div className="text-center md:text-left text-slate-600">
            <p className="text-sm font-black text-slate-900 uppercase tracking-wide">© {year} Bản quyền thuộc về Phường Đạo Thạnh</p>
            <p className="text-xs mt-2">Chịu trách nhiệm chính: Trung tâm Thông tin và Chuyển đổi số</p>
            <p className="text-[11px] opacity-70 mt-1 italic">Mọi hành vi sao chép, truy cập trái phép sẽ bị xử lý theo quy định của pháp luật.</p>
          </div>
          <div className="flex justify-center md:justify-end gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-red-700 underline underline-offset-4">Hướng dẫn</a>
            <a href="#" className="hover:text-red-700 underline underline-offset-4">Chính sách bảo mật</a>
            <a href="#" className="hover:text-red-700 underline underline-offset-4">Hỗ trợ cán bộ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}