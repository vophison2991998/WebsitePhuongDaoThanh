"use client";

import { useState, useEffect } from "react";
import api from "../../../login/API.js"; 
import { FaUserPlus, FaSearch, FaBuilding, FaCheckCircle, FaUserSlash, FaTrashAlt, FaHistory, FaUndo, FaShieldAlt } from "react-icons/fa";
import Toast, { ToastType } from "@/components/ui/Toast"; 
// Import ConfirmModal của bạn
import ConfirmModal from "@/components/ui/ConfirmModal"; 

interface User { id: number; username: string; full_name: string; role: string; role_id: number; department_id: number; dept: string; status: boolean; deleted_at?: string; }
interface Role { id: number; code: string; name: string; }
interface Department { id: number; name: string; }
interface DataState { users: User[]; roles: Role[]; departments: Department[]; }

// Định nghĩa interface cho cấu hình Confirm
interface ConfirmConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: "danger" | "warning" | "info";
  onConfirm: () => void;
}

export default function CompleteUserPage() {
  const [activeTab, setActiveTab] = useState<"active" | "trash">("active");
  const [data, setData] = useState<DataState>({ users: [], roles: [], departments: [] });
  const [trashData, setTrashData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [search, setSearch] = useState("");
  const [selRole, setSelRole] = useState("");
  const [selDept, setSelDept] = useState("");
  const [form, setForm] = useState({ username: "", password: "", full_name: "", role_id: "", department_id: "" });

  // State mới quản lý hộp thoại Confirm
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const showToast = (message: string, type: ToastType = "success") => setToast({ message, type });
  const closeConfirm = () => setConfirmConfig(null);

  const loadData = async () => {
    try {
      const [resMain, resTrash] = await Promise.all([
        api.get("/users"),
        api.get("/users/trash")
      ]);
      
      setData({
        users: resMain.data.users || (Array.isArray(resMain.data) ? resMain.data : []),
        roles: resMain.data.roles || [],
        departments: resMain.data.departments || []
      });
      setTrashData(resTrash.data || []);
    } catch (error: any) {
      showToast("Lỗi đồng bộ dữ liệu hệ thống", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      showToast("Cấp hồ sơ cán bộ thành công!");
      setIsModalOpen(false);
      loadData();
    } catch { showToast("Tên đăng nhập đã tồn tại", "error"); }
  };

  const handleToggle = async (userId: number) => {
    try {
      await api.patch(`/users/${userId}/status`);
      showToast("Cập nhật trạng thái thành công");
      loadData();
    } catch { showToast("Lỗi cập nhật trạng thái", "error"); }
  };

  // CẬP NHẬT: Sử dụng ConfirmModal cho Xóa tạm
  const handleSoftDelete = (id: number, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Lưu trữ hồ sơ",
      message: `Đưa hồ sơ [${name}] vào thùng rác? Dữ liệu sẽ tự động xóa sau 30 ngày.`,
      type: "warning",
      onConfirm: async () => {
        try {
          await api.patch(`/users/${id}/soft-delete`);
          showToast(`Đã chuyển ${name} vào khu vực lưu trữ`, "warning");
          loadData(); 
        } catch { showToast("Lỗi khi thực hiện xóa tạm", "error"); }
      }
    });
  };

  const handleRestore = async (id: number) => {
    try {
      await api.patch(`/users/${id}/restore`);
      showToast("Khôi phục tài khoản thành công");
      loadData();
    } catch { showToast("Không thể khôi phục tài khoản", "error"); }
  };

  // CẬP NHẬT: Sử dụng ConfirmModal cho Xóa vĩnh viễn
  const handlePermanentDelete = (id: number, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "CẢNH BÁO NGUY HIỂM",
      message: `Xác nhận xóa vĩnh viễn hồ sơ của [${name}]? Hành động này không thể hoàn tác.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/users/${id}`);
          showToast(`Đã hủy bỏ vĩnh viễn hồ sơ ${name}`, "error");
          loadData();
        } catch { showToast("Lỗi ràng buộc dữ liệu", "error"); }
      }
    });
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await api.patch(`/users/${userId}/role`, { role_id: roleId });
      showToast("Đã cập nhật phân quyền mới");
      loadData();
    } catch { showToast("Lỗi thay đổi vai trò", "error"); }
  };

  const handleDeptChange = async (userId: number, deptId: number) => {
    try {
      await api.patch(`/users/${userId}/department`, { department_id: deptId });
      showToast("Điều chuyển đơn vị thành công");
      loadData();
    } catch { showToast("Lỗi cập nhật phòng ban", "error"); }
  };

  const displayUsers = activeTab === "active" ? data.users : trashData;
  const filteredUsers = (displayUsers || []).filter((u: User) => {
    const matchText = u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                      u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = selRole === "" || u.role === selRole;
    const matchDept = selDept === "" || u.dept === selDept;
    return matchText && matchRole && matchDept;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-indigo-600 font-black tracking-widest text-xl uppercase italic">Synchronizing Data...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen relative text-base">
      {/* 1. TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999]">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* 2. CONFIRM MODAL (Chèn vào đây) */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          onConfirm={confirmConfig.onConfirm}
          onCancel={closeConfirm}
        />
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              QUẢN TRỊ NHÂN SỰ <span className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg shadow-lg shadow-indigo-100 italic">v2.1</span>
          </h1>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-[0.3em] mt-1 ml-1 italic">
            {activeTab === "active" ? "Personnel Security Protocol" : "Deep Storage Archive - 30 Days Retention"}
          </p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setActiveTab(activeTab === "active" ? "trash" : "active")}
                className={`px-6 py-4 rounded-2xl font-black flex items-center gap-3 transition-all text-sm shadow-xl relative overflow-hidden group ${
                    activeTab === "active" ? "bg-white text-slate-600 hover:bg-rose-50 border border-slate-100" : "bg-rose-600 text-white"
                }`}
            >
                {activeTab === "active" ? (
                  <>
                    <FaHistory className="group-hover:rotate-[-45deg] transition-transform text-rose-500" /> 
                    THÙNG RÁC 
                    {trashData.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-rose-500 text-white text-[10px] rounded-full animate-pulse border border-white/20">
                        {trashData.length}
                      </span>
                    )}
                  </>
                ) : (
                  <><FaShieldAlt /> QUAY LẠI HỆ THỐNG</>
                )}
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all active:scale-95 text-sm"
            >
                <FaUserPlus size={18} /> THÊM CÁN BỘ
            </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Tìm kiếm danh tính cán bộ..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-600"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {activeTab === "active" && (
            <>
                <select onChange={(e) => setSelRole(e.target.value)} className="px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-500 text-sm appearance-none cursor-pointer">
                    <option value="">TẤT CẢ CHỨC VỤ</option>
                    {data.roles.map((r) => <option key={r.id} value={r.code}>{r.name}</option>)}
                </select>
                <select onChange={(e) => setSelDept(e.target.value)} className="px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-500 text-sm appearance-none cursor-pointer">
                    <option value="">TẤT CẢ PHÒNG BAN</option>
                    {data.departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
            </>
        )}
      </div>

      {/* USER TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Danh tính</th>
              <th className="px-8 py-6">Đơn vị công tác</th>
              <th className="px-8 py-6 text-center">Phân quyền</th>
              <th className="px-8 py-6 text-center">{activeTab === "active" ? "Trạng thái" : "Ngày xóa"}</th>
              <th className="px-8 py-6 text-right">Quản lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.length > 0 ? filteredUsers.map((u) => (
              <tr key={u.id} className={`transition-all group ${activeTab === 'trash' ? 'hover:bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-all ${
                        activeTab === 'active' ? 'bg-slate-900 group-hover:bg-indigo-600' : 'bg-rose-500 opacity-80'
                    }`}>
                      {u.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-black text-lg ${activeTab === 'trash' ? 'text-rose-900' : 'text-slate-700'}`}>{u.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">@{u.username} • ID: {u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-slate-700 font-black text-sm uppercase italic">
                      <FaBuilding className={activeTab === 'active' ? 'text-indigo-400' : 'text-rose-400'} size={12}/> {u.dept || "N/A"}
                    </span>
                    {activeTab === "active" && (
                        <select 
                            className="text-[10px] bg-transparent border-none text-slate-400 font-bold focus:ring-0 cursor-pointer hover:text-indigo-600 p-0"
                            value={data.departments.find(d => d.name === u.dept)?.id || ""}
                            onChange={(e) => handleDeptChange(u.id, Number(e.target.value))}
                        >
                            <option value="" disabled>--- Điều chuyển đơn vị ---</option>
                            {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                    {activeTab === "active" ? (
                        <select 
                            className="text-xs font-black bg-slate-100 text-slate-600 border-none rounded-xl px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer"
                            onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                            defaultValue={data.roles.find((r) => r.code === u.role)?.id}
                        >
                            {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    ) : (
                        <span className="text-xs font-black text-rose-500 uppercase italic bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">{u.role}</span>
                    )}
                </td>
                <td className="px-8 py-5">
                  {activeTab === "active" ? (
                    <button onClick={() => handleToggle(u.id)} className={`mx-auto flex flex-col items-center gap-1 transition-all active:scale-75 ${u.status ? 'text-emerald-500' : 'text-slate-200'}`}>
                        {u.status ? <FaCheckCircle size={26}/> : <FaUserSlash size={26}/>}
                        <span className="text-[8px] font-black uppercase tracking-widest">{u.status ? "Active" : "Locked"}</span>
                    </button>
                  ) : (
                    <div className="text-center flex flex-col items-center gap-1">
                        <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black italic border border-rose-200">CHỜ HỦY</div>
                        <p className="text-[10px] font-black text-slate-500">{u.deleted_at ? new Date(u.deleted_at).toLocaleDateString('vi-VN') : "N/A"}</p>
                    </div>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  {activeTab === "active" ? (
                    <button 
                      onClick={() => handleSoftDelete(u.id, u.full_name)} 
                      className="p-4 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 shadow-sm"
                      title="Chuyển vào thùng rác"
                    >
                        <FaTrashAlt size={18} />
                    </button>
                  ) : (
                    <div className="flex justify-end gap-3">
                         <button 
                          onClick={() => handleRestore(u.id)} 
                          title="Khôi phục hồ sơ" 
                          className="p-4 bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-md active:scale-90"
                        >
                            <FaUndo size={18} />
                        </button>
                        <button 
                          onClick={() => handlePermanentDelete(u.id, u.full_name)} 
                          title="XÓA VĨNH VIỄN" 
                          className="p-4 bg-rose-600 text-white hover:bg-rose-800 rounded-2xl transition-all shadow-lg shadow-rose-200 active:scale-90"
                        >
                            <FaTrashAlt size={18} />
                        </button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-24 text-center">
                  <div className="flex flex-col items-center opacity-10">
                    <FaSearch size={64} />
                    <p className="mt-6 font-black text-2xl uppercase tracking-[0.5em]">No Personnel Found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL SECTION (ADD USER) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Cấp hồ sơ cán bộ</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Personnel Registration Phase</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-rose-500 transition-colors">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Họ và tên đầy đủ</label>
                <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="VD: TRẦN HOÀNG LONG" onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tên định danh</label>
                  <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Username" onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mật khẩu</label>
                  <input required type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold" onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cấp bậc</label>
                  <select required className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-500" onChange={e => setForm({...form, role_id: e.target.value})}>
                    <option value="">LỰA CHỌN...</option>
                    {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Đơn vị</label>
                  <select required className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-500" onChange={e => setForm({...form, department_id: e.target.value})}>
                    <option value="">LỰA CHỌN...</option>
                    {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <button className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black tracking-[0.4em] hover:bg-indigo-600 shadow-2xl transition-all active:scale-[0.98] uppercase mt-4 text-sm">Kích hoạt tài khoản</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}