"use client";

import React, { useState } from 'react';
import {
    FaTruckLoading, 
    FaCalendarAlt, 
    FaWarehouse, 
    FaSearch, 
    FaUserTie, 
    FaQrcode, 
    FaSpinner, 
    FaBoxes, 
    FaTint,
    FaTrash,
    FaCheck,
    FaHistory,
    FaUndo,
    FaExclamationTriangle
} from 'react-icons/fa';
import { useToast } from "@/components/ui/ToastContext"; 
import { TrashItem } from './waterReceiptApi';

// --- INTERFACES ---
interface WaterReceiptData {
    id: number;
    lot_code: string;
    supplier: string;
    waterType: string;
    quantity: number;
    receiptDate: string; 
    deliveryPerson: string;
    status: string;
    status_code: string;
}

interface WaterType { id: number; name: string; product_id?: number; }
interface FormData { waterType: string | number; quantity: number | ''; receiptDate: string; supplier: string; deliveryPerson: string; }
interface QrModalState { isOpen: boolean; lotCode: string; qrCodeImage: string | null; isLoading: boolean; }

interface WaterReceiptUIProps {
    formData: FormData;
    receipts: WaterReceiptData[];
    trashItems: TrashItem[]; // Bổ sung
    isTrashOpen: boolean;    // Bổ sung
    setIsTrashOpen: (open: boolean) => void; // Bổ sung
    waterTypes: WaterType[];
    searchTerm: string;
    isLoading: boolean;
    isTypesLoading: boolean;
    qrModal: QrModalState;
    setSearchTerm: (term: string) => void;
    setQrModal: (state: QrModalState) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleActionChange: (action: string, item: WaterReceiptData) => void;
    handleRestore: (id: number) => void; // Bổ sung
    fetchReceipts: (term?: string) => void;
    getStatusStyles: (status_code: string) => string;
}

const WaterReceiptPageUI: React.FC<WaterReceiptUIProps> = ({
    formData, receipts, trashItems, isTrashOpen, setIsTrashOpen, waterTypes, 
    searchTerm, isLoading, isTypesLoading, qrModal, setSearchTerm, setQrModal, 
    handleChange, handleSubmit, handleActionChange, handleRestore, 
    fetchReceipts, getStatusStyles
}) => {

    const { warning } = useToast();

    const handlePrintQrCode = () => {
        if (qrModal.qrCodeImage) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>In QR Code - ${qrModal.lotCode}</title>
                            <style>
                                @media print { @page { margin: 5mm; } body { font-family: sans-serif; text-align: center; } }
                                body { text-align: center; padding: 20px; }
                                .container { border: 2px solid #000; padding: 20px; display: inline-block; border-radius: 10px; }
                                img { width: 300px; height: 300px; }
                                h1 { font-size: 24px; margin-top: 10px; margin-bottom: 5px; }
                                p { font-size: 14px; color: #666; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>LÔ HÀNG: ${qrModal.lotCode}</h1>
                                <img src="${qrModal.qrCodeImage}" alt="QR Code" />
                                <p>Ngày in: ${new Date().toLocaleString()}</p>
                            </div>
                            <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } else {
            warning("Không có mã QR để in.");
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* TIÊU ĐỀ CHÍNH */}
            <div className="flex justify-between items-center mb-6 border-b-2 pb-2">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FaTruckLoading className="mr-3 text-green-600" />
                    Quản Lý Nhập Kho (V10.3)
                </h1>
                
                {/* NÚT MỞ THÙNG RÁC */}
                <button 
                    onClick={() => setIsTrashOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all font-semibold"
                >
                    <FaHistory /> Thùng rác ({trashItems.length})
                </button>
            </div>

            {/* PHẦN 1: FORM TẠO LÔ HÀNG MỚI */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-green-700 flex items-center">
                    <FaBoxes className="mr-2" /> Ghi Nhận Lô Hàng Mới
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 flex items-center">
                                <FaTint className="mr-1 text-blue-500" /> Loại Nước
                            </label>
                            <select
                                name="waterType"
                                value={formData.waterType}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                disabled={isTypesLoading}
                            >
                                <option value="" disabled>{isTypesLoading ? 'Đang tải...' : '-- Chọn loại nước --'}</option>
                                {waterTypes.map((type) => (
                                    <option key={type.product_id || type.id} value={type.product_id || type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Số lượng</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="50"
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 flex items-center">
                                <FaCalendarAlt className="mr-1 text-gray-400"/> Ngày Nhận
                            </label>
                            <input 
                                type="date" 
                                name="receiptDate" 
                                value={formData.receiptDate} 
                                onChange={handleChange} 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Nhà Cung Cấp</label>
                            <input 
                                type="text" 
                                name="supplier" 
                                value={formData.supplier} 
                                onChange={handleChange} 
                                placeholder="VD: Lavie Việt Nam" 
                                required 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 flex items-center">
                                <FaUserTie className="mr-1 text-gray-500" /> Người Giao
                            </label>
                            <input 
                                type="text" 
                                name="deliveryPerson" 
                                value={formData.deliveryPerson} 
                                onChange={handleChange} 
                                placeholder="Tên người giao" 
                                required 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all flex items-center shadow-lg disabled:bg-gray-400"
                        >
                            {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaWarehouse className="mr-2" />} 
                            Xác Nhận Nhập Kho
                        </button>
                    </div>
                </form>
            </div>

            {/* PHẦN 2: BẢNG LỊCH SỬ NHẬP HÀNG */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Lịch Sử Nhập Hàng</h2>
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhanh..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                fetchReceipts(e.target.value);
                            }}
                            className="w-full border border-gray-300 rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-left text-xs font-bold text-gray-500 uppercase">
                                <th className="px-6 py-4">Mã Lô</th>
                                <th className="px-6 py-4">Nhà Cung Cấp</th>
                                <th className="px-6 py-4">Sản Phẩm</th>
                                <th className="px-6 py-4 text-center">Số Lượng</th>
                                <th className="px-6 py-4">Ngày Nhận</th>
                                <th className="px-6 py-4">Trạng Thái</th>
                                <th className="px-6 py-4 text-center">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {receipts.length > 0 ? receipts.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 font-mono italic">{item.lot_code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <div className="font-semibold">{item.supplier}</div>
                                        <div className="text-xs text-gray-400 flex items-center"><FaUserTie className="mr-1"/>{item.deliveryPerson}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.waterType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold">{item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.receiptDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusStyles(item.status_code)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => handleActionChange('qr', item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><FaQrcode size={18} /></button>
                                            {item.status_code === 'PROCESSING' && (
                                                <button onClick={() => handleActionChange('confirm', item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><FaCheck size={18} /></button>
                                            )}
                                            <button onClick={() => handleActionChange('cancel', item)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FaTrash size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Không tìm thấy dữ liệu.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL THÙNG RÁC (RECYCLE BIN) --- */}
            {isTrashOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FaTrash className="text-red-500" /> Thùng rác (Lưu trữ 30 ngày)
                            </h3>
                            <button onClick={() => setIsTrashOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 flex-1">
                            {trashItems.length > 0 ? (
                                <table className="min-w-full">
                                    <thead className="text-xs text-gray-500 uppercase border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Mã Lô</th>
                                            <th className="px-4 py-3 text-center">Số lượng</th>
                                            <th className="px-4 py-3 text-left">Ngày xóa</th>
                                            <th className="px-4 py-3 text-left">Hết hạn sau</th>
                                            <th className="px-4 py-3 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {trashItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 font-mono font-bold text-blue-600">{item.lot_code}</td>
                                                <td className="px-4 py-4 text-center font-bold">{item.quantity}</td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    {new Date(item.deleted_at).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center w-fit gap-1">
                                                        <FaExclamationTriangle size={10} />
                                                        {new Date(item.expires_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleRestore(item.id)}
                                                        className="flex items-center gap-1 mx-auto px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-bold text-sm"
                                                    >
                                                        <FaUndo /> Khôi phục
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12 text-gray-400 italic">Thùng rác trống.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL QR CODE (GIỮ NGUYÊN) */}
            {qrModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center relative transform transition-all animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">QR CODE NHẬP KHO</h3>
                        <p className="text-indigo-600 font-mono font-bold mb-6 tracking-wider">{qrModal.lotCode}</p>
                        <div className="flex justify-center items-center aspect-square border-2 border-dashed border-gray-100 rounded-2xl mb-6 bg-gray-50/50 p-4">
                            {qrModal.isLoading ? <FaSpinner className="animate-spin text-indigo-600 text-3xl" /> : (
                                <img src={qrModal.qrCodeImage || ''} alt="QR Code" className="w-full h-full object-contain" />
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handlePrintQrCode} disabled={!qrModal.qrCodeImage} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg disabled:bg-gray-300">In Tem Mã</button>
                            <button onClick={() => setQrModal({ ...qrModal, isOpen: false })} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterReceiptPageUI;