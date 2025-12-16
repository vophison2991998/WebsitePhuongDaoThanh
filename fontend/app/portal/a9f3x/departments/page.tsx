"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FaBuilding, FaPlus, FaEdit, FaTrashAlt, FaUsers, FaSearch } from "react-icons/fa";
import Toast, { ToastType } from "@/components/ui/Toast"; 

interface Department {
  id: number;
  name: string;
  description?: string;
  user_count?: number; // Giả định backend trả về số nhân viên mỗi phòng
}

export default function DepartmentPage() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null as number | null, name: "", description: "" });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const loadDepts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/departments");
      setDepts(res.data);
      setLoading(false);
    } catch (err) {
      showToast("Lỗi tải danh sách phòng ban", "error");
    }
  };

  useEffect(() => { loadDepts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id) {
        await axios.put(`http://localhost:5000/api/departments/${form.id}`, form);
        showToast("Cập nhật phòng ban thành công!");
      } else {
        await axios.post("http://localhost:5000/api/departments", form);
        showToast("Thêm phòng ban mới thành công!");
      }
      setIsModalOpen(false);
      setForm({ id: null, name: "", description: "" });
      loadDepts();
    } catch {
      showToast("Lỗi xử lý dữ liệu", "error");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Xóa phòng [${name}] có thể ảnh hưởng đến nhân sự thuộc phòng này. Bạn chắc chắn chứ?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${id}`);
        showToast("Đã xóa phòng ban", "warning");
        loadDepts();
      } catch {
        showToast("Không thể xóa phòng ban đang có nhân sự", "error");
      }
    }
  };

  const filteredDepts = depts.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-20 text-center animate-pulse text-2xl font-black text-indigo-600">ĐANG TẢI DỮ LIỆU PHÒNG BAN...</div>;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-base">
      {toast && (
        <div className="fixed top-10 right-10 z-[9999]">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">QUẢN LÝ PHÒNG BAN</h1>
          <p className="text-slate-500 text-lg">Thiết lập cấu trúc tổ chức công ty</p>
        </div>
        <button 
          onClick={() => { setForm({ id: null, name: "", description: "" }); setIsModalOpen(true); }}
          className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"
        >
          <FaPlus /> THÊM PHÒNG BAN
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-2xl">
        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
        <input 
          type="text" 
          placeholder="Tìm tên phòng ban..." 
          className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl shadow-sm text-lg focus:ring-2 focus:ring-indigo-500 transition-all"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* GRID DANH SÁCH PHÒNG BAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDepts.map((d) => (
          <div key={d.id} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FaBuilding size={32} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm({ id: d.id, name: d.name, description: d.description || "" }); setIsModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-colors">
                  <FaEdit size={20} />
                </button>
                <button onClick={() => handleDelete(d.id, d.name)} className="p-3 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl transition-colors">
                  <FaTrashAlt size={20} />
                </button>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2">{d.name}</h3>
            <p className="text-slate-500 text-base mb-6 line-clamp-2 h-12">
              {d.description || "Chưa có mô tả cho phòng ban này."}
            </p>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                    U{i}
                  </div>
                ))}
              </div>
              <span className="text-indigo-600 font-bold text-base">
                {d.user_count || 0} Nhân viên
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL THÊM/SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                {form.id ? "Cập nhật phòng" : "Tạo phòng ban mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-3xl hover:rotate-90 transition-transform">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Tên phòng ban</label>
                <input 
                  required 
                  value={form.name}
                  className="w-full p-5 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-xl transition-all outline-none font-bold" 
                  placeholder="Vd: Phòng Kỹ Thuật" 
                  onChange={e => setForm({...form, name: e.target.value})} 
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Mô tả chức năng</label>
                <textarea 
                  rows={4}
                  value={form.description}
                  className="w-full p-5 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-lg transition-all outline-none" 
                  placeholder="Nhập nhiệm vụ chính của phòng..." 
                  onChange={e => setForm({...form, description: e.target.value})} 
                />
              </div>
              <button className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-2xl transition-all uppercase active:scale-95">
                {form.id ? "Lưu thay đổi" : "Kích hoạt phòng ban"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}