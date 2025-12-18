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

// Định nghĩa Props cho UI Component
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
    isLoading: boolean; 
    isTypesLoading: boolean; 
    qrModal: QrModalState; 
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setQrModal: React.Dispatch<React.SetStateAction<QrModalState>>; 
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    // Chỉnh sửa kiểu dữ liệu nhận vào từ UI nút bấm
    handleActionChange: (e: { target: { value: string } }, item: ReceiptLot) => void;
    fetchReceipts: (searchQuery?: string) => Promise<void>;
    getStatusStyles: (status: string) => string;
}

const API_BASE_URL = 'http://localhost:5000/api/receipts';
const MASTER_API_URL = 'http://localhost:5000/api/master/water-types'; 

const WaterReceiptLogic: React.FC = () => {

    const { success, error, warning, info, delete: deleteToast } = useToast();
    const [waterTypes, setWaterTypes] = useState<WaterType[]>([]); 
    const [receipts, setReceipts] = useState<ReceiptLot[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTypesLoading, setIsTypesLoading] = useState(true);

    const [formData, setFormData] = useState<WaterReceiptUIProps['formData']>({
        quantity: 50,
        receiptDate: new Date().toISOString().substring(0, 10), 
        supplier: '',
        deliveryPerson: '',
        waterType: '', 
    });

    const [qrModal, setQrModal] = useState<QrModalState>({
        isOpen: false,
        lotCode: '',
        qrCodeImage: null, 
        isLoading: false,
    });

    // 1. Tải Loại Nước
    const fetchWaterTypes = useCallback(async () => {
        setIsTypesLoading(true);
        try {
            const response = await axios.get(MASTER_API_URL);
            const typesData = Array.isArray(response.data) ? response.data : response.data.data;
            if (typesData && Array.isArray(typesData)) {
                setWaterTypes(typesData);
                if (typesData.length > 0) {
                    setFormData(prev => ({ ...prev, waterType: prev.waterType || typesData[0].name }));
                }
            }
        } catch (err) {
            console.error("Lỗi khi tải loại nước:", err);
            setWaterTypes([]); 
        } finally {
            setIsTypesLoading(false);
        }
    }, []);

    // 2. Tải Danh sách Lô hàng
    const fetchReceipts = useCallback(async (searchQuery = '') => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}`, { params: { search: searchQuery } });
            const rawData = Array.isArray(response.data) ? response.data : response.data.data || [];
            const formattedData: ReceiptLot[] = rawData.map((item: any) => ({
                id: item.id,
                lot_code: item.lot_code,
                supplier: item.supplier,
                deliveryPerson: item.delivery_person,
                waterType: item.water_type, 
                quantity: item.quantity,
                receiptDate: item.receipt_date.substring(0, 10), 
                status: item.status, 
            }));
            setReceipts(formattedData);
        } catch (err) {
            error('Không thể tải dữ liệu lô hàng.');
        } finally {
            setIsLoading(false);
        }
    }, [error]);

    // 3. Tạo lô hàng mới
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const quantityValue = Number(formData.quantity);

        if (!formData.supplier || !formData.deliveryPerson || !quantityValue || !formData.waterType) {
            warning('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post(API_BASE_URL, { ...formData, quantity: quantityValue, water_type: formData.waterType });
            success(response.data.message || "Đã tạo lô hàng thành công.");
            await fetchReceipts();
            setFormData(prev => ({ ...prev, supplier: '', deliveryPerson: '', quantity: 50 }));
        } catch (err: any) {
            error(err.response?.data?.message || 'Lỗi khi tạo lô hàng.');
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Cập nhật trạng thái
    const handleUpdateStatus = async (lotId: number, newStatus: string, actionName: string) => {
        try {
            setIsLoading(true);
            await axios.put(`${API_BASE_URL}/${lotId}/status`, { status: newStatus });
            success(`${actionName} thành công.`);
            fetchReceipts(searchTerm);
        } catch (err: any) {
            error(`Lỗi khi ${actionName}.`);
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Xóa lô hàng (Đã mở khóa xóa bất kỳ lúc nào)
    const handleDeleteLot = async (lotId: number, lotCode: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn XÓA vĩnh viễn lô hàng ${lotCode}?`)) return;
        
        try {
            setIsLoading(true);
            const response = await axios.delete(`${API_BASE_URL}/${lotId}`);
            deleteToast(response.data.message || `Đã xóa lô hàng ${lotCode}.`);
            fetchReceipts(searchTerm);
        } catch (err: any) {
            error(err.response?.data?.message || `Lỗi khi xóa lô hàng.`);
        } finally {
            setIsLoading(false);
        }
    };

    // 6. Tạo QR
    const handleGenerateQrCode = async (lotId: number, lotCode: string) => {
        setQrModal({ isOpen: true, lotCode: lotCode, qrCodeImage: null, isLoading: true }); 
        try {
            const response = await axios.get(`${API_BASE_URL}/${lotId}/qrcode`);
            const base64Image = `data:image/png;base64,${response.data.qrCodeImage}`;
            setQrModal(prev => ({ ...prev, qrCodeImage: base64Image, isLoading: false }));
        } catch (err: any) {
            error('Không thể tạo mã QR.');
            setQrModal({ isOpen: false, lotCode: '', qrCodeImage: null, isLoading: false }); 
        }
    };

    // 7. Xử lý hành động (Đã chỉnh sửa logic Xóa)
    const handleActionChange = (e: { target: { value: string } }, item: ReceiptLot) => {
        const action = e.target.value;

        switch (action) {
            case 'view':
                info(`Xem chi tiết: ${item.lot_code}`);
                break;
            case 'qr':
                handleGenerateQrCode(item.id, item.lot_code);
                break;
            case 'confirm':
                handleUpdateStatus(item.id, 'ĐÃ NHẬP', 'Xác nhận nhập kho');
                break;
            case 'cancel':
                // Bỏ điều kiện check status 'CHỜ XÁC NHẬN' để có thể xóa bất kỳ lúc nào
                handleDeleteLot(item.id, item.lot_code);
                break;
            default:
                break;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ĐÃ NHẬP': return 'bg-green-100 text-green-800';
            case 'CHỜ XÁC NHẬN': return 'bg-yellow-100 text-yellow-800';
            case 'ĐÃ HỦY': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' ? (value === '' ? '' : parseInt(value)) : value
        }));
    };

    useEffect(() => {
        fetchWaterTypes(); 
        fetchReceipts();
    }, [fetchWaterTypes, fetchReceipts]);

    const uiProps: WaterReceiptUIProps = {
        formData, receipts, waterTypes, searchTerm, isLoading, isTypesLoading,
        qrModal, setSearchTerm, setQrModal, handleChange, handleSubmit,
        handleActionChange, fetchReceipts, getStatusStyles
    };

    return <WaterReceiptPageUI {...uiProps} />;
};

export default WaterReceiptLogic;