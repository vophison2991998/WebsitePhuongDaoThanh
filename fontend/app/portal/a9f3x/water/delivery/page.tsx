"use client";

import React, { useState, useCallback, useMemo } from 'react';
// ĐÃ SỬA LỖI CUỐI CÙNG: Import named export { QRCodeSVG } và đặt tên lại là QrCodeGenerator
import { QRCodeSVG as QrCodeGenerator } from 'qrcode.react'; 
import { FaTruckMoving, FaPlus, FaShoppingCart, FaSearch, FaClock, FaQrcode, FaPrint, FaTimes } from 'react-icons/fa';

// Import Service và Type (Vẫn giả định chúng được export từ file service.ts)
import { 
    saveDeliveryOrder, 
    DeliveryOrder,
    SaveResult 
} from './services/deliveryService'; 

// =================================================================
// Component QRCode THỰC TẾ (Không thay đổi, vì QrCodeGenerator đã được sửa import)
// =================================================================
/**
 * Component tạo Mã QR có thể quét được.
 */
const QRCode: React.FC<{ value: string; size: number }> = ({ value, size }) => (
    <div className="p-1 bg-white flex items-center justify-center mx-auto border border-gray-100 shadow-inner">
        <QrCodeGenerator 
            value={value}   // Dữ liệu JSON của đơn hàng
            size={size}     // Kích thước
            level="H"       // Cấp độ sửa lỗi cao
            fgColor="#000000"
            bgColor="#ffffff"
            // Lưu ý: QRCodeSVG mặc định render SVG, không cần renderAs="svg"
        />
    </div>
);


// Định nghĩa kiểu dữ liệu cho mục trong bảng
interface DeliveryItem {
    id: string;
    recipient: string;
    dept: string;
    quantity: number;
    waterType: string; 
    status: 'Đang chờ xử lý' | 'Đang giao' | 'Hoàn thành';
    date: string;
}

// Dữ liệu giả định
const waterTypes: string[] = ["Nước Tinh Khiết 20L", "Nước Khoáng 20L", "Nước đóng chai 500ml"];
const departments: string[] = ["Phòng Kỹ thuật", "Phòng Hành chính", "Phòng Kế toán", "Phòng Sales"];
const initialDeliveries: DeliveryItem[] = [
    { id: "ORD-003", recipient: "Nguyễn Văn A", dept: "Hành chính", quantity: 20, waterType: "Nước Tinh Khiết 20L", status: "Đang giao", date: "16/12/2025" },
    { id: "ORD-002", recipient: "Trần Thị B", dept: "Kế toán", quantity: 15, waterType: "Nước Khoáng 20L", status: "Hoàn thành", date: "15/12/2025" },
];

// =================================================================
// Component Modal hiển thị QR Code
// =================================================================
interface DeliveryQrModalProps {
    order: DeliveryItem | null;
    onClose: () => void;
}

const DeliveryQrModal: React.FC<DeliveryQrModalProps> = ({ order, onClose }) => {
    if (!order) return null;

    const qrValue: string = JSON.stringify({
        id: order.id,
        recipient: order.recipient,
        dept: order.dept,
        quantity: order.quantity,
        waterType: order.waterType
    });

    const handlePrint = () => {
        const printContent = document.getElementById('qr-print-area')?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>In Mã QR</title>');
                printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;} .qr-data { margin-top: 20px; text-align: center; } .qr-code-box { display: inline-block; padding: 10px; } button { display: none; } .w-full { width: 100%; }</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { 
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        } else {
            alert("Không tìm thấy nội dung để in.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md relative">
                
                <div id="qr-print-area" className="flex flex-col items-center">
                    <h3 className="text-xl font-bold text-center mb-4 border-b pb-2 w-full text-gray-900">Mã QR Đơn Hàng: {order.id}</h3>
                    
                    <div className="text-center mb-4 qr-data">
                        <div className="qr-code-box">
                            <QRCode value={qrValue} size={200} /> 
                        </div>
                    </div>
                    
                    <div className="w-full text-left mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700 mb-1 font-semibold">
                            Loại nước: <span className="font-normal text-indigo-700">{order.waterType}</span>
                        </p>
                        <p className="text-sm text-gray-700 mb-1 font-semibold">
                            Số lượng: <span className="font-normal">{order.quantity} bình</span>
                        </p>
                        <p className="text-sm text-gray-700 font-semibold">
                            Người nhận: <span className="font-normal">{order.recipient} ({order.dept})</span>
                        </p>
                    </div>
                </div>

                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
                    title="Đóng"
                >
                    <FaTimes size={20} />
                </button>

                <button
                    onClick={handlePrint}
                    className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 flex items-center justify-center mt-4 shadow-lg"
                >
                    <FaPrint className="mr-2" />
                    In Mã QR
                </button>
            </div>
        </div>
    );
};


// =================================================================
// Component chính - WaterDeliveryPage
// =================================================================
const WaterDeliveryPage: React.FC = () => {
    const [formData, setFormData] = useState<Omit<DeliveryOrder, 'orderCode'>>({
        quantity: 1,
        waterType: waterTypes[0] || '', 
        recipientName: '',
        department: '',
        content: '',
        deliveryTime: new Date().toISOString().substring(0, 16),
    });
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>(initialDeliveries);
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const { name, value } = target;

        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'quantity' ? parseInt(value) || 0 : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsLoading(true);

        if (!formData.quantity || formData.quantity < 1 || !formData.waterType || !formData.recipientName || !formData.department) {
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ và chính xác các trường bắt buộc (*).' });
            setIsLoading(false);
            return;
        }

        const newOrderCode = `ORD-${Date.now().toString().slice(-6)}`; 
        const orderToSave: DeliveryOrder = { ...formData, orderCode: newOrderCode };

        try {
            const result: SaveResult = await saveDeliveryOrder(orderToSave); 
            
            if (result.success) {
                
                const newDeliveryItem: DeliveryItem = {
                    id: result.orderId,
                    recipient: formData.recipientName,
                    dept: formData.department,
                    quantity: formData.quantity,
                    waterType: formData.waterType, 
                    status: "Đang chờ xử lý",
                    date: new Date().toLocaleDateString('vi-VN'),
                };

                setDeliveries(prev => [newDeliveryItem, ...prev]);
                setMessage({ type: 'success', text: `Đơn hàng ${result.orderId} đã được tạo thành công! Vui lòng in Mã QR.` });
                
                setSelectedOrder(newDeliveryItem);

                setFormData(prev => ({
                    ...prev,
                    quantity: 1, 
                    recipientName: '', 
                    department: '', 
                    content: '',
                }));
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error instanceof Error ? error.message : 'Lỗi hệ thống không xác định.' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: DeliveryItem['status']): string => {
        switch (status) {
            case 'Đang giao': return 'bg-yellow-100 text-yellow-800';
            case 'Hoàn thành': return 'bg-green-100 text-green-800';
            case 'Đang chờ xử lý': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredDeliveries = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) return deliveries;

        return deliveries.filter(item => 
            item.id.toLowerCase().includes(lowerCaseSearch) ||
            item.recipient.toLowerCase().includes(lowerCaseSearch) ||
            item.dept.toLowerCase().includes(lowerCaseSearch) ||
            item.waterType.toLowerCase().includes(lowerCaseSearch)
        );
    }, [deliveries, searchTerm]);


    // --- UI Render ---
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-6">
                <FaTruckMoving className="mr-3 text-red-600" />
                Quản lý Xuất Kho Nước (Delivery)
            </h1>

            {/* --- Form Tạo đơn hàng mới --- */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-red-600">Tạo Đơn Hàng Xuất Mới</h2>
                
                {message && (
                    <div className={`p-3 mb-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã Đơn Hàng</label>
                            <input type="text" value="Tự động tạo" disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 text-gray-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số Lượng (Bình) <span className="text-red-500">*</span></label>
                            <input 
                                type="number" 
                                name="quantity" 
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="10" 
                                min="1" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loại Nước <span className="text-red-500">*</span></label>
                            <select 
                                name="waterType" 
                                value={formData.waterType}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="" disabled>Chọn loại nước</option>
                                {waterTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Người Nhận <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="recipientName" 
                                value={formData.recipientName}
                                onChange={handleChange}
                                placeholder="Nguyễn Văn A" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phòng Ban <span className="text-red-500">*</span></label>
                            <select 
                                name="department" 
                                value={formData.department}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="" disabled>Chọn phòng ban</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Thời Gian Yêu Cầu</label>
                            <div className="relative">
                                <input 
                                    type="datetime-local" 
                                    name="deliveryTime" 
                                    value={formData.deliveryTime}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-red-500 focus:border-red-500" 
                                />
                                <FaClock className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Nội dung nhận/Ghi chú</label>
                            <textarea 
                                rows={2}
                                name="content" 
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Ví dụ: Để tại phòng họp tầng 3, sử dụng cho cuộc họp..." 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500" 
                            />
                        </div>

                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`mt-6 px-6 py-3 text-white font-semibold rounded-lg transition duration-150 flex items-center justify-center 
                            ${isLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-md'}`}
                    >
                        <FaShoppingCart className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                        {isLoading ? 'Đang Xử Lý...' : 'Tạo Đơn Hàng & Xuất Kho'}
                    </button>
                </form>
            </div>


            {/* --- Bảng Trạng thái Đơn Hàng --- */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-indigo-600">Trạng Thái Đơn Hàng Xuất Kho</h2>
                
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full sm:w-1/3 min-w-[250px]">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo Mã Đơn, Người nhận..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <button className="hidden sm:inline-flex px-4 py-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 text-sm font-medium transition-colors items-center">
                        <FaPlus className="inline mr-1" /> Thêm Đơn Hàng Thủ Công
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Mã Đơn Hàng</th>
                                <th className="px-4 py-3">Người Nhận</th>
                                <th className="px-4 py-3">Phòng Ban</th>
                                <th className="px-4 py-3">Loại Nước</th> 
                                <th className="px-4 py-3">SL</th>
                                <th className="px-4 py-3">Trạng Thái</th>
                                <th className="px-4 py-3">Ngày Xuất</th>
                                <th className="px-4 py-3 text-center">Mã QR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredDeliveries.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.recipient}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.dept}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.waterType}</td> 
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.date}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => setSelectedOrder(item)}
                                            className="p-1 rounded-full text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100"
                                            title={`Xem/In Mã QR Đơn ${item.id}`}
                                        >
                                            <FaQrcode size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDeliveries.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                                        Không tìm thấy đơn hàng nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Render Modal QR Code */}
            <DeliveryQrModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </div>
    );
};

export default WaterDeliveryPage;