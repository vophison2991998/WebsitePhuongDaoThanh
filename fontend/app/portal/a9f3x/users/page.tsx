"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FaUserPlus, FaSearch, FaBuilding, FaCheckCircle, FaUserSlash, FaTrashAlt } from "react-icons/fa";
import Toast, { ToastType } from "@/components/ui/Toast"; 

interface User { id: number; username: string; full_name: string; role: string; role_id: number; department_id: number; dept: string; status: boolean; }
interface Role { id: number; code: string; name: string; }
interface Department { id: number; name: string; }
interface DataState { users: User[]; roles: Role[]; departments: Department[]; }

export default function CompleteUserPage() {
  const [data, setData] = useState<DataState>({ users: [], roles: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [search, setSearch] = useState("");
  const [selRole, setSelRole] = useState("");
  const [selDept, setSelDept] = useState("");
  const [form, setForm] = useState({ username: "", password: "", full_name: "", role_id: "", department_id: "" });

  const showToast = (message: string, type: ToastType = "success") => setToast({ message, type });

  const loadData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setData(res.data);
      setLoading(false);
    } catch {
      showToast("Không thể kết nối đến máy chủ", "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/users", form);
      showToast("Đã tạo tài khoản mới thành công!");
      setIsModalOpen(false);
      loadData();
    } catch { 
      showToast("Lỗi khi tạo tài khoản. Vui lòng thử lại", "error"); 
    }
  };

  const handleToggle = async (userId: number) => {
    try {
      await axios.patch(`http://localhost:5000/api/users/${userId}/status`, {}, { withCredentials: true });
      showToast("Cập nhật trạng thái thành công");
      loadData();
    } catch { 
      showToast("Lỗi cập nhật trạng thái", "error"); 
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của [${name}]?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        showToast(`Đã xóa tài khoản ${name}`, "warning");
        loadData(); 
      } catch {
        showToast("Lỗi khi xóa tài khoản", "error");
      }
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await axios.patch(`http://localhost:5000/api/users/${userId}/role`, { role_id: roleId });
      showToast("Đã thay đổi vai trò người dùng");
      loadData();
    } catch {
      showToast("Không thể thay đổi vai trò", "error");
    }
  };

  const filteredUsers = data.users.filter((u: User) => {
    const matchText = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = selRole === "" || u.role === selRole;
    const matchDept = selDept === "" || u.dept === selDept;
    return matchText && matchRole && matchDept;
  });

  if (loading) return <div className="p-20 text-center text-indigo-600 animate-bounce font-bold tracking-widest text-2xl">HỆ THỐNG ĐANG TẢI...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen relative text-base">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] animate-bounce-in">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">HỆ THỐNG QUẢN TRỊ</h1>
          <p className="text-lg text-slate-500 italic">Quản lý nhân sự & Phân quyền</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <FaUserPlus /> TẠO TÀI KHOẢN
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center text-base">
        <div className="relative flex-1 min-w-[300px]">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" placeholder="Tìm kiếm tên hoặc username..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition shadow-inner text-base"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select onChange={(e) => setSelRole(e.target.value)} className="px-4 py-3 bg-slate-50 border-none rounded-xl text-base font-semibold text-slate-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          <option value="">Tất cả Vai trò</option>
          {data.roles.map((r) => <option key={r.id} value={r.code}>{r.name}</option>)}
        </select>
        <select onChange={(e) => setSelDept(e.target.value)} className="px-4 py-3 bg-slate-50 border-none rounded-xl text-base font-semibold text-slate-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          <option value="">Tất cả Phòng ban</option>
          {data.departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-base">
          <thead className="bg-slate-800 text-slate-200 text-sm uppercase tracking-wider">
            <tr>
              <th className="px-6 py-5">Thành viên</th>
              <th className="px-6 py-5">Phòng ban</th>
              <th className="px-6 py-5 text-center">Vai trò & Cấp bậc</th>
              <th className="px-6 py-5 text-center">Trạng thái</th>
              <th className="px-6 py-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-base">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-indigo-50/40 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold text-lg text-slate-700 group-hover:text-indigo-600 transition-colors">{u.full_name}</p>
                  <p className="text-sm text-slate-400 font-mono tracking-wider uppercase">ID: {u.id} • @{u.username}</p>
                </td>
                <td className="px-6 py-4 text-slate-600 text-base">
                  <span className="flex items-center gap-2 font-medium"><FaBuilding className="text-slate-300"/> {u.dept || "Chưa xếp"}</span>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-black border shadow-sm ${u.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                            {u.role}
                        </span>
                        <select 
                            className="text-sm bg-transparent border-none text-slate-500 focus:ring-0 cursor-pointer hover:text-indigo-500"
                            onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                            defaultValue={data.roles.find((r) => r.code === u.role)?.id}
                        >
                            {data.roles.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                 <button 
                        onClick={() => handleToggle(u.id)}
                        className={`mx-auto flex flex-col items-center gap-1 transition-all active:scale-90 ${u.status ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        {u.status ? <FaCheckCircle size={26}/> : <FaUserSlash size={26}/>}
                        <span className="text-sm font-black uppercase tracking-widest">{u.status ? "Active" : "Locked"}</span>
                      </button>
                </td>
                <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleDelete(u.id, u.full_name)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                        title="Xóa tài khoản"
                    >
                        <FaTrashAlt size={20} />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TẠO TÀI KHOẢN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight uppercase">Đăng ký thành viên mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform p-2 text-3xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-5 bg-white text-base">
               <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Họ và tên đầy đủ</label>
                <input required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-base" placeholder="Vd: Nguyễn Văn A" onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Tên đăng nhập</label>
                  <input required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-base" onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Mật khẩu hệ thống</label>
                  <input required type="password" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-base" onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Vai trò</label>
                    <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-base" onChange={e => setForm({...form, role_id: e.target.value})}>
                        <option value="">Lựa chọn...</option>
                        {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Phòng ban</label>
                    <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-base" onChange={e => setForm({...form, department_id: e.target.value})}>
                        <option value="">Lựa chọn...</option>
                        {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
              </div>
              <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-base tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] uppercase">Kích hoạt tài khoản</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
