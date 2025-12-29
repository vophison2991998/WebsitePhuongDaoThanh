"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    FaShieldAlt, FaCrown, FaUser, FaTrashAlt, 
    FaArrowLeft, FaEnvelope, FaFingerprint, FaSpinner, FaCircle
} from "react-icons/fa";
import { useDepartmentsLogic } from "../departmentsLogic";

// --- Sub-Component: Account Card (Đã tối ưu UI) ---
const AccountCard = ({ member, type, onRemove }: { member: any, type: 'admin' | 'manager' | 'user', onRemove: (id: number) => void }) => {
    const config = {
        admin: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", icon: <FaShieldAlt />, label: "Hệ thống Admin" },
        manager: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: <FaCrown />, label: "Quản lý Đơn vị" },
        user: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: <FaUser />, label: "Nhân sự" }
    }[type];

    return (
        <div className={`relative group p-6 rounded-[40px] border bg-white ${config.border} hover:shadow-2xl hover:-translate-y-2 transition-all duration-500`}>
            {/* Role Badge */}
            <div className={`absolute top-6 right-6 flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-[0.15em] ${config.bg} ${config.color} shadow-sm border border-white`}>
                {config.icon} {config.label}
            </div>

            <div className="flex flex-col items-center mt-6">
                {/* Avatar Squircle Design */}
                <div className={`w-24 h-24 rounded-[35px] flex items-center justify-center text-4xl font-black mb-6 ${config.bg} ${config.color} shadow-inner transform group-hover:rotate-6 transition-transform`}>
                    {member.full_name?.charAt(0).toUpperCase() || "A"}
                </div>

                <h3 className="text-slate-900 font-black uppercase tracking-tighter text-xl text-center line-clamp-1 italic italic">
                    {member.full_name}
                </h3>
                
                <div className="flex items-center gap-2 mt-2 text-slate-400">
                    <FaFingerprint size={10} className="opacity-50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Employee ID: {member.id}</span>
                </div>

                {/* Info Section */}
                <div className="mt-8 w-full space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[22px] text-[11px] text-slate-500 font-bold border border-slate-100/50">
                        <FaEnvelope className="shrink-0 text-slate-300" />
                        <span className="truncate italic">{member.email || "chưa cập nhật email"}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 w-full">
                    <button className="flex-1 py-4 rounded-[22px] bg-slate-900 text-white text-[10px] font-black hover:bg-indigo-600 transition-all uppercase tracking-[0.2em] shadow-lg shadow-slate-200">
                        Hồ sơ
                    </button>
                    <button 
                        onClick={() => onRemove(member.id)}
                        className="p-4 rounded-[22px] bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm"
                    >
                        <FaTrashAlt size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function DepartmentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { departments, actions, loading: logicLoading } = useDepartmentsLogic();
    
    const [members, setMembers] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);

    const currentDept = useMemo(() => departments.find(d => d.id === Number(id)), [departments, id]);

    // LOGIC PHÂN LOẠI 3 TẦNG TÀI KHOẢN
    const groups = useMemo(() => {
        return {
            admins: members.filter(m => m.role_name?.toUpperCase().includes("ADMIN")),
            managers: members.filter(m => m.role_name?.toUpperCase().includes("MANAGER")),
            users: members.filter(m => 
                !m.role_name?.toUpperCase().includes("ADMIN") && 
                !m.role_name?.toUpperCase().includes("MANAGER")
            )
        };
    }, [members]);

    const loadData = async () => {
        if (!id) return;
        setFetching(true);
        const res = await actions.getUsers(id as string);
        if (res.success) setMembers(res.data);
        setFetching(false);
    };

    useEffect(() => { loadData(); }, [id]);

    const handleRemove = async (userId: number) => {
        if (confirm("Gỡ nhân sự này khỏi đơn vị và vô hiệu hóa tài khoản?")) {
            const res = await actions.removeUser(userId);
            if (res.success) loadData();
        }
    };

    if (logicLoading || fetching) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
            <div className="relative">
                <FaSpinner className="animate-spin text-5xl text-indigo-600" />
                <FaCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-indigo-200 animate-pulse" />
            </div>
            <p className="font-black text-[10px] uppercase tracking-[0.5em] text-slate-400">Đang truy xuất không gian...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-20 bg-[#F8FAFC] min-h-screen">
            
            {/* Header Navigation */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => router.push("/portal/a9f3x/departments")}
                        className="w-16 h-16 bg-white rounded-[25px] shadow-xl shadow-slate-200/50 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group border border-slate-50"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-1 w-8 bg-indigo-600 rounded-full"></span>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Cấu trúc đơn vị A9-FX</p>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic italic">
                            {currentDept?.name || `ĐƠN VỊ #${id}`}
                        </h1>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="px-8 py-5 bg-white rounded-[30px] border border-slate-100 shadow-sm text-center min-w-[160px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quy mô nhân sự</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{members.length}</p>
                    </div>
                </div>
            </header>

            {/* --- KHU VỰC 1: ADMINS --- */}
            {groups.admins.length > 0 && (
                <section className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="w-14 h-14 bg-rose-600 rounded-3xl text-white flex items-center justify-center shadow-xl shadow-rose-200">
                            <FaShieldAlt size={22} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Ban Quản Trị Hệ Thống</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Quyền hạn tối cao và cấu hình lõi đơn vị</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {groups.admins.map(m => <AccountCard key={m.id} member={m} type="admin" onRemove={handleRemove} />)}
                    </div>
                </section>
            )}

            {/* --- KHU VỰC 2: MANAGERS --- */}
            <section className="animate-in slide-in-from-bottom-6 duration-700">
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 bg-amber-500 rounded-3xl text-white flex items-center justify-center shadow-xl shadow-amber-200">
                        <FaCrown size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Bộ Phận Điều Hành</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Chịu trách nhiệm vận hành và quản lý trực tiếp</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {groups.managers.map(m => <AccountCard key={m.id} member={m} type="manager" onRemove={handleRemove} />)}
                    {groups.managers.length === 0 && (
                        <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-[50px] flex flex-col items-center justify-center text-slate-300 gap-4">
                            <FaCrown size={30} className="opacity-20" />
                            <p className="font-black italic uppercase tracking-[0.2em] text-[11px]">Vị trí Quản lý đang trống</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- KHU VỰC 3: USERS --- */}
            <section className="animate-in slide-in-from-bottom-8 duration-1000 pb-20">
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 bg-blue-600 rounded-3xl text-white flex items-center justify-center shadow-xl shadow-blue-200">
                        <FaUser size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Nhân Viên Vận Hành</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Lực lượng nòng cốt thực thi nhiệm vụ chuyên môn</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {groups.users.map(m => <AccountCard key={m.id} member={m} type="user" onRemove={handleRemove} />)}
                    {groups.users.length === 0 && (
                        <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-[50px] flex flex-col items-center justify-center text-slate-300 gap-4">
                            <FaUser size={30} className="opacity-20" />
                            <p className="font-black italic uppercase tracking-[0.2em] text-[11px]">Chưa có nhân sự trực thuộc</p>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}