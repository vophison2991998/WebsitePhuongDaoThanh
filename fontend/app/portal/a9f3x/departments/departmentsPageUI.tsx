"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { 
    FaBuilding, FaPlus, FaEdit, FaTrashAlt, 
    FaSearch, FaSpinner, FaArrowRight 
} from "react-icons/fa";
import Toast from "@/components/ui/Toast"; 
import { useDepartmentsLogic } from "./departmentsLogic";

// Màu sắc cho Avatar giả định
const AVATAR_COLORS = ['bg-rose-400', 'bg-sky-400', 'bg-emerald-400', 'bg-amber-400', 'bg-indigo-400'];

export default function DepartmentPageUI() {
    const { departments, loading: deptLoading, actions } = useDepartmentsLogic();
    
    // States mới để quản lý dữ liệu User thực tế
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ id: null as number | null, name: "", description: "" });

    // 1. Fetch dữ liệu tài khoản thật từ API Users
    useEffect(() => {
        const fetchRealUsers = async () => {
            try {
                const response = await fetch("/api/users");
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Lỗi kết nối dữ liệu nhân sự:", error);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchRealUsers();
    }, []);

    // 2. Logic tính toán số lượng thành viên thực tế dựa trên department_id
    const departmentsWithRealCount = useMemo(() => {
        return departments.map(dept => {
            // Lọc danh sách user thuộc phòng ban này
            const members = users.filter(u => u.department_id === dept.id);
            return {
                ...dept,
                real_count: members.length,
                preview_members: members.slice(0, 3) // Lấy 3 người đầu để làm avatar preview
            };
        });
    }, [departments, users]);

    const showToast = (message: string, type: any = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            showToast("Tên phòng ban không được để trống", "error");
            return;
        }

        const result = form.id 
            ? await actions.update(form.id, form.name, form.description)
            : await actions.create(form.name, form.description);

        if (result.success) {
            showToast(form.id ? "Cập nhật thành công!" : "Thêm mới thành công!");
            setIsModalOpen(false);
            setForm({ id: null, name: "", description: "" });
        } else {
            showToast(result.message || "Có lỗi xảy ra", "error");
        }
    };

    const onDelete = async (id: number, name: string) => {
        if (confirm(`Xóa phòng [${name}]? Dữ liệu nhân sự liên quan sẽ cần được điều chuyển.`)) {
            const result = await actions.delete(id);
            if (result.success) showToast("Đã xóa phòng ban", "warning");
            else showToast(result.message || "Lỗi khi xóa", "error");
        }
    };

    const filteredDepts = useMemo(() => {
        return departmentsWithRealCount.filter(d => 
            d.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [departmentsWithRealCount, search]);

    if (deptLoading || loadingUsers) return (
        <div className="p-20 text-center flex flex-col items-center justify-center gap-6 text-indigo-600">
            <FaSpinner className="animate-spin text-6xl opacity-20" />
            <span className="text-xl font-black tracking-widest animate-pulse uppercase">ĐANG KẾT NỐI KHÔNG GIAN...</span>
        </div>
    );

    return (
        <div className="p-8 space-y-10 bg-[#f8fafc] min-h-screen">
            {toast && (
                <div className="fixed top-10 right-10 z-[9999] animate-in slide-in-from-right duration-300">
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                </div>
            )}

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                            <FaBuilding size={28} />
                        </div>
                        PHÒNG BAN
                    </h1>
                    <p className="text-slate-500 font-medium text-lg ml-1">
                        Hệ thống ghi nhận <span className="text-indigo-600 font-bold">{users.length}</span> nhân sự đang hoạt động.
                    </p>
                </div>
                
                <button 
                    onClick={() => { setForm({ id: null, name: "", description: "" }); setIsModalOpen(true); }}
                    className="group bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                    <FaPlus className="group-hover:rotate-90 transition-transform" /> 
                    TẠO PHÒNG MỚI
                </button>
            </div>

            {/* SEARCH BAR */}
            <div className="relative max-w-xl group">
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Tìm nhanh đơn vị công tác..." 
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[20px] shadow-sm text-lg focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium"
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* GRID VIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredDepts.length > 0 ? (
                    filteredDepts.map((d) => (
                        <div key={d.id} className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full uppercase tracking-widest">
                                        #DEPT-{d.id}
                                    </span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => { setForm({ id: d.id, name: d.name, description: d.description || "" }); setIsModalOpen(true); }} 
                                            className="text-slate-300 hover:text-indigo-600 transition-colors p-2"
                                        >
                                            <FaEdit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(d.id, d.name)} 
                                            className="text-slate-300 hover:text-rose-600 transition-colors p-2"
                                        >
                                            <FaTrashAlt size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">
                                    {d.name}
                                </h3>
                                <p className="text-slate-400 text-sm mb-8 line-clamp-2 h-10 font-medium italic">
                                    {d.description || "Đơn vị vận hành nội bộ."}
                                </p>

                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-5">
                                        <div className="flex -space-x-2">
                                            {d.preview_members.map((m: any, i: number) => (
                                                <div 
                                                    key={m.id} 
                                                    title={m.full_name}
                                                    className={`w-9 h-9 rounded-xl border-2 border-white ${AVATAR_COLORS[i % 5]} flex items-center justify-center text-xs font-black text-white uppercase shadow-sm`}
                                                >
                                                    {m.full_name.charAt(0)}
                                                </div>
                                            ))}
                                            {d.real_count > 3 && (
                                                <div className="w-9 h-9 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    +{d.real_count - 3}
                                                </div>
                                            )}
                                            {d.real_count === 0 && (
                                                <div className="w-9 h-9 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                                    ?
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-tighter">
                                            {d.real_count} NHÂN SỰ
                                        </span>
                                    </div>

                                    <Link 
                                        href={`/portal/a9f3x/departments/${d.id}`}
                                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all uppercase tracking-[0.2em] group/btn"
                                    >
                                        TRUY CẬP KHÔNG GIAN <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center">
                        <p className="text-slate-300 font-black text-2xl italic uppercase tracking-widest">Không có dữ liệu phòng ban</p>
                    </div>
                )}
            </div>

            {/* MODAL SYSTEM (Giữ nguyên logic form của bạn) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                                    {form.id ? "Cập nhật đơn vị" : "Khởi tạo đơn vị"}
                                </h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Cấu trúc tổ chức A9F3X</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white/5 hover:bg-rose-500 rounded-2xl flex items-center justify-center transition-all">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tên định danh</label>
                                <input 
                                    required value={form.name}
                                    className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[25px] text-lg transition-all outline-none font-bold text-slate-800" 
                                    placeholder="Ví dụ: PHÒNG NHÂN SỰ" 
                                    onChange={e => setForm({...form, name: e.target.value.toUpperCase()})} 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mô tả nhiệm vụ</label>
                                <textarea 
                                    rows={3} value={form.description}
                                    className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[25px] text-base transition-all outline-none font-medium" 
                                    placeholder="Mô tả ngắn gọn chức năng của phòng..." 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                />
                            </div>
                            <button className="w-full py-6 bg-indigo-600 text-white rounded-[25px] font-black text-lg hover:bg-slate-900 transition-all uppercase italic tracking-widest active:scale-95 shadow-xl shadow-indigo-100">
                                {form.id ? "LƯU THÔNG TIN" : "XÁC NHẬN THIẾT LẬP"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}