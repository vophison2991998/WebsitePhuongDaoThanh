// WaterDeliveryPageUI.tsx
import React from 'react';
import { FaTruckMoving, FaPlus, FaShoppingCart, FaSearch, FaClock, FaQrcode, FaPrint, FaTimes } from 'react-icons/fa';
import { QRCodeSVG as QrCodeGenerator } from 'qrcode.react'; 

import { DeliveryItem, WaterDeliveryLogicProps } from './WaterDeliveryLogic';


const QRCode: React.FC<{ value: string; size: number }> = ({ value, size }) => (
    <div className="p-1 bg-white flex items-center justify-center mx-auto border border-gray-100 shadow-inner">
        <QrCodeGenerator 
            value={value}   // Dữ liệu JSON của đơn hàng
            size={size}     // Kích thước
            level="H"       // Cấp độ sửa lỗi cao
            fgColor="#000000"
            bgColor="#ffffff"
        />
    </div>
);

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
        // Lấy nội dung cần in
        const printContent = document.getElementById('qr-print-area')?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                // Thêm CSS và nội dung vào cửa sổ in
                printWindow.document.write('<html><head><title>In Mã QR</title>');
                printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;} .qr-data { margin-top: 20px; text-align: center; } .qr-code-box { display: inline-block; padding: 10px; border: 1px solid #ccc; } button { display: none; } .w-full { width: 100%; }</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                
                // Chờ một chút trước khi in
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
                
                {/* Khu vực in - chỉ nội dung này được in */}
                <div id="qr-print-area" className="flex flex-col items-center">
                    <h3 className="text-xl font-bold text-center mb-4 border-b pb-2 w-full text-gray-900">Mã QR Đơn Hàng: {order.id}</h3>
                    
                    <div className="text-center mb-4 qr-data">
                        <div className="qr-code-box">
                            <QRCode value={qrValue} size={200} /> 
                        </div>
                    </div>
                    
                    <div className="w-full text-left mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-700 mb-1 font-semibold">
                            Loại nước: <span className="font-normal text-indigo-700">{order.waterType}</span>
                        </p>
                        <p className="text-sm text-gray-700 mb-1 font-semibold">
                            Số lượng: <span className="font-normal">{order.quantity} bình</span>
                        </p>
                        <p className="text-sm text-gray-700 font-semibold">
                            Người nhận: <span className="font-normal">{order.recipient} ({order.dept})</span>
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                            **Quét mã này để xác nhận giao hàng.**
                        </p>
                    </div>
                </div>
                {/* End Khu vực in */}

                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
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
// Component UI Chính - WaterDeliveryPageUI
// =================================================================
/**
 * Component giao diện nhận tất cả state/handlers từ hook logic.
 */
const WaterDeliveryPageUI: React.FC<WaterDeliveryLogicProps> = ({
    formData,
    isLoading,
    message,
    deliveries, // Đã là filteredDeliveries từ hook
    selectedOrder,
    searchTerm,
    handleChange,
    handleSubmit,
    setSearchTerm,
    setSelectedOrder,
    getStatusColor,
    waterTypes,
    departments,
}) => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-6">
                <FaTruckMoving className="mr-3 text-red-600" />
                Quản lý Xuất Kho Nước (Delivery)
            </h1>
            
            {/* --- Form Tạo đơn hàng mới --- */}
            <div className="bg-white p-6 rounded-lg shadow-xl mb-8 border border-red-200">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-red-600 flex items-center">
                    <FaPlus className="mr-2 text-red-500" /> Tạo Đơn Hàng Xuất Mới
                </h2>
                
                {message && (
                    <div className={`p-3 mb-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
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
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loại Nước <span className="text-red-500">*</span></label>
                            <select 
                                name="waterType" 
                                value={formData.waterType}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                required
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
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phòng Ban <span className="text-red-500">*</span></label>
                            <select 
                                name="department" 
                                value={formData.department}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                required
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
                            ${isLoading ? 'bg-red-400 cursor-not-allowed opacity-75' : 'bg-red-600 hover:bg-red-700 shadow-lg'}`}
                    >
                        <FaShoppingCart className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                        {isLoading ? 'Đang Xử Lý...' : 'Tạo Đơn Hàng & Xuất Kho'}
                    </button>
                </form>
            </div>


            {/* --- Bảng Trạng thái Đơn Hàng --- */}
            <div className="bg-white p-6 rounded-lg shadow-xl border border-indigo-200">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-indigo-600 flex items-center">
                    <FaTruckMoving className="mr-2 text-indigo-500" /> Trạng Thái Đơn Hàng Xuất Kho
                </h2>
                
                <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-3">
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
                    <button className="w-full sm:w-auto px-4 py-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 text-sm font-medium transition-colors items-center flex justify-center shadow-sm">
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
                            {deliveries.map((item) => (
                                <tr key={item.id} className="hover:bg-indigo-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.recipient}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.dept}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.waterType}</td> 
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.date}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => setSelectedOrder(item)}
                                            className="p-2 rounded-full text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 shadow-sm"
                                            title={`Xem/In Mã QR Đơn ${item.id}`}
                                        >
                                            <FaQrcode size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {deliveries.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-base">
                                        <FaSearch className="inline mr-2" /> Không tìm thấy đơn hàng nào phù hợp với từ khóa: **"{searchTerm}"**.
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

export default WaterDeliveryPageUI;