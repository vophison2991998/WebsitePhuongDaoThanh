"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/ToastContext";
import WaterReceiptPageUI from './WaterReceiptPageUI';
import { waterReceiptApi, TrashItem } from './waterReceiptApi';
import ConfirmModal from '@/components/ui/ConfirmModal'; // Đảm bảo đường dẫn đúng

const WaterReceiptLogic: React.FC = () => {
    const { success, error, delete: deleteToast } = useToast();
    
    // --- STATE QUẢN LÝ MODAL XÁC NHẬN ---
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "danger" | "warning" | "info";
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => {},
    });

    // --- CÁC TRẠNG THÁI KHÁC ---
    const [waterTypes, setWaterTypes] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTypesLoading, setIsTypesLoading] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);

    const [formData, setFormData] = useState({
        quantity: 50 as number | '',
        receiptDate: new Date().toISOString().substring(0, 10),
        supplier: '',
        deliveryPerson: '',
        waterType: '',
    });

    const [qrModal, setQrModal] = useState({
        isOpen: false,
        lotCode: '',
        qrCodeImage: null as string | null,
        isLoading: false,
    });

    // --- LOGIC FETCH DỮ LIỆU (Giữ nguyên từ code cũ) ---
    const fetchReceipts = useCallback(async (query = '') => {
        setIsLoading(true);
        try {
            const data = await waterReceiptApi.getReceipts(query);
            const formatted = (Array.isArray(data) ? data : []).map((item: any) => ({
                id: item.id,
                lot_code: item.lot_code,
                supplier: item.supplier,
                waterType: item.water_type,
                quantity: item.quantity,
                receiptDate: item.receipt_date,
                status: item.status,
                status_code: item.status_code,
                deliveryPerson: item.delivery_person
            }));
            setReceipts(formatted);
        } catch (err: any) {
            error('Không thể tải danh sách lô hàng.');
        } finally {
            setIsLoading(false);
        }
    }, [error]);

    const fetchTrash = useCallback(async () => {
        try {
            const data = await waterReceiptApi.getTrash();
            setTrashItems(data);
        } catch (err) {
            console.error("Lỗi tải thùng rác:", err);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsTypesLoading(true);
            try {
                const [types] = await Promise.all([
                    waterReceiptApi.getWaterTypes(),
                    fetchReceipts(),
                    fetchTrash()
                ]);
                setWaterTypes(types);
                if (types.length > 0) {
                    setFormData(p => ({ ...p, waterType: types[0].product_id || types[0].id }));
                }
            } catch (err) {
                error("Lỗi khởi tạo hệ thống.");
            } finally {
                setIsTypesLoading(false);
            }
        };
        loadInitialData();
    }, [fetchReceipts, fetchTrash, error]);

    // --- XỬ LÝ CÁC THAO TÁC VỚI CONFIRM MODAL ---
    const handleActionChange = async (action: string, item: any) => {
        switch (action) {
            case 'qr':
                setQrModal({ isOpen: true, lotCode: item.lot_code, qrCodeImage: null, isLoading: true });
                const res = await waterReceiptApi.getQrCode(item.id);
                const imgData = typeof res === 'string' ? res : res?.qrCodeImage;
                setQrModal(p => ({ 
                    ...p, 
                    qrCodeImage: imgData?.startsWith('data:') ? imgData : `data:image/png;base64,${imgData}`, 
                    isLoading: false 
                }));
                break;

            case 'confirm':
                setConfirmConfig({
                    isOpen: true,
                    title: "Duyệt Nhập Kho",
                    message: `Bạn có chắc chắn muốn xác nhận lô hàng ${item.lot_code} đã vào kho thành công?`,
                    type: "info",
                    onConfirm: async () => {
                        setIsLoading(true);
                        try {
                            await waterReceiptApi.updateStatus(item.id, 'COMPLETED');
                            success(`Lô hàng ${item.lot_code} đã được duyệt.`);
                            await fetchReceipts(searchTerm);
                        } catch (err) { error("Duyệt lô hàng thất bại."); }
                        finally { setIsLoading(false); }
                    }
                });
                break;

            case 'cancel':
                setConfirmConfig({
                    isOpen: true,
                    title: "Xóa Lô Hàng",
                    message: `Chuyển lô hàng ${item.lot_code} vào thùng rác? Bạn có thể khôi phục trong vòng 30 ngày.`,
                    type: "danger",
                    onConfirm: async () => {
                        setIsLoading(true);
                        try {
                            await waterReceiptApi.deleteReceipt(item.id);
                            deleteToast(`Đã chuyển vào thùng rác.`);
                            await Promise.all([fetchReceipts(searchTerm), fetchTrash()]);
                        } catch (err) { error("Không thể xóa lô hàng."); }
                        finally { setIsLoading(false); }
                    }
                });
                break;
        }
    };

    const handleRestore = (id: number | string) => {
        setConfirmConfig({
            isOpen: true,
            title: "Khôi Phục Dữ Liệu",
            message: "Bạn muốn đưa lô hàng này trở lại danh sách hoạt động?",
            type: "warning",
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    await waterReceiptApi.restoreReceipt(id);
                    success("Khôi phục thành công.");
                    await Promise.all([fetchReceipts(searchTerm), fetchTrash()]);
                } catch (err) { error("Lỗi khi khôi phục."); }
                finally { setIsLoading(false); }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.waterType) return error("Vui lòng chọn loại nước.");
        setIsLoading(true);
        try {
            await waterReceiptApi.createReceipt(formData as any);
            success("Tạo lô hàng mới thành công.");
            setFormData(p => ({ ...p, supplier: '', deliveryPerson: '', quantity: 50 }));
            await fetchReceipts(searchTerm);
        } catch (err: any) {
            error(err.response?.data?.message || "Lỗi khi lưu lô hàng.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <WaterReceiptPageUI 
                formData={formData}
                receipts={receipts}
                waterTypes={waterTypes}
                searchTerm={searchTerm}
                isLoading={isLoading}
                isTypesLoading={isTypesLoading}
                qrModal={qrModal}
                trashItems={trashItems}
                isTrashOpen={isTrashOpen}
                setIsTrashOpen={setIsTrashOpen}
                setSearchTerm={setSearchTerm}
                setQrModal={setQrModal}
                handleChange={(e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))}
                handleSubmit={handleSubmit}
                handleActionChange={handleActionChange}
                handleRestore={handleRestore}
                fetchReceipts={fetchReceipts}
                getStatusStyles={(status_code) => {
                    const code = status_code?.toUpperCase();
                    if (code === 'COMPLETED') return 'bg-green-100 text-green-800 border-green-200';
                    if (code === 'PROCESSING') return 'bg-blue-100 text-blue-800 border-blue-200';
                    return 'bg-gray-100 text-gray-800 border-gray-200';
                }}
            />

            {/* MODAL XÁC NHẬN TOÀN CỤC */}
            <ConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))}
            />
        </>
    );
};

export default WaterReceiptLogic;