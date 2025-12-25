"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    FaTruckMoving, FaPlus, FaShoppingCart, FaSearch, 
    FaQrcode, FaPrint, FaTimes, FaTrashAlt, FaUndo, FaHistory 
} from 'react-icons/fa';
import { QRCodeSVG as QrCodeGenerator } from 'qrcode.react';
import { waterDeliveryApi } from './waterDeliveryApi';

// --- Định nghĩa Kiểu dữ liệu (Interfaces) ---
export interface DeliveryItem {
    id: string; 
    recipient: string; 
    dept: string;
    waterType: string; 
    quantity: number; 
    status: string; 
    date: string;
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
    // --- 1. Quản lý State ---
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
    const [trashDeliveries, setTrashDeliveries] = useState<TrashItem[]>([]);
    const [waterTypes, setWaterTypes] = useState<{id: any, name: string}[]>([]);
    const [departments, setDepartments] = useState<{id: any, name: string}[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);

    const initialFormState = {
        quantity: '',
        waterType: '',
        recipientName: '',
        department: '',
        deliveryTime: new Date().toISOString().slice(0, 16),
        content: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // --- 2. Logic Lấy dữ liệu (Fetch Data) ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [typesRes, deptsRes, deliveriesRes] = await waterDeliveryApi.getInitialData();
            setWaterTypes(typesRes.data?.data ?? []);
            setDepartments(deptsRes.data?.data ?? []);
            
            const rawData = deliveriesRes.data?.data ?? [];
            
            // Lọc đơn bình thường (status_id !== 0)
            const active = rawData.filter((d: any) => d.status_id !== 0 && d.status_id !== null).map((d: any) => ({
                id: d.delivery_id ?? "N/A",
                recipient: d.recipient_name ?? "Chưa có tên",
                dept: d.department_name ?? `Bộ phận ${d.dept_id ?? ""}`,
                waterType: d.product_name ?? `Sản phẩm ${d.product_id ?? ""}`,
                quantity: Number(d.quantity ?? 0),
                status: (d.status ?? "XỬ LÝ").toUpperCase(),
                date: d.delivery_time ?? "",
            }));

            // Lọc đơn trong thùng rác (status_id === 0)
            const trash = rawData.filter((d: any) => String(d.status_id) === "0").map((d: any) => ({
                id: d.delivery_id ?? "N/A",
                recipient: d.recipient_name ?? "N/A",
                waterType: d.product_name ?? "Nước",
                quantity: Number(d.quantity ?? 0),
                deletedAt: d.updated_at ? new Date(d.updated_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                daysLeft: 30
            }));
            
            setDeliveries(active);
            setTrashDeliveries(trash);
        } catch (error) {
            setMessage({ text: "Lỗi đồng bộ dữ liệu với máy chủ.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- 3. Xử lý Sự kiện (Handlers) ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value ?? "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await waterDeliveryApi.createDelivery({ ...formData, delivery_id: "" });
            setMessage({ text: "Tạo đơn thành công!", type: 'success' });
            setFormData(initialFormState);
            fetchData();
        } catch (error) {
            setMessage({ text: "Lỗi hệ thống khi tạo đơn.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus.includes('HOÀN THÀNH') ? 1 : 2;
        try {
            await waterDeliveryApi.updateStatus(id, nextStatus);
            fetchData();
        } catch (error) {
            setMessage({ text: "Không thể cập nhật trạng thái.", type: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Chuyển đơn hàng này vào thùng rác?")) return;
        try {
            await waterDeliveryApi.deleteDelivery(id);
            fetchData();
            setMessage({ text: "Đã chuyển vào thùng rác.", type: 'success' });
        } catch (error) {
            setMessage({ text: "Lỗi khi xóa.", type: 'error' });
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await waterDeliveryApi.updateStatus(id, 1);
            fetchData();
            setMessage({ text: "Khôi phục thành công!", type: 'success' });
        } catch (error) {
            setMessage({ text: "Lỗi khi khôi phục.", type: 'error' });
        }
    };

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(d => 
            d.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
            d.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [deliveries, searchTerm]);

    const getStatusColor = (status: string) => {
        if (status.includes('HOÀN THÀNH')) return "bg-green-100 text-green-700 border-green-200";
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-900">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <FaTruckMoving className="text-red-600" /> Quản lý Xuất Kho Nước
                </h1>
                <button 
                    onClick={() => setIsTrashOpen(true)} 
                    className="relative flex items-center gap-2 bg-white border p-2 px-4 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                >
                    <FaTrashAlt className="text-gray-400" />
                    <span className="text-sm font-medium">Thùng rác</span>
                    {trashDeliveries.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                            {trashDeliveries.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Form Section */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 border-red-500">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                    <FaPlus className="text-red-500" /> Tạo Đơn Hàng Mới
                </h2>
                {message && (
                    <div className={`p-3 mb-4 rounded-md border text-sm flex justify-between items-center animate-in fade-in slide-in-from-top-1 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)}><FaTimes /></button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="recipientName" placeholder="Người nhận *" value={formData.recipientName} onChange={handleChange} className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-red-200" required />
                    <select name="waterType" value={formData.waterType} onChange={handleChange} className="border p-2 rounded-md outline-none" required>
                        <option value="">Chọn loại nước *</option>
                        {waterTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input type="number" name="quantity" placeholder="Số lượng *" value={formData.quantity} onChange={handleChange} className="border p-2 rounded-md outline-none" required />
                    <select name="department" value={formData.department} onChange={handleChange} className="border p-2 rounded-md outline-none" required>
                        <option value="">Chọn phòng ban *</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input type="datetime-local" name="deliveryTime" value={formData.deliveryTime} onChange={handleChange} className="border p-2 rounded-md outline-none text-gray-600" />
                    <button type="submit" disabled={isLoading} className="bg-red-600 text-white font-bold rounded-md hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        <FaShoppingCart /> {isLoading ? 'Đang lưu...' : 'Xác Nhận Xuất Kho'}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center bg-gray-50 gap-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2"><FaHistory className="text-gray-400"/> Lịch Sử Giao Nhận</h2>
                    <div className="relative w-full md:w-64">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm mã, tên..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-9 pr-3 py-2 border rounded-full text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all" 
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 text-[11px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Mã Đơn</th>
                                <th className="p-4">Người Nhận / Bộ phận</th>
                                <th className="p-4 text-center">SL</th>
                                <th className="p-4">Trạng Thái</th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDeliveries.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-4 font-bold text-indigo-600 text-sm">{item.id}</td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-gray-800">{item.recipient}</div>
                                        <div className="text-xs text-gray-500">{item.dept}</div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-gray-700">{item.quantity}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleUpdateStatus(item.id, item.status)} 
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm transition-all hover:brightness-95 ${getStatusColor(item.status)}`}
                                        >
                                            {item.status}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setSelectedOrder(item)} title="Xem QR" className="p-2 text-indigo-600 border rounded-full hover:bg-indigo-600 hover:text-white transition-all"><FaQrcode /></button>
                                            <button onClick={() => handleDelete(item.id)} title="Xóa" className="p-2 text-red-600 border rounded-full hover:bg-red-600 hover:text-white transition-all"><FaTrashAlt /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Trash Modal */}
            {isTrashOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><FaHistory /> Thùng rác tạm thời</h3>
                            <button onClick={() => setIsTrashOpen(false)}><FaTimes size={20} /></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {trashDeliveries.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 italic">Thùng rác trống</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <tbody className="divide-y divide-gray-100">
                                        {trashDeliveries.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="py-3">
                                                    <div className="font-bold text-gray-700">{item.id}</div>
                                                    <div className="text-xs text-gray-500">{item.recipient} • {item.quantity} thùng</div>
                                                </td>
                                                <td className="py-3">
                                                    <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded text-[11px]">{item.daysLeft} ngày nữa</span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button onClick={() => handleRestore(item.id)} className="text-green-600 border border-green-200 px-3 py-1 rounded-md hover:bg-green-600 hover:text-white transition-all inline-flex items-center gap-1 text-xs font-bold shadow-sm"><FaUndo size={10}/> Khôi phục</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setIsTrashOpen(false)} className="px-4 py-1.5 bg-gray-200 rounded text-sm font-bold hover:bg-gray-300">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR/Print Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl text-center max-w-xs w-full shadow-2xl relative animate-in zoom-in duration-150">
                        <button onClick={() => setSelectedOrder(null)} className="absolute top-3 right-3 text-gray-400"><FaTimes size={18} /></button>
                        <h3 className="font-bold mb-4 border-b pb-2 text-gray-700">Mã QR Đơn hàng</h3>
                        <div className="bg-white p-3 border-2 border-dashed border-gray-100 inline-block mb-4 rounded-xl">
                            <QrCodeGenerator value={selectedOrder.id} size={180} />
                        </div>
                        <div className="mb-6">
                            <p className="text-sm font-black text-indigo-600">{selectedOrder.id}</p>
                            <p className="text-xs text-gray-500 mt-1">{selectedOrder.recipient}</p>
                        </div>
                        <button onClick={() => window.print()} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                            <FaPrint /> In Phiếu Xuất Kho
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}