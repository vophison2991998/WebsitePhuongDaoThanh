"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from "@/components/ui/ToastContext";
// ❗️ Import UI Component
import WaterReceiptPageUI from './WaterReceiptPageUI';

interface WaterType {
    id: number;
    name: string;
}

interface ReceiptLot {
    id: number;
    lot_code: string;
    supplier: string;
    deliveryPerson: string;
    waterType: string; 
    quantity: number;
    receiptDate: string;
    status: 'CHỜ XÁC NHẬN' | 'ĐÃ NHẬP' | 'ĐÃ HỦY'; 
}

interface QrModalState {
    isOpen: boolean;
    lotCode: string;
    qrCodeImage: string | null; 
    isLoading: boolean;
}

// Định nghĩa Props cho UI Component (ĐÃ ĐỒNG BỘ KIỂU DỮ LIỆU)
// Export interface này là cần thiết nếu bạn muốn sử dụng nó ở nơi khác.
export interface WaterReceiptUIProps {
    formData: { 
        quantity: number | ''; 
        receiptDate: string; 
        supplier: string; 
        deliveryPerson: string; 
        waterType: string;
    };
    receipts: ReceiptLot[];
    waterTypes: WaterType[]; 
    searchTerm: string;
    isLoading: boolean; // Trạng thái tải chung (hoặc cho bảng)
    isTypesLoading: boolean; // Trạng thái tải riêng cho Loại Nước
    qrModal: QrModalState; 
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setQrModal: React.Dispatch<React.SetStateAction<QrModalState>>; 
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleActionChange: (e: React.ChangeEvent<HTMLSelectElement>, item: ReceiptLot) => void;
    fetchReceipts: (searchQuery?: string) => Promise<void>;
    getStatusStyles: (status: string) => string;
}


const API_BASE_URL = 'http://localhost:5000/api/receipts';
const MASTER_API_URL = 'http://localhost:5000/api/master/water-types'; 

// -----------------------------------------------------------
// 2. LOGIC COMPONENT (CONTAINER)
// -----------------------------------------------------------

const WaterReceiptLogic: React.FC = () => {

    const { success, error, warning, info, delete: deleteToast } = useToast();

    const [waterTypes, setWaterTypes] = useState<WaterType[]>([]); 
    
    // Sử dụng kiểu dữ liệu đã định nghĩa
    const [formData, setFormData] = useState<WaterReceiptUIProps['formData']>({
        quantity: 50,
        // Dùng local date string để tránh vấn đề múi giờ khi gửi lên input type="date"
        receiptDate: new Date().toISOString().substring(0, 10), 
        supplier: '',
        deliveryPerson: '',
        waterType: '', 
    });

    const [receipts, setReceipts] = useState<ReceiptLot[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTypesLoading, setIsTypesLoading] = useState(true); // Trạng thái tải riêng cho loại nước

    const [qrModal, setQrModal] = useState<QrModalState>({
        isOpen: false,
        lotCode: '',
        qrCodeImage: null, 
        isLoading: false,
    });


    const fetchWaterTypes = useCallback(async () => {
        setIsTypesLoading(true);
        try {
            const response = await axios.get(MASTER_API_URL);
            
            // 💡 SỬA LỖI LOẠI NƯỚC: Kiểm tra cấu trúc API trả về { message: "...", data: [...] }
            const typesData = Array.isArray(response.data) 
                ? response.data 
                : response.data.data;

            if (!typesData || !Array.isArray(typesData)) {
                 throw new Error("Dữ liệu loại nước không hợp lệ.");
            }

            setWaterTypes(typesData);
            
            // Đặt giá trị mặc định chỉ khi chưa chọn và có dữ liệu
            if (typesData.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    // Nếu chưa có waterType nào được chọn (giá trị khởi tạo là rỗng), đặt mặc định
                    waterType: prev.waterType || typesData[0].name 
                }));
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách loại nước:", err);
            warning('Không thể tải danh sách Loại Nước. Vui lòng kiểm tra API Master.');
            setWaterTypes([]); 
        } finally {
            setIsTypesLoading(false);
        }
    }, [warning]); // Thêm warning vào dependency array

    // HÀM LẤY LỊCH SỬ LÔ HÀNG
    const fetchReceipts = useCallback(async (searchQuery = '') => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}`, {
                params: { search: searchQuery }
            });
            
            // Xử lý dữ liệu trả về (Nếu API trả về { data: [...] } thì cần xử lý)
            const rawData = Array.isArray(response.data) ? response.data : response.data.data || [];

            const formattedData: ReceiptLot[] = rawData.map((item: any) => ({
                id: item.id,
                lot_code: item.lot_code,
                supplier: item.supplier,
                deliveryPerson: item.delivery_person,
                waterType: item.water_type, 
                quantity: item.quantity,
                // Đảm bảo chỉ lấy phần ngày (YYYY-MM-DD)
                receiptDate: item.receipt_date.substring(0, 10), 
                status: item.status as 'CHỜ XÁC NHẬN' | 'ĐÃ NHẬP' | 'ĐÃ HỦY', 
            }));

            setReceipts(formattedData);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu:", err);
            error('Không thể tải dữ liệu lô hàng. Vui lòng kiểm tra Server.');
        } finally {
            setIsLoading(false);
        }
    }, [error]); // Thêm error vào dependency array

    // HÀM SUBMIT FORM TẠO LÔ HÀNG
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quantityValue = typeof formData.quantity === 'string' 
            ? parseInt(formData.quantity) 
            : formData.quantity;

        if (!formData.supplier || !formData.deliveryPerson || (quantityValue === 0 || !quantityValue) || !formData.waterType) {
            warning('Vui lòng điền đầy đủ Loại Nước, Nhà Cung Cấp, Người Giao Hàng và Số Lượng hợp lệ.');
            return;
        }

        try {
            setIsLoading(true);
            
            const dataToSend = {
                ...formData,
                quantity: quantityValue, // Gửi giá trị số
                water_type: formData.waterType, // Chuyển sang snake_case nếu Backend mong muốn
                // Giữ lại receiptDate
            };

            const response = await axios.post(API_BASE_URL, dataToSend);

            success(response.data.message || `Đã ghi nhận lô hàng ${response.data.data.lot_code} vào kho.`);

            await fetchReceipts(); // Cập nhật lại danh sách

            // Reset form
            setFormData(prev => ({
                quantity: 50,
                receiptDate: new Date().toISOString().substring(0, 10),
                supplier: '',
                deliveryPerson: '',
                waterType: prev.waterType, // Giữ lại Loại Nước đã chọn
            }));

        } catch (err: any) {
            console.error("Lỗi khi tạo lô hàng:", err);
            const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi tạo lô hàng. Vui lòng thử lại.';
            error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // HÀM CẬP NHẬT TRẠNG THÁI (Xác nhận/Hủy)
    const handleUpdateStatus = async (lotId: number, newStatus: 'CHỜ XÁC NHẬN' | 'ĐÃ NHẬP' | 'ĐÃ HỦY', actionName: string) => {
        try {
            setIsLoading(true);
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

    // HÀM XÓA LÔ HÀNG
    const handleDeleteLot = async (lotId: number, lotCode: string) => {
        try {
            setIsLoading(true);
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

    // HÀM TẠO MÃ QR CODE
    const handleGenerateQrCode = async (lotId: number, lotCode: string) => {
        // Mở modal, xóa hình cũ và bắt đầu tải
        setQrModal({ isOpen: true, lotCode: lotCode, qrCodeImage: null, isLoading: true }); 

        try {
            const response = await axios.get(`${API_BASE_URL}/${lotId}/qrcode`);
            // Giả định Server trả về Base64 String trong trường 'qrCodeImage'
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
            // Đóng modal và reset trạng thái nếu lỗi
            setQrModal({ isOpen: false, lotCode: '', qrCodeImage: null, isLoading: false }); 
        }
    };

    // HÀM XỬ LÝ HÀNH ĐỘNG TRONG BẢNG
    const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>, item: ReceiptLot) => {
        const action = e.target.value;
        e.target.value = ''; // Reset giá trị select ngay lập tức

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
                    // Cần xác nhận trước khi xóa trong thực tế
                    // Ví dụ: if (window.confirm(`Bạn có chắc chắn muốn XÓA lô hàng ${item.lot_code} không?`)) {
                    handleDeleteLot(item.id, item.lot_code);
                    // }
                } else {
                    warning(`Chỉ được phép xóa các lô hàng đang ở trạng thái "CHỜ XÁC NHẬN". Trạng thái hiện tại: "${item.status}".`);
                }
                break;
            default:
                break;
        }
    };

    // HÀM TRẢ VỀ STYLE CHO TRẠNG THÁI
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ĐÃ NHẬP': return 'bg-green-100 text-green-800';
            case 'CHỜ XÁC NHẬN': return 'bg-yellow-100 text-yellow-800';
            case 'ĐÃ HỦY': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // HÀM CHUNG XỬ LÝ THAY ĐỔI FORM
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            // Xử lý quantity: Nếu giá trị rỗng, set là '', nếu không thì parse sang số.
            [name]: name === 'quantity' ? (value === '' ? '' : parseInt(value)) : value
        }));
    };


    // -----------------------------------------------------------
    // 4. LIFECYCLE VÀ HOOKS
    // -----------------------------------------------------------

    useEffect(() => {
        // Tải danh sách loại nước trước (vì cần cho form)
        fetchWaterTypes(); 
        // Tải danh sách lô hàng
        fetchReceipts();
    }, [fetchWaterTypes, fetchReceipts]);

    useEffect(() => {
        // Debounce cho tìm kiếm (Chỉ tìm kiếm sau 500ms dừng gõ)
        const delayDebounceFn = setTimeout(() => {
            fetchReceipts(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchReceipts]);


    // Prop object để truyền xuống UI Component
    const uiProps: WaterReceiptUIProps = {
        formData,
        receipts,
        waterTypes, 
        searchTerm,
        isLoading,
        isTypesLoading,
        qrModal,
        setSearchTerm,
        setQrModal, 
        handleChange,
        handleSubmit,
        handleActionChange,
        fetchReceipts,
        getStatusStyles
    };

    return <WaterReceiptPageUI {...uiProps} />;
};

export default WaterReceiptLogic;