// app/portal/a9f3x/tasks/page.tsx
"use client";

import { useState } from "react";
import { FaPlus, FaFilter, FaRegClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function AdminTaskManager() {
  const [activeTab, setActiveTab] = useState("all");

  // Dữ liệu mẫu phân theo phòng ban
  const departments = ["Phòng Kỹ thuật", "Phòng Nhân sự", "Phòng Kinh doanh", "Phòng Kế toán"];

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút thêm mới */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý nhiệm vụ hệ thống</h1>
          <p className="text-slate-500 text-sm">Điều phối và giám sát công việc toàn cơ quan</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-md">
          <FaPlus /> Giao nhiệm vụ mới
        </button>
      </div>

      {/* Thanh lọc nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FaRegClock size={20}/></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Đang thực hiện</p>
            <p className="text-xl font-bold">24</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><FaCheckCircle size={20}/></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Hoàn thành</p>
            <p className="text-xl font-bold">156</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><FaExclamationTriangle size={20}/></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Trễ hạn</p>
            <p className="text-xl font-bold">3</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><FaFilter size={20}/></div>
          <select className="bg-transparent outline-none w-full text-sm font-semibold">
            <option>Tất cả phòng ban</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Bảng danh sách nhiệm vụ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Danh sách công việc đang điều phối</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Nhiệm vụ</th>
                <th className="px-6 py-4 font-semibold">Phòng ban</th>
                <th className="px-6 py-4 font-semibold">Phụ trách</th>
                <th className="px-6 py-4 font-semibold">Hạn chót</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Ví dụ dòng dữ liệu */}
              <tr className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium text-slate-900">Nâng cấp Firewall lớp 3</td>
                <td className="px-6 py-4 text-slate-600">Phòng Kỹ thuật</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">M</div>
                    <span>Manager_KỹThuật</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">25/12/2025</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-bold">Ưu tiên cao</span>
                </td>
                <td className="px-6 py-4 text-center text-blue-600 font-bold cursor-pointer hover:underline">Chi tiết</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}