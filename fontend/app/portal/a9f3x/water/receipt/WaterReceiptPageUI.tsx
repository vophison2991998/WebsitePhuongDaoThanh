import React from 'react';
// Import Icons
import {
    FaTruckLoading, 
    FaCalendarAlt, 
    FaWarehouse, 
    FaSearch, 
    FaUserTie, 
    FaQrcode, 
    FaSpinner, 
    FaBoxes, 
    FaTint 
} from 'react-icons/fa';
import { useToast } from "@/components/ui/ToastContext"; 

// ❗️ INTERFACE GIẢ ĐỊNH (ĐÃ ĐỒNG BỘ)
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
    isLoading: boolean; // Trạng thái tải chung (hoặc cho bảng)
    isTypesLoading: boolean; // Trạng thái tải riêng cho Loại Nước
    qrModal: QrModalState;
    setSearchTerm: (term: string) => void;
    setQrModal: (state: QrModalState) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleActionChange: (e: React.ChangeEvent<HTMLSelectElement>, item: WaterReceiptData) => void;
    fetchReceipts: (term?: string) => void;
    getStatusStyles: (status: WaterReceiptData['status']) => string;
}


const WaterReceiptPageUI: React.FC<WaterReceiptUIProps> = ({
    formData,
    receipts,
    waterTypes, 
    searchTerm,
    isLoading,
    isTypesLoading, // Sử dụng trạng thái tải riêng
    qrModal,
    setSearchTerm,
    setQrModal,
    handleChange,
    handleSubmit,
    handleActionChange,
    fetchReceipts,
    getStatusStyles
}) => {

    const { warning } = useToast();

    // Hàm in QR Code
    const handlePrintQrCode = () => {
        if (qrModal.qrCodeImage) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>In QR Code</title>
                            <style>
                                @media print {
                                    @page { margin: 10mm; }
                                    body { font-family: sans-serif; text-align: center; }
                                    img { width: 250px; height: 250px; border: 1px solid #ccc; padding: 5px; }
                                }
                                body { text-align: center; padding: 20px; }
                                h1 { margin-bottom: 10px; font-size: 18px; }
                                p { margin-top: 10px; font-size: 12px; color: #555; }
                            </style>
                        </head>
                        <body>
                            <h1>Mã Lô Hàng: ${qrModal.lotCode}</h1>
                            <img src="${qrModal.qrCodeImage}" alt="QR Code" />
                            <p>Vui lòng dán mã này lên lô hàng.</p>
                            <script>
                                window.onload = function() { 
                                    window.print(); 
                                    // Đóng cửa sổ sau khi in (nếu trình duyệt hỗ trợ)
                                    window.onafterprint = function() { 
                                        setTimeout(() => window.close(), 100); 
                                    } 
                                }
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } else {
            warning("Không có mã QR để in.");
        }
    };


    // -----------------------------------------------------------
    // 2. UI RENDER
    // -----------------------------------------------------------
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

                {/* HIỂN THỊ TRẠNG THÁI ĐANG TẢI (Nếu cả Form và Bảng đều chưa có dữ liệu) */}
                {(isLoading && receipts.length === 0) && (
                    <div className="p-3 mb-4 text-sm font-medium text-blue-700 bg-blue-100 rounded-md flex items-center">
                        <FaSpinner className="animate-spin mr-2" /> Đang xử lý dữ liệu...
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

                        {/* Mã Lô Hàng (Tự động) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã Lô Hàng</label>
                            <input
                                type="text"
                                value="Tự động tạo (chờ xác nhận)"
                                disabled
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 text-gray-500"
                            />
                        </div>
                        
                        {/* LOẠI NƯỚC (SỬ DỤNG DỮ LIỆU TỪ PROPS) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center">
                                <FaTint className="mr-1 text-blue-500" /> Loại Nước <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="waterType"
                                value={formData.waterType}
                                onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                disabled={isTypesLoading || waterTypes.length === 0}
                            >
                                <option value="" disabled>
                                    {isTypesLoading ? 'Đang tải Loại Nước...' : 'Chọn loại nước'}
                                </option>
                                {/* Map dữ liệu từ prop waterTypes */}
                                {Array.isArray(waterTypes) && waterTypes.map((type) => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))}
                            </select>
                        </div>


                        {/* Số lượng */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số lượng (Bình/Chai) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                name="quantity"
                                // Đảm bảo giá trị là chuỗi hoặc rỗng
                                value={formData.quantity === '' ? '' : formData.quantity.toString()} 
                                onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                                placeholder="50"
                                min="1"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        {/* Ngày Nhận */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày Nhận</label>
                            <input
                                type="date"
                                name="receiptDate"
                                value={formData.receiptDate}
                                onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        {/* Nhà Cung Cấp */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nhà Cung Cấp <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                                placeholder="Công ty Nước ABC"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        {/* Người Giao Hàng */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center">
                                <FaUserTie className="mr-1 text-gray-500" /> Người Giao Hàng <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="deliveryPerson"
                                value={formData.deliveryPerson}
                                onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                                placeholder="Tên người giao"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isTypesLoading} // Vô hiệu hóa khi đang tải
                        className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 flex items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaWarehouse className="mr-2" /> 
                        {(isLoading && receipts.length > 0) ? 'Đang gửi...' : 'Ghi Nhận Nhập Kho'}
                    </button>
                </form>
            </div>


            {/* PHẦN 2: BẢNG LỊCH SỬ NHẬN HÀNG */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-indigo-700">Lịch Sử Nhận Hàng Gần Đây</h2>

                {/* Thanh tìm kiếm và nút làm mới */}
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

                {/* Trạng thái tải cho bảng */}
                {isLoading && receipts.length > 0 && (
                    <div className="text-center py-4 text-gray-500 flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" /> Đang tải dữ liệu...
                    </div>
                )}

                {/* Bảng dữ liệu */}
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Mã Lô Hàng</th>
                                <th className="px-4 py-3">Nhà Cung Cấp</th>
                                <th className="px-4 py-3">Loại Nước</th>
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
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.supplier}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.waterType}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.deliveryPerson}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.receiptDate}</td>
                                    <td className="px-4 py-3">
                                        {/* Áp dụng style trạng thái từ props */}
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyles(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <select
                                            onChange={(e) => handleActionChange(e as React.ChangeEvent<HTMLSelectElement>, item)}
                                            className="border border-gray-300 rounded-md text-xs py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                                            disabled={isLoading}
                                            defaultValue=""
                                        >
                                            <option value="" disabled hidden>Chọn hành động</option>
                                            <option value="view">🔎 Xem chi tiết</option>
                                            {item.status === 'ĐÃ NHẬP' && <option value="qr">🖨️ Xuất QR Code</option>}
                                            {item.status === 'CHỜ XÁC NHẬN' && <option value="confirm">✅ Xác nhận nhập kho</option>}
                                            {item.status === 'CHỜ XÁC NHẬN' && <option value="cancel" className="text-red-600">🔥 Xóa/Hủy lô hàng</option>}
                                            {item.status !== 'CHỜ XÁC NHẬN' && item.status !== 'ĐÃ NHẬP' && item.status !== 'ĐÃ HỦY' && (
                                                <option value="" disabled className="text-gray-500 italic">Không có thao tác</option>
                                            )}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {/* Không tìm thấy dữ liệu */}
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
                                // Hiển thị QR Code
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
                            <button
                                onClick={handlePrintQrCode}
                                disabled={!qrModal.qrCodeImage || qrModal.isLoading}
                                className="px-4 py-2 mr-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                In QR Code
                            </button>
                            <button
                                onClick={() => setQrModal({ isOpen: false, lotCode: '', qrCodeImage: null, isLoading: false })}
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

export default WaterReceiptPageUI;