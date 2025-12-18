import React from 'react';
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
    FaEye
} from 'react-icons/fa';
import { useToast } from "@/components/ui/ToastContext"; 

// --- INTERFACES ---
interface WaterReceiptData {
    id: number;
    lot_code: string;
    supplier: string;
    waterType: string;
    quantity: number;
    receiptDate: string; 
    deliveryPerson: string;
    status: 'CHỜ XÁC NHẬN' | 'ĐÃ NHẬP' | 'ĐÃ HỦY';
}
interface WaterType { id: number; name: string; }
interface FormData { waterType: string; quantity: number | ''; receiptDate: string; supplier: string; deliveryPerson: string; }
interface QrModalState { isOpen: boolean; lotCode: string; qrCodeImage: string | null; isLoading: boolean; }
interface WaterReceiptUIProps {
    formData: FormData;
    receipts: WaterReceiptData[];
    waterTypes: WaterType[];
    searchTerm: string;
    isLoading: boolean;
    isTypesLoading: boolean;
    qrModal: QrModalState;
    setSearchTerm: (term: string) => void;
    setQrModal: (state: QrModalState) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleActionChange: (e: { target: { value: string } }, item: WaterReceiptData) => void;
    fetchReceipts: (term?: string) => void;
    getStatusStyles: (status: WaterReceiptData['status']) => string;
}

const WaterReceiptPageUI: React.FC<WaterReceiptUIProps> = ({
    formData, receipts, waterTypes, searchTerm, isLoading, isTypesLoading,
    qrModal, setSearchTerm, setQrModal, handleChange, handleSubmit,
    handleActionChange, fetchReceipts, getStatusStyles
}) => {

    const { warning } = useToast();

    const handlePrintQrCode = () => {
        if (qrModal.qrCodeImage) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>In QR Code</title>
                            <style>
                                @media print { @page { margin: 10mm; } body { font-family: sans-serif; text-align: center; } img { width: 250px; height: 250px; border: 1px solid #ccc; padding: 5px; } }
                                body { text-align: center; padding: 20px; }
                                h1 { margin-bottom: 10px; font-size: 18px; }
                            </style>
                        </head>
                        <body>
                            <h1>Mã Lô Hàng: ${qrModal.lotCode}</h1>
                            <img src="${qrModal.qrCodeImage}" alt="QR Code" />
                            <p>Vui lòng dán mã này lên lô hàng.</p>
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
            <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-6 border-b-2 pb-2">
                <FaTruckLoading className="mr-3 text-green-600" />
                Quản Lý Nhận Hàng Vào Kho (Water Receipt)
            </h1>

            {/* PHẦN 1: FORM TẠO LÔ HÀNG MỚI */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700 flex items-center">
                    <FaBoxes className="mr-2" /> Tạo Lô Hàng Nhập Mới
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã Lô Hàng</label>
                            <input type="text" value="Tự động tạo (chờ xác nhận)" disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 text-gray-500" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center">
                                <FaTint className="mr-1 text-blue-500" /> Loại Nước <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="waterType"
                                value={formData.waterType}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                disabled={isTypesLoading}
                            >
                                <option value="" disabled>{isTypesLoading ? 'Đang tải...' : 'Chọn loại nước'}</option>
                                {waterTypes.map((type) => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))}
                            </select>
                        </div>

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
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày Nhận</label>
                            <input type="date" name="receiptDate" value={formData.receiptDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nhà Cung Cấp <span className="text-red-500">*</span></label>
                            <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="NCC ABC" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center">
                                <FaUserTie className="mr-1 text-gray-500" /> Người Giao Hàng <span className="text-red-500">*</span>
                            </label>
                            <input type="text" name="deliveryPerson" value={formData.deliveryPerson} onChange={handleChange} placeholder="Tên người giao" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isTypesLoading}
                        className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 flex items-center shadow-md disabled:opacity-50"
                    >
                        <FaWarehouse className="mr-2" /> Ghi Nhận Nhập Kho
                    </button>
                </form>
            </div>

            {/* PHẦN 2: BẢNG LỊCH SỬ */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-xl font-semibold text-indigo-700">Lịch Sử Nhận Hàng Gần Đây</h2>
                    <div className="relative w-full sm:w-1/3 min-w-[250px]">
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 pl-10"
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Mã Lô</th>
                                <th className="px-4 py-3">Nhà Cung Cấp</th>
                                <th className="px-4 py-3">Loại Nước</th>
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
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.supplier}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.waterType}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.receiptDate}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyles(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-3">
                                      
                                            {/* Nút QR - Hiện khi ĐÃ NHẬP */}
                                            {item.status === 'ĐÃ NHẬP' && (
                                                <button onClick={() => handleActionChange({ target: { value: 'qr' } }, item)} className="text-indigo-600 hover:text-indigo-800" title="QR Code">
                                                    <FaQrcode size={18} />
                                                </button>
                                            )}

                                            {/* Nút Xác nhận - Hiện khi CHỜ XÁC NHẬN */}
                                            {item.status === 'CHỜ XÁC NHẬN' && (
                                                <button onClick={() => handleActionChange({ target: { value: 'confirm' } }, item)} className="text-green-600 hover:text-green-800" title="Xác nhận">
                                                    <FaCheck size={18} />
                                                </button>
                                            )}

                                            {/* Nút Xóa - LUÔN HIỂN THỊ (Theo yêu cầu của bạn) */}
                                            <button 
                                                onClick={() => handleActionChange({ target: { value: 'cancel' } }, item)} 
                                                className="text-red-500 hover:text-red-700" 
                                                title="Xóa bất kỳ lúc nào"
                                            >
                                                <FaTrash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PHẦN 3: MODAL QR */}
            {qrModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Mã QR: {qrModal.lotCode}</h3>
                        <div className="flex justify-center items-center h-64 border border-dashed rounded-md mb-4">
                            {qrModal.isLoading ? <FaSpinner className="animate-spin text-indigo-600" /> : <img src={qrModal.qrCodeImage || ''} alt="QR" className="max-w-[200px]" />}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={handlePrintQrCode} className="px-4 py-2 bg-indigo-600 text-white rounded-md">In QR</button>
                            <button onClick={() => setQrModal({ ...qrModal, isOpen: false })} className="px-4 py-2 bg-gray-300 rounded-md">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterReceiptPageUI;