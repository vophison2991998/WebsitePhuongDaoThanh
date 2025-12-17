"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Import icons từ react-icons/fa
import { 
    FaTruckLoading, 
    FaCalendarAlt, 
    FaWarehouse, 
    FaSearch, 
    FaUserTie, 
    FaQrcode, 
    FaSpinner,
    FaBoxes,
    FaTint // Icon mới cho loại nước
} from 'react-icons/fa';

// SỬ DỤNG HOOK ĐÃ CUNG CẤP TỪ CONTEXT (Giả định path: @/components/ui/ToastContext)
// Bạn cần đảm bảo đã tạo file ToastContext.tsx và Toast.tsx
import { useToast } from "@/components/ui/ToastContext"; 

// --- ĐỊNH NGHĨA DỮ LIỆU VÀ INTERFACE ---

// Định nghĩa các loại nước/sản phẩm có thể nhận vào kho
const WATER_TYPES = [
    { value: 'Binh 20L', label: 'Nước Tinh Khiết Bình 20L' },
    { value: 'Chai 500ml', label: 'Nước Khoáng Chai 500ml' },
    { value: 'Chai 1.5L', label: 'Nước Khoáng Chai 1.5L' },
    { value: 'Chai 330ml', label: 'Nước Lọc Chai 330ml' }, 
];

// Định nghĩa kiểu dữ liệu cho lô hàng nhận
interface ReceiptLot {
    id: number;
    lot_code: string;
    supplier: string;
    deliveryPerson: string;
    quantity: number;
    receiptDate: string; // Định dạng YYYY-MM-DD
    status: 'CHỜ XÁC NHẬN' | 'ĐÃ NHẬP' | 'ĐÃ HỦY' | string; 
    waterType: string; 
}

// State cho Modal QR
interface QrModalState {
    isOpen: boolean;
    lotCode: string;
    qrCodeImage: string; // Base64 string (data:image/png;base64,...)
    isLoading: boolean;
}

// Giả định API endpoint
const API_BASE_URL = 'http://localhost:5000/api/receipts'; 

const WaterReceiptPage: React.FC = () => {
    
    // -----------------------------------------------------------
    // 1. STATE VÀ HOOKS
    // -----------------------------------------------------------
    
    // GỌI CÁC PHƯƠNG THỨC TOAST CHUYÊN BIỆT TỪ CONTEXT
    const { success, error, warning, info, delete: deleteToast } = useToast(); 
    
    const [formData, setFormData] = useState({
        quantity: 50,
        receiptDate: new Date().toISOString().substring(0, 10), 
        supplier: '',
        deliveryPerson: '', 
        // ĐẶT GIÁ TRỊ MẶC ĐỊNH CHO LOẠI NƯỚC
        waterType: WATER_TYPES[0].value,
    });

    const [receipts, setReceipts] = useState<ReceiptLot[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [qrModal, setQrModal] = useState<QrModalState>({
        isOpen: false,
        lotCode: '',
        qrCodeImage: '',
        isLoading: false,
    });


    // -----------------------------------------------------------
    // 2. HÀM API VÀ LOGIC 
    // -----------------------------------------------------------
    
    // Hàm tải dữ liệu lô hàng
    const fetchReceipts = useCallback(async (searchQuery = '') => {
        setIsLoading(true);
        try {
            // GIẢ ĐỊNH: Gọi API GET để lấy danh sách lô hàng
            const response = await axios.get(`${API_BASE_URL}`, {
                params: { search: searchQuery }
            });
            
            // MAP dữ liệu từ server (Giả định cấu trúc response)
            const formattedData: ReceiptLot[] = response.data.map((item: any) => ({
                id: item.id,
                lot_code: item.lot_code,
                supplier: item.supplier,
                deliveryPerson: item.delivery_person,
                quantity: item.quantity,
                receiptDate: item.receipt_date.substring(0, 10),
                status: item.status,
                waterType: item.water_type || 'Binh 20L', // Giả định trường water_type
            }));
            
            setReceipts(formattedData);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu:", err);
            error('Không thể tải dữ liệu lô hàng. Vui lòng kiểm tra Server.');
        } finally {
            setIsLoading(false);
        }
    }, [error]); 

    // Lifecycle: Tải dữ liệu ban đầu
    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    // Debounce cho Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchReceipts(searchTerm);
        }, 500); 

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchReceipts]);

    
    // Xử lý Form
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'quantity' ? parseInt(value) || 0 : value 
        }));
    };

    // Gửi Form tạo lô hàng mới
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.supplier || !formData.deliveryPerson || formData.quantity <= 0 || !formData.waterType) {
            warning('Vui lòng điền đầy đủ thông tin: Loại Nước, NCC, Người Giao Hàng và Số Lượng hợp lệ.');
            return;
        }

        try {
            setIsLoading(true);
            // GIẢ ĐỊNH: Gọi API POST để tạo lô hàng mới
            const response = await axios.post(API_BASE_URL, formData);
            
            success(response.data.message || `Đã ghi nhận lô hàng ${response.data.data.lot_code} (${formData.waterType}) vào kho.`);
            
            fetchReceipts(); 
            // Reset form
            setFormData({
                quantity: 50,
                receiptDate: new Date().toISOString().substring(0, 10),
                supplier: '',
                deliveryPerson: '',
                waterType: WATER_TYPES[0].value, 
            });

        } catch (err: any) {
            console.error("Lỗi khi tạo lô hàng:", err);
            const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi tạo lô hàng. Vui lòng thử lại.';
            error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Xử lý Cập nhật Trạng thái
    const handleUpdateStatus = async (lotId: number, newStatus: string, actionName: string) => {
        try {
            setIsLoading(true);
            // GIẢ ĐỊNH: Gọi API PUT để cập nhật trạng thái
            const response = await axios.put(`${API_BASE_URL}/${lotId}/status`, { status: newStatus });
            
            success(`${actionName} lô hàng ${response.data.data.lot_code} thành công. Trạng thái mới: ${newStatus}.`);
            
            fetchReceipts(searchTerm);

        } catch (err: any) {
            console.error(`Lỗi khi ${actionName} lô hàng:`, err);
            const errorMessage = err.response?.data?.message || `Lỗi khi ${actionName} lô hàng.`;
            error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Xử lý Xóa Lô hàng
    const handleDeleteLot = async (lotId: number, lotCode: string) => {
        try {
            setIsLoading(true);
            // GIẢ ĐỊNH: Gọi API DELETE để xóa lô hàng
            const response = await axios.delete(`${API_BASE_URL}/${lotId}`);
            
            deleteToast(response.data.message || `Đã XÓA lô hàng ${lotCode} thành công.`);
            
            fetchReceipts(searchTerm);

        } catch (err: any) {
            console.error(`Lỗi khi xóa lô hàng:`, err);
            const errorMessage = err.response?.data?.message || `Lỗi khi xóa lô hàng.`;
            error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Xử lý Tạo và Lấy QR Code
    const handleGenerateQrCode = async (lotId: number, lotCode: string) => {
        setQrModal({ isOpen: true, lotCode: lotCode, qrCodeImage: '', isLoading: true });
        
        try {
            // GIẢ ĐỊNH: Gọi API GET để lấy QR code (base64 string)
            const response = await axios.get(`${API_BASE_URL}/${lotId}/qrcode`); 
            const base64Image = `data:image/png;base64,${response.data.qrCodeImage}`;

            setQrModal(prev => ({ 
                ...prev, 
                qrCodeImage: base64Image, 
                isLoading: false 
            }));
            
            info(`Mã QR cho lô hàng ${lotCode} đã được tạo thành công.`);

        } catch (err: any) {
            console.error("Lỗi khi lấy QR code:", err);
            const errorMessage = err.response?.data?.message || 'Không thể tạo mã QR code. Lỗi Server.';
            error(errorMessage);
            setQrModal({ isOpen: false, lotCode: '', qrCodeImage: '', isLoading: false }); 
        }
    };


    // Hàm Xử lý khi chọn Thao tác từ Dropdown 
    const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>, item: ReceiptLot) => {
        const action = e.target.value;
        e.target.value = ''; // Reset select box
        
        switch (action) {
            case 'view':
                info(`Đang chuyển hướng để xem chi tiết lô hàng: ${item.lot_code}. (Chức năng chưa được triển khai)`);
                break;
            case 'qr': 
                if (item.status === 'ĐÃ NHẬP') {
                    handleGenerateQrCode(item.id, item.lot_code);
                } else {
                    warning(`Chỉ có thể tạo QR code cho lô hàng "ĐÃ NHẬP". Trạng thái hiện tại: "${item.status}".`);
                }
                break;
            case 'confirm':
                if (item.status === 'CHỜ XÁC NHẬN') {
                    handleUpdateStatus(item.id, 'ĐÃ NHẬP', 'Xác nhận nhập kho');
                } else {
                    warning(`Lô hàng ${item.lot_code} đã có trạng thái "${item.status}".`);
                }
                break;
            case 'cancel':
                if (item.status === 'CHỜ XÁC NHẬN') {
                    handleDeleteLot(item.id, item.lot_code); 
                } else {
                    warning(`Chỉ được phép xóa các lô hàng đang ở trạng thái "CHỜ XÁC NHẬN". Trạng thái hiện tại: "${item.status}".`);
                }
                break;
            default:
                break;
        }
    };


    // Hàm tạo style cho Status
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ĐÃ NHẬP':
                return 'bg-green-100 text-green-800';
            case 'CHỜ XÁC NHẬN':
                return 'bg-yellow-100 text-yellow-800';
            case 'ĐÃ HỦY': 
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };


    // -----------------------------------------------------------
    // 3. UI RENDER
    // -----------------------------------------------------------
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            
            <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-6 border-b-2 pb-2">
                <FaTruckLoading className="mr-3 text-green-600" />
                Quản Lý Nhận Hàng Vào Kho (Water Receipt)
            </h1>

            {/* PHẦN 1: FORM TẠO LÔ HÀNG MỚI */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700 flex items-center">
                    <FaBoxes className="mr-2" /> Tạo Lô Hàng Nhập Mới
                </h2>
                
                {isLoading && receipts.length === 0 && (
                    <div className="p-3 mb-4 text-sm font-medium text-blue-700 bg-blue-100 rounded-md flex items-center">
                        <FaSpinner className="animate-spin mr-2" /> Đang xử lý dữ liệu...
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        
                        {/* 1. Mã Lô Hàng (Tự động) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã Lô Hàng</label>
                            <input 
                                type="text" 
                                value="Tự động tạo (chờ xác nhận)" 
                                disabled 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 text-gray-500" 
                            />
                        </div>

                        {/* 2. LOẠI NƯỚC (TRƯỜNG MỚI) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center">
                                <FaTint className="mr-1 text-blue-500" /> Loại Nước <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="waterType"
                                value={formData.waterType}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                            >
                                {WATER_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* 3. Số lượng */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số lượng <span className="text-red-500">*</span></label>
                            <input 
                                type="number" 
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="50" 
                                min="1" 
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" 
                            />
                        </div>

                        {/* 4. Ngày Nhận */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày Nhận</label>
                            <input 
                                type="date" 
                                name="receiptDate"
                                value={formData.receiptDate}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" 
                            />
                        </div>
                        
                        {/* 5. Nhà Cung Cấp */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nhà Cung Cấp <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="Công ty Nước ABC" 
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" 
                            />
                        </div>

                        {/* 6. Người Giao Hàng (Kéo dài 2 cột trên màn hình vừa và lớn) */}
                        <div className="md:col-span-2"> 
                            <label className="block text-sm font-medium text-gray-700 flex items-center">
                                <FaUserTie className="mr-1 text-gray-500" /> Người Giao Hàng <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                name="deliveryPerson"
                                value={formData.deliveryPerson}
                                onChange={handleChange}
                                placeholder="Tên người giao" 
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" 
                            />
                        </div>
                        
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 flex items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaWarehouse className="mr-2" /> {isLoading ? 'Đang gửi...' : 'Ghi Nhận Nhập Kho'}
                    </button>
                </form>
            </div>


            {/* PHẦN 2: BẢNG LỊCH SỬ NHẬN HÀNG */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-indigo-700">Lịch Sử Nhận Hàng Gần Đây</h2>
                
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <div className="relative w-full sm:w-1/3 min-w-[250px]">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm Mã Lô, NCC, Người giao..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <button 
                        onClick={() => fetchReceipts(searchTerm)}
                        className="flex items-center text-sm px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                        disabled={isLoading}
                    >
                        <FaCalendarAlt className="mr-1" /> Làm mới/Lọc
                    </button>
                </div>
                
                {isLoading && receipts.length > 0 && (
                    <div className="text-center py-4 text-gray-500 flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" /> Đang tải dữ liệu...
                    </div>
                )}
                
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Mã Lô Hàng</th>
                                <th className="px-4 py-3">Loại Nước</th> 
                                <th className="px-4 py-3">Nhà Cung Cấp</th>
                                <th className="px-4 py-3">Người Giao Hàng</th> 
                                <th className="px-4 py-3">Số Lượng</th>
                                <th className="px-4 py-3">Ngày Nhận</th>
                                <th className="px-4 py-3">Trạng Thái</th>
                                <th className="px-4 py-3 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {receipts.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.lot_code}</td>
                                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">{item.waterType}</td> 
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.supplier}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.deliveryPerson}</td> 
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.receiptDate}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyles(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <select
                                            onChange={(e) => handleActionChange(e, item)}
                                            className="border border-gray-300 rounded-md text-xs py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                                            disabled={isLoading}
                                            defaultValue="" 
                                        >
                                            <option value="" disabled hidden>Chọn hành động</option>
                                            
                                            <option value="view">🔎 Xem chi tiết</option>
                                            
                                            {/* THAO TÁC MỚI: XUẤT QR CODE */}
                                            {item.status === 'ĐÃ NHẬP' && (
                                                <option value="qr">🖨️ Xuất QR Code</option>
                                            )}

                                            {/* Hành động Xác nhận (Chỉ khi CHỜ XÁC NHẬN) */}
                                            {item.status === 'CHỜ XÁC NHẬN' && (
                                                <option value="confirm">✅ Xác nhận nhập kho</option>
                                            )}
                                            
                                            {/* Hành động Xóa (Chỉ khi CHỜ XÁC NHẬN) */}
                                            {item.status === 'CHỜ XÁC NHẬN' && (
                                                <option value="cancel" className="text-red-600">🔥 Xóa/Hủy lô hàng</option>
                                            )}
                                            
                                            {item.status !== 'CHỜ XÁC NHẬN' && item.status !== 'ĐÃ NHẬP' && (
                                                <option value="" disabled className="text-gray-500 italic">
                                                    Không có thao tác
                                                </option>
                                            )}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {receipts.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                                        Không tìm thấy lô hàng nhập nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PHẦN 3: MODAL HIỂN THỊ QR CODE */}
            {qrModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center">
                            <FaQrcode className="mr-2 text-indigo-600" /> Mã QR Code: <span className="ml-2 text-indigo-700">{qrModal.lotCode}</span>
                        </h3>

                        <div className="flex justify-center items-center h-64 border border-dashed p-4 rounded-md">
                            {qrModal.isLoading ? (
                                <div className="text-indigo-600 flex items-center">
                                    <FaSpinner className="animate-spin mr-2" /> Đang tạo mã QR...
                                </div>
                            ) : qrModal.qrCodeImage ? (
                                <img 
                                    src={qrModal.qrCodeImage} 
                                    alt={`QR Code cho ${qrModal.lotCode}`} 
                                    className="w-full max-w-[200px] h-auto border p-2"
                                />
                            ) : (
                                <div className="text-red-500">Không có dữ liệu QR.</div>
                            )}
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                            {/* NÚT IN QR CODE */}
                            <button
                                onClick={() => {
                                    if (qrModal.qrCodeImage) {
                                        const printWindow = window.open('', '_blank');
                                        printWindow?.document.write(`
                                            <html>
                                                <head>
                                                    <title>In QR Code</title>
                                                    <style>
                                                        @media print { 
                                                            @page { margin: 10mm; } 
                                                            body { font-family: sans-serif; text-align: center; } 
                                                            img { width: 250px; height: 250px; border: 1px solid #ccc; padding: 5px; }
                                                        }
                                                    </style>
                                                </head>
                                                <body style="text-align: center; padding: 20px;">
                                                    <h1 style="margin-bottom: 10px;">Mã Lô Hàng: ${qrModal.lotCode}</h1>
                                                    <img src="${qrModal.qrCodeImage}" alt="QR Code" />
                                                    <p style="margin-top: 10px; font-size: 12px; color: #555;">Vui lòng dán mã này lên lô hàng.</p>
                                                    <script>
                                                                window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }
                                                    </script>
                                                </body>
                                            </html>
                                        `);
                                        printWindow?.document.close();
                                    } else {
                                        warning("Không có mã QR để in.");
                                    }
                                }}
                                disabled={!qrModal.qrCodeImage}
                                className="px-4 py-2 mr-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                In QR Code
                            </button>
                            {/* NÚT ĐÓNG MODAL */}
                            <button
                                onClick={() => setQrModal({ isOpen: false, lotCode: '', qrCodeImage: '', isLoading: false })}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default WaterReceiptPage;