import React from 'react';
import { 
    FaTruckMoving, FaPlus, FaShoppingCart, FaSearch, 
    FaClock, FaQrcode, FaPrint, FaTimes, FaTrashAlt 
} from 'react-icons/fa';
import { QRCodeSVG as QrCodeGenerator } from 'qrcode.react';

// --- Types & Interfaces ---
export interface DeliveryItem {
    id: string;
    recipient: string;
    dept: string;
    waterType: string;
    quantity: number;
    status: string; 
    date: string;
    content?: string;
}

export interface WaterDeliveryLogicProps {
    formData: {
        quantity: string;
        waterType: string;
        recipientName: string;
        department: string;
        deliveryTime: string;
        content: string;
    };
    isLoading: boolean;
    message: { text: string; type: 'success' | 'error' } | null;
    deliveries: DeliveryItem[];
    selectedOrder: DeliveryItem | null;
    searchTerm: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleUpdateStatus: (id: string, newStatus: string) => void;
    handleDelete: (id: string) => void; // Thêm function này
    setSearchTerm: (value: string) => void;
    setSelectedOrder: (order: DeliveryItem | null) => void;
    getStatusColor: (status: string) => string;
    waterTypes: string[];
    departments: string[];
}

// --- Component QRCode ---
const QRCode: React.FC<{ value: string; size: number }> = ({ value, size }) => (
    <div className="p-1 bg-white flex items-center justify-center mx-auto border border-gray-100 shadow-inner">
        <QrCodeGenerator 
            value={value} 
            size={size} 
            level="H" 
            fgColor="#000000"
            bgColor="#ffffff"
        />
    </div>
);

// --- Component Modal ---
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
        waterType: order.waterType,
        status: order.status
    });

    const handlePrint = () => {
        const printContent = document.getElementById('qr-print-area')?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>In Phiếu Giao Hàng</title>');
                printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;} .qr-data { margin-top: 20px; text-align: center; } .qr-code-box { display: inline-block; padding: 10px; border: 1px solid #ccc; } button { display: none; } .w-full { width: 100%; }</style>');
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
                    <div className="w-full text-left mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-700 mb-1 font-semibold">Loại nước: <span className="font-normal text-indigo-700">{order.waterType}</span></p>
                        <p className="text-sm text-gray-700 mb-1 font-semibold">Số lượng: <span className="font-normal">{order.quantity} bình</span></p>
                        <p className="text-sm text-gray-700 font-semibold">Người nhận: <span className="font-normal">{order.recipient} ({order.dept})</span></p>
                        <p className="text-sm text-gray-700 mt-2 italic font-medium">Trạng thái: <span className="text-red-600">{order.status}</span></p>
                    </div>
                </div>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"><FaTimes size={20} /></button>
                <button onClick={handlePrint} className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center justify-center mt-4 shadow-lg">
                    <FaPrint className="mr-2" /> In Phiếu Giao
                </button>
            </div>
        </div>
    );
};

// --- Component UI Chính ---
const WaterDeliveryPageUI: React.FC<WaterDeliveryLogicProps> = ({
    formData, isLoading, message, deliveries, selectedOrder, searchTerm,
    handleChange, handleSubmit, handleUpdateStatus, handleDelete, setSearchTerm, setSelectedOrder, getStatusColor,
    waterTypes, departments,
}) => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-6">
                <FaTruckMoving className="mr-3 text-red-600" /> Quản lý Xuất Kho Nước (Delivery)
            </h1>
            
            {/* Form Tạo Mới */}
            <div className="bg-white p-6 rounded-lg shadow-xl mb-8 border border-red-200">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-red-600 flex items-center">
                    <FaPlus className="mr-2 text-red-500" /> Tạo Đơn Hàng Xuất Mới
                </h2>
                {message && (
                    <div className={`p-3 mb-4 rounded-md shadow-sm ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã Đơn Hàng</label>
                            <input type="text" value="Tự động tạo (ORD-...)" disabled className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-500 italic" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số Lượng (Bình) *</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loại Nước *</label>
                            <select name="waterType" value={formData.waterType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white" required>
                                <option value="" disabled>Chọn loại nước</option>
                                {waterTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Người Nhận *</label>
                            <input type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phòng Ban *</label>
                            <select name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white" required>
                                <option value="" disabled>Chọn phòng ban</option>
                                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Thời Gian Dự Kiến</label>
                            <div className="relative">
                                <input type="datetime-local" name="deliveryTime" value={formData.deliveryTime} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 pr-10" />
                                <FaClock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Ghi chú giao hàng</label>
                            <textarea rows={2} name="content" value={formData.content} onChange={handleChange} placeholder="Ví dụ: Giao lên lầu 2, gọi trước khi đến..." className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className={`mt-6 px-6 py-3 text-white font-semibold rounded-lg flex items-center justify-center transition-all ${isLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow-xl shadow-lg'}`}>
                        <FaShoppingCart className={`mr-2 ${isLoading ? 'animate-pulse' : ''}`} /> {isLoading ? 'Đang Xử Lý...' : 'Xác Nhận Xuất Kho'}
                    </button>
                </form>
            </div>

            {/* Danh sách đơn hàng */}
            <div className="bg-white p-6 rounded-lg shadow-xl border border-indigo-200">
                <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-3">
                    <h2 className="text-xl font-bold text-indigo-800">Lịch Sử Giao Nhận</h2>
                    <div className="relative w-full sm:w-1/3 min-w-[250px]">
                        <input type="text" placeholder="Tìm tên khách, mã đơn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-indigo-500 focus:border-indigo-500" />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Mã Đơn</th>
                                <th className="px-4 py-3">Người Nhận</th>
                                <th className="px-4 py-3">Phòng Ban</th>
                                <th className="px-4 py-3">Sản phẩm</th>
                                <th className="px-4 py-3">SL</th>
                                <th className="px-4 py-3">Trạng Thái</th>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {deliveries.map((item) => (
                                <tr key={item.id} className="hover:bg-indigo-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-bold text-indigo-600">{item.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.recipient}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{item.dept}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{item.waterType}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.quantity}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm cursor-pointer focus:outline-none transition-all ${getStatusColor(item.status)}`}
                                        >
                                            <option value="Chờ giao">Chờ giao</option>
                                            <option value="Đang giao">Đang giao</option>
                                            <option value="Đã giao">Đã giao</option>
                                            <option value="Đã hủy">Đã hủy</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 font-medium">{item.date}</td>
                                    <td className="px-4 py-3 text-center flex justify-center gap-2">
                                        <button 
                                            onClick={() => setSelectedOrder(item)} 
                                            className="p-2 rounded-full text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 shadow-sm transition-all bg-white" 
                                            title="Xem mã QR"
                                        >
                                            <FaQrcode size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            className="p-2 rounded-full text-red-600 hover:text-white hover:bg-red-600 border border-red-200 shadow-sm transition-all bg-white" 
                                            title="Xóa đơn hàng"
                                        >
                                            <FaTrashAlt size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {deliveries.length === 0 && (
                        <div className="text-center py-10 text-gray-500 italic">Không tìm thấy dữ liệu phù hợp...</div>
                    )}
                </div>
            </div>
            
            {/* Modal hiển thị QR */}
            <DeliveryQrModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </div>
    );
};

export default WaterDeliveryPageUI;