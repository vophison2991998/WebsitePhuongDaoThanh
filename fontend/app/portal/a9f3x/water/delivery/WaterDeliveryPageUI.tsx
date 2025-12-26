"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    FaTruckMoving, FaPlus, FaShoppingCart, FaSearch, 
    FaQrcode, FaPrint, FaTimes, FaTrashAlt, FaUndo, FaHistory,
    FaBuilding, FaUser, FaCheckCircle, FaClock, FaExclamationTriangle, FaSkull
} from 'react-icons/fa';
import { QRCodeSVG as QrCodeGenerator } from 'qrcode.react';
import { waterDeliveryApi } from './waterDeliveryApi';

// --- Interfaces ---
export interface DeliveryItem {
    id: string;
    recipient: string;
    dept: string;
    waterType: string;
    quantity: number;
    status: string;
    date: string;
    status_id: number;
}

export interface TrashItem {
    id: string; 
    recipient: string; 
    waterType: string;
    quantity: number; 
    deletedAt: string;
    daysLeft: number;
}

export default function WaterDeliveryPage() {
    // --- 1. States ---
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
    const [trashDeliveries, setTrashDeliveries] = useState<TrashItem[]>([]);
    const [waterTypes, setWaterTypes] = useState<{id: any, name: string}[]>([]);
    const [departments, setDepartments] = useState<{id: any, name: string}[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDanger: false
    });

    const [formData, setFormData] = useState({
        quantity: '',
        waterType: '',
        recipientName: '',
        department: '',
        deliveryTime: new Date().toISOString().slice(0, 16),
        content: ''
    });

    // --- 2. Helpers ---
    const showNotify = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- 3. Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [typesRes, deptsRes, deliveriesRes] = await waterDeliveryApi.getInitialData();
            const trashRes = await waterDeliveryApi.getTrashData();

            setWaterTypes(typesRes.data?.data ?? []);
            setDepartments(deptsRes.data?.data ?? []);
            
            const active = (deliveriesRes.data?.data ?? []).map((d: any) => ({
                id: String(d.delivery_id),
                recipient: d.recipient_name,
                dept: d.department_name,
                waterType: d.product_name,
                quantity: Number(d.quantity),
                status: (d.status_name || "XỬ LÝ").toUpperCase(),
                status_id: Number(d.status_id),
                date: d.delivery_time,
            }));

            const trash = (trashRes.data?.data ?? []).map((d: any) => ({
                id: String(d.delivery_id),
                recipient: d.recipient_name,
                waterType: d.product_name,
                quantity: Number(d.quantity),
                deletedAt: d.deleted_at,
                daysLeft: d.days_left
            }));
            
            setDeliveries(active);
            setTrashDeliveries(trash);
        } catch (error) {
            showNotify("Lỗi tải dữ liệu từ máy chủ!", 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- 4. Actions ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await waterDeliveryApi.createDelivery({ ...formData });
            showNotify("Tạo đơn xuất kho thành công!");
            setFormData(prev => ({ 
                ...prev, 
                recipientName: '', 
                quantity: '', 
                content: '',
                deliveryTime: new Date().toISOString().slice(0, 16)
            }));
            fetchData();
        } catch (error) {
            showNotify("Lỗi khi tạo đơn.", "error");
        } finally { setIsLoading(false); }
    };

    const handleUpdateStatus = (id: string, currentStatus: string) => {
        const isDone = currentStatus.includes('HOÀN THÀNH');
        const nextId = isDone ? 1 : 2;
        setConfirmDialog({
            isOpen: true,
            title: "CẬP NHẬT TRẠNG THÁI",
            message: `Chuyển đơn #${id} sang ${nextId === 1 ? 'XỬ LÝ' : 'HOÀN THÀNH'}?`,
            onConfirm: async () => {
                await waterDeliveryApi.updateStatus(id, nextId);
                showNotify("Cập nhật thành công");
                fetchData();
            },
            isDanger: false
        });
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "XÓA TẠM THỜI",
            message: `Chuyển đơn #${id} vào thùng rác? Dữ liệu sẽ tự động xóa sau 30 ngày.`,
            onConfirm: async () => {
                await waterDeliveryApi.deleteDelivery(id);
                showNotify("Đã chuyển vào thùng rác", "info");
                fetchData();
            },
            isDanger: true
        });
    };

    const handleRestore = async (id: string) => {
        try {
            await waterDeliveryApi.restoreDelivery(id);
            showNotify("Khôi phục đơn hàng thành công!");
            fetchData();
        } catch (error) { showNotify("Lỗi khôi phục", "error"); }
    };

    const handlePermanentDelete = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "XÓA VĨNH VIỄN",
            message: "Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa hoàn toàn khỏi máy chủ.",
            onConfirm: async () => {
                await waterDeliveryApi.permanentlyDelete(id);
                showNotify("Đã xóa vĩnh viễn đơn hàng", "error");
                fetchData();
            },
            isDanger: true
        });
    };

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(d => 
            d.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.includes(searchTerm)
        );
    }, [deliveries, searchTerm]);

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900 font-sans selection:bg-red-100">
            
            {/* CSS CHO VIỆC IN ẤN */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        background: white !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* --- NOTIFICATION --- */}
            {message && (
                <div className={`fixed top-5 right-5 z-[1000] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right bg-white border ${message.type === 'error' ? 'border-red-100 text-red-600' : 'border-emerald-100 text-emerald-600'}`}>
                    {message.type === 'error' ? <FaExclamationTriangle className="animate-bounce" /> : <FaCheckCircle className="animate-pulse" />}
                    <span className="font-black text-xs uppercase tracking-tight">{message.text}</span>
                </div>
            )}

            {/* --- CONFIRM DIALOG --- */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200 border-4 border-double border-slate-200">
                        <div className="p-8 text-center">
                            <div className={`w-16 h-16 ${confirmDialog.isDanger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <FaExclamationTriangle size={30} />
                            </div>
                            <h3 className="text-xl font-black mb-2 uppercase italic">{confirmDialog.title}</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">{confirmDialog.message}</p>
                        </div>
                        <div className="grid grid-cols-2 border-t-2 border-dotted font-black uppercase tracking-widest text-[10px]">
                            <button onClick={() => setConfirmDialog(p => ({...p, isOpen: false}))} className="p-5 hover:bg-slate-50 text-slate-400 transition-colors border-r-2 border-dotted">Hủy bỏ</button>
                            <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(p => ({...p, isOpen: false})); }} className={`p-5 transition-colors ${confirmDialog.isDanger ? 'hover:bg-red-600 hover:text-white text-red-600' : 'hover:bg-amber-500 hover:text-white text-amber-600'}`}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4 italic uppercase tracking-tighter">
                        <div className="bg-red-600 p-3 rounded-2xl text-white shadow-xl shadow-red-200 rotate-3 border-2 border-white"><FaTruckMoving size={32} /></div>
                        Water Flow <span className="text-red-600">Pro</span>
                    </h1>
                    <p className="text-slate-400 font-bold ml-2 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Hệ thống điều phối & Xuất kho thời gian thực
                    </p>
                </div>

                <button onClick={() => setIsTrashOpen(true)} className="group relative flex items-center gap-3 bg-white border-4 border-double border-slate-200 p-4 px-8 rounded-2xl shadow-sm hover:border-red-500 hover:bg-red-50 transition-all">
                    <FaTrashAlt className="text-slate-300 group-hover:text-red-500 transition-colors" />
                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Thùng rác</span>
                    {trashDeliveries.length > 0 && (
                        <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] w-7 h-7 flex items-center justify-center rounded-full font-black border-4 border-slate-50 animate-bounce">
                            {trashDeliveries.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- FORM SECTION --- */}
                <div className="lg:col-span-4">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-4 border-double border-slate-100 sticky top-8">
                        <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 border-b-2 border-dotted pb-6 uppercase italic">
                            <FaPlus className="text-red-600" /> Tạo đơn mới
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Người nhận</label>
                                <div className="relative">
                                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input type="text" name="recipientName" placeholder="Tên cán bộ..." value={formData.recipientName} onChange={handleInputChange} className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-red-500 focus:bg-white outline-none transition-all font-bold" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Loại nước</label>
                                    <select name="waterType" value={formData.waterType} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-red-500 outline-none font-bold appearance-none" required>
                                        <option value="">Chọn...</option>
                                        {waterTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Số lượng</label>
                                    <input type="number" name="quantity" placeholder="0" value={formData.quantity} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-red-500 outline-none font-black text-center text-xl" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bộ phận nhận</label>
                                <select name="department" value={formData.department} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-red-500 outline-none font-bold appearance-none" required>
                                    <option value="">Chọn phòng ban...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian xuất</label>
                                <input type="datetime-local" name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-red-500 outline-none font-bold text-slate-600" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 disabled:opacity-50 border-2 border-slate-800">
                                <FaShoppingCart /> {isLoading ? 'Đang kết nối...' : 'Xác nhận xuất kho'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- LIST SECTION --- */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-4 border-double border-slate-100 overflow-hidden">
                        <div className="p-8 border-b-2 border-dotted flex flex-col md:flex-row justify-between items-center gap-4">
                            <h2 className="font-black text-slate-800 text-2xl italic flex items-center gap-3 uppercase"><FaHistory className="text-blue-500"/> Nhật ký xuất</h2>
                            <div className="relative w-full md:w-72">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input type="text" placeholder="Tìm tên, mã đơn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-400" />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                                    <tr>
                                        <th className="p-6">Đơn hàng</th>
                                        <th className="p-6">Thông tin nhận</th>
                                        <th className="p-6 text-center">Số lượng</th>
                                        <th className="p-6">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-dotted divide-slate-100">
                                    {filteredDeliveries.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="p-6">
                                                <span className="font-black text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-full border-2 border-dotted border-blue-200">#{item.id}</span>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-2 uppercase"><FaClock /> {new Date(item.date).toLocaleDateString('vi-VN')}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="font-black text-slate-800 text-base">{item.recipient}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1 mt-1"><FaBuilding size={10}/> {item.dept}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="text-xl font-black text-slate-900 leading-none">{item.quantity}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider">{item.waterType}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleUpdateStatus(item.id, item.status)} className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 border-dotted transition-all flex items-center gap-2 ${item.status.includes('HOÀN THÀNH') ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white'}`}>
                                                        {item.status.includes('HOÀN THÀNH') ? <FaCheckCircle /> : <FaClock />} {item.status}
                                                    </button>
                                                    <button onClick={() => setSelectedOrder(item)} className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"><FaQrcode /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200"><FaTrashAlt /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredDeliveries.length === 0 && (
                                <div className="text-center py-20 text-slate-300 font-bold italic uppercase tracking-widest text-xs">Không có dữ liệu phù hợp</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TRASH MODAL --- */}
            {isTrashOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[900] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-300 border-4 border-double border-slate-200">
                        <div className="bg-slate-900 p-6 md:p-8 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black italic flex items-center gap-3 uppercase tracking-tighter">
                                    Thùng rác <FaTrashAlt className="text-red-500 animate-pulse" />
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                                    Tự động dọn dẹp sau 30 ngày lưu trữ
                                </p>
                            </div>
                            <button onClick={() => setIsTrashOpen(false)} className="relative z-10 bg-white/10 p-3 rounded-full hover:bg-red-600 hover:rotate-90 transition-all duration-300 text-white">
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto bg-slate-50/50 space-y-4">
                            {trashDeliveries.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[2rem] border-4 border-dotted border-slate-200">
                                    <p className="text-slate-400 font-black italic uppercase tracking-widest text-sm">Thùng rác đang trống</p>
                                </div>
                            ) : (
                                trashDeliveries.map(item => {
                                    const percentLeft = (item.daysLeft / 30) * 100;
                                    const statusColor = item.daysLeft > 15 ? 'bg-emerald-500' : item.daysLeft > 5 ? 'bg-amber-500' : 'bg-red-500';

                                    return (
                                        <div key={item.id} className="group relative bg-white rounded-3xl p-5 border-2 border-dotted border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:bg-red-600 transition-colors border-2 border-white">
                                                        <FaUndo size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase border border-slate-200">#{item.id}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 italic">Xóa: {new Date(item.deletedAt).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <h4 className="font-black text-slate-800 text-lg leading-none mb-1 group-hover:text-red-600 transition-colors">{item.recipient}</h4>
                                                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                            {item.quantity} {item.waterType}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end md:self-center">
                                                    <button onClick={() => handleRestore(item.id)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase border-2 border-dotted border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all">
                                                        <FaUndo /> Khôi phục
                                                    </button>
                                                    <button onClick={() => handlePermanentDelete(item.id)} className="p-3 bg-red-50 text-red-500 rounded-xl border-2 border-dotted border-red-200 hover:bg-red-600 hover:text-white transition-all">
                                                        <FaSkull size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-6 bg-white border-t-2 border-dotted border-slate-100 flex justify-end">
                            <button onClick={() => setIsTrashOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-600 transition-all shadow-xl">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- QR PREVIEW & PRINT MODAL --- */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-[3rem] text-center max-w-sm w-full shadow-2xl relative animate-in zoom-in border-4 border-double border-slate-200">
                        
                        {/* Khu vực sẽ được in */}
                        <div id="printable-area">
                            <button onClick={() => setSelectedOrder(null)} className="no-print absolute top-8 right-8 text-slate-300 hover:text-slate-800 transition-colors"><FaTimes size={24}/></button>
                            <h3 className="text-2xl font-black text-slate-800 italic uppercase mb-2">Phiếu xuất kho</h3>
                            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-8">Xác thực E-Ticket</p>
                            
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-4 border-dotted border-slate-300 inline-block mb-8">
                                <QrCodeGenerator value={`WATER-${selectedOrder.id}`} size={180} />
                            </div>

                            <div className="text-left bg-slate-50 rounded-2xl p-6 mb-8 font-bold text-sm space-y-3 border-2 border-dotted border-slate-200">
                                <div className="flex justify-between border-b border-dotted border-slate-300 pb-2 italic"><span className="text-slate-400 text-[10px] uppercase tracking-widest">Mã đơn</span><span className="text-blue-600">#{selectedOrder.id}</span></div>
                                <div className="flex justify-between border-b border-dotted border-slate-300 pb-2 italic"><span className="text-slate-400 text-[10px] uppercase tracking-widest">Người nhận</span><span>{selectedOrder.recipient}</span></div>
                                <div className="flex justify-between border-b border-dotted border-slate-300 pb-2 italic"><span className="text-slate-400 text-[10px] uppercase tracking-widest">Bộ phận</span><span>{selectedOrder.dept}</span></div>
                                <div className="flex justify-between italic"><span className="text-slate-400 text-[10px] uppercase tracking-widest">Chi tiết</span><span>{selectedOrder.quantity} {selectedOrder.waterType}</span></div>
                            </div>
                            
                            <p className="hidden print:block text-[8px] text-slate-400 mt-4 uppercase font-bold italic">Ngày in: {new Date().toLocaleString('vi-VN')}</p>
                        </div>

                        <button onClick={() => window.print()} className="no-print w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all uppercase tracking-widest shadow-xl border-2 border-slate-800">
                            <FaPrint /> In phiếu điện tử
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}