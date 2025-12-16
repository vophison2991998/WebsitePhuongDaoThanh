// app/portal/a9f3x/departments/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FaBuilding, FaPlus, FaEdit, FaTrashAlt, FaSearch } from "react-icons/fa";
// Giả định component Toast đã được tạo và đặt tại @/components/ui/Toast
import Toast, { ToastType } from "@/components/ui/Toast"; 

interface Department {
    id: number;
    name: string;
    description?: string;
    user_count?: number; // Giả định backend trả về số nhân viên mỗi phòng
}

// Giả định Avatar Data (để hiển thị 3 avatar giả)
const DUMMY_AVATARS = [
    { id: 1, initial: 'N', color: 'bg-red-400' },
    { id: 2, initial: 'V', color: 'bg-blue-400' },
    { id: 3, initial: 'T', color: 'bg-green-400' },
];

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
        // Tự động đóng toast sau 5 giây
        setTimeout(() => setToast(null), 5000);
    };

    // --- LOGIC GỌI API ---
    const loadDepts = async () => {
        setLoading(true);
        try {
            // Thay thế bằng endpoint API thực tế
            // const res = await axios.get("http://localhost:5000/api/departments");
            // Dữ liệu giả định
            const res = { data: [
                { id: 1, name: "Phòng Kỹ Thuật", description: "Quản lý hệ thống máy chủ, mạng lưới và phần mềm công ty.", user_count: 15 },
                { id: 2, name: "Phòng Hành chính - Nhân sự", description: "Tuyển dụng, đào tạo, quản lý hồ sơ nhân viên và công tác hành chính.", user_count: 8 },
                { id: 3, name: "Phòng Kế toán - Tài chính", description: "Quản lý thu chi, lập báo cáo tài chính và cân đối ngân sách.", user_count: 6 },
                { id: 4, name: "Phòng Kinh doanh", description: "Phát triển thị trường, tìm kiếm khách hàng và ký kết hợp đồng.", user_count: 22 },
            ]};
            setDepts(res.data);
            setLoading(false);
        } catch (err) {
            showToast("Lỗi tải danh sách phòng ban", "error");
            setLoading(false);
        }
    };

    useEffect(() => { loadDepts(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            showToast("Tên phòng ban không được để trống", "error");
            return;
        }

        try {
            // Logic gọi API (Giả định)
            // if (form.id) {
            //   await axios.put(`http://localhost:5000/api/departments/${form.id}`, form);
            // } else {
            //   await axios.post("http://localhost:5000/api/departments", form);
            // }

            // Logic cập nhật UI giả định
            if (form.id) {
                setDepts(prev => prev.map(d => d.id === form.id ? { ...d, name: form.name, description: form.description } : d));
                showToast("Cập nhật phòng ban thành công!");
            } else {
                const newDept: Department = { id: depts.length + 10, name: form.name, description: form.description, user_count: 0 };
                setDepts(prev => [newDept, ...prev]);
                showToast("Thêm phòng ban mới thành công!");
            }

            setIsModalOpen(false);
            setForm({ id: null, name: "", description: "" });
            // loadDepts(); // Gọi lại load data nếu dùng API thật
        } catch {
            showToast("Lỗi xử lý dữ liệu", "error");
        }
    };

    const handleDelete = async (id: number, name: string) => {
        // Kiểm tra xem phòng ban có nhân sự không (Giả định)
        const deptToDelete = depts.find(d => d.id === id);
        if (deptToDelete?.user_count && deptToDelete.user_count > 0) {
            showToast("Không thể xóa phòng ban đang có nhân sự (Vui lòng chuyển nhân sự trước).", "error");
            return;
        }

        if (confirm(`Xóa phòng [${name}]? Hành động này không thể hoàn tác.`)) {
            try {
                // await axios.delete(`http://localhost:5000/api/departments/${id}`); // Gọi API thật
                setDepts(prev => prev.filter(d => d.id !== id));
                showToast("Đã xóa phòng ban thành công", "warning");
                // loadDepts();
            } catch {
                showToast("Lỗi khi xóa phòng ban.", "error");
            }
        }
    };
    // --- KẾT THÚC LOGIC API ---

    const filteredDepts = useMemo(() => {
        return depts.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    }, [depts, search]);


    // Giao diện Loading
    if (loading) return <div className="p-20 text-center animate-pulse text-2xl font-black text-indigo-600">ĐANG TẢI DỮ LIỆU PHÒNG BAN...</div>;

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-base">
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className="fixed top-10 right-10 z-[9999]">
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                </div>
            )}

            {/* HEADER VÀ NÚT THÊM MỚI */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <FaBuilding className="text-indigo-600" /> QUẢN LÝ PHÒNG BAN
                    </h1>
                    <p className="text-slate-500 text-lg">Thiết lập cấu trúc tổ chức công ty ({depts.length} phòng ban)</p>
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
                    className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl shadow-md text-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* GRID DANH SÁCH PHÒNG BAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDepts.length > 0 ? (
                    filteredDepts.map((d) => (
                        <div key={d.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <FaBuilding size={24} />
                                </div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button title="Sửa" onClick={() => { setForm({ id: d.id, name: d.name, description: d.description || "" }); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 rounded-lg transition-colors">
                                        <FaEdit size={16} />
                                    </button>
                                    <button title="Xóa" onClick={() => handleDelete(d.id, d.name)} className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 rounded-lg transition-colors">
                                        <FaTrashAlt size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-1 leading-snug">{d.name}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">
                                {d.description || "Chưa có mô tả chức năng."}
                            </p>

                            {/* FOOTER: THÔNG TIN NHÂN SỰ */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <div className="flex -space-x-1.5">
                                    {DUMMY_AVATARS.map(avatar => (
                                        <div key={avatar.id} className={`w-8 h-8 rounded-full border-2 border-white ${avatar.color} flex items-center justify-center text-xs font-bold text-white shadow-md`}>
                                            {avatar.initial}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-indigo-600 font-bold text-sm">
                                    {d.user_count || 0} Nhân viên
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-slate-500">
                        {search ? "Không tìm thấy phòng ban nào khớp với từ khóa." : "Hiện chưa có phòng ban nào được thiết lập."}
                    </div>
                )}
            </div>

            {/* MODAL THÊM/SỬA */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center rounded-t-[24px]">
                            <h2 className="text-2xl font-black uppercase tracking-tight">
                                {form.id ? "Cập nhật phòng ban" : "Tạo phòng ban mới"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-2xl opacity-80 hover:opacity-100 transition-opacity">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Tên phòng ban (*)</label>
                                <input 
                                    required 
                                    value={form.name}
                                    className="w-full p-4 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-lg transition-all outline-none font-semibold" 
                                    placeholder="Vd: Phòng Kỹ Thuật" 
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mô tả chức năng</label>
                                <textarea 
                                    rows={3}
                                    value={form.description}
                                    className="w-full p-4 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-base transition-all outline-none" 
                                    placeholder="Nhập nhiệm vụ chính của phòng..." 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                />
                            </div>
                            <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase active:scale-[0.98]">
                                {form.id ? "Lưu thay đổi" : "Kích hoạt phòng ban"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}