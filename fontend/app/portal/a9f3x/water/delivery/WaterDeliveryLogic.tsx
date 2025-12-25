"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { waterDeliveryApi } from './waterDeliveryApi';
import { DeliveryItem, TrashItem } from './WaterDeliveryPageUI';
import WaterDeliveryPageUI from './WaterDeliveryPageUI'; // Import UI component

export const useWaterDeliveryLogic = () => {
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
    const [trashDeliveries, setTrashDeliveries] = useState<TrashItem[]>([]);
    const [waterTypes, setWaterTypes] = useState<{id: string | number, name: string}[]>([]);
    const [departments, setDepartments] = useState<{id: string | number, name: string}[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);

    // --- State cho ConfirmModal ---
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "danger" | "warning" | "info";
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: () => {},
    });

    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    const initialFormState = useMemo(() => ({
        quantity: '',
        waterType: '',
        recipientName: '',
        department: '',
        deliveryTime: new Date().toISOString().slice(0, 16),
        content: ''
    }), []);

    const [formData, setFormData] = useState(initialFormState);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [typesRes, deptsRes, deliveriesRes] = await waterDeliveryApi.getInitialData();
            setWaterTypes(typesRes.data?.data ?? []);
            setDepartments(deptsRes.data?.data ?? []);
            
            const rawData = deliveriesRes.data?.data ?? [];
            const active = rawData.filter((d: any) => d.status_id !== 0 && d.status_id !== null).map((d: any) => ({
                id: d.delivery_id ?? "N/A",
                recipient: d.recipient_name ?? "Không rõ",
                dept: d.department_name ?? `Bộ phận ${d.dept_id ?? ""}`,
                waterType: d.product_name ?? `Sản phẩm ${d.product_id ?? ""}`,
                quantity: Number(d.quantity ?? 0),
                status: (d.status ?? "XỬ LÝ").toUpperCase(),
                date: d.delivery_time ?? "",
            }));

            const trash = rawData.filter((d: any) => d.status_id === 0).map((d: any) => ({
                id: d.delivery_id ?? "N/A",
                recipient: d.recipient_name ?? "N/A",
                waterType: d.product_name ?? "Nước uống",
                quantity: Number(d.quantity ?? 0),
                deletedAt: d.updated_at ? new Date(d.updated_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                daysLeft: 30 
            }));
            
            setDeliveries(active);
            setTrashDeliveries(trash);
        } catch (error) {
            setConfirmConfig({
                isOpen: true,
                title: "LỖI KẾT NỐI",
                message: "Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.",
                type: "danger",
                onConfirm: closeConfirm
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value ?? "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await waterDeliveryApi.createDelivery({ ...formData, delivery_id: "" });
            setFormData(initialFormState);
            await fetchData();
            setConfirmConfig({
                isOpen: true,
                title: "THÀNH CÔNG",
                message: "Đơn hàng đã được tạo thành công.",
                type: "info",
                onConfirm: closeConfirm
            });
        } catch (error) {
            setConfirmConfig({
                isOpen: true,
                title: "THẤT BẠI",
                message: "Có lỗi xảy ra khi tạo đơn hàng.",
                type: "danger",
                onConfirm: closeConfirm
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "XÁC NHẬN XÓA",
            message: "Bạn có chắc chắn muốn chuyển đơn hàng này vào thùng rác?",
            type: "warning",
            onConfirm: async () => {
                try {
                    await waterDeliveryApi.deleteDelivery(id);
                    await fetchData();
                } catch (error) {
                    console.error(error);
                }
                closeConfirm();
            }
        });
    };

    const handleRestore = async (id: string) => {
        try {
            await waterDeliveryApi.updateStatus(id, 1); 
            await fetchData();
            setConfirmConfig({
                isOpen: true,
                title: "KHÔI PHỤC",
                message: "Đã khôi phục đơn hàng thành công.",
                type: "info",
                onConfirm: closeConfirm
            });
        } catch (error) {
            console.error(error);
        }
    };

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(d => 
            d.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
            d.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [deliveries, searchTerm]);

    return {
        formData, isLoading, deliveries: filteredDeliveries, trashDeliveries,
        selectedOrder, searchTerm, waterTypes, departments, confirmConfig,
        setSearchTerm, setSelectedOrder, handleChange, handleSubmit, 
        handleDelete, handleRestore, closeConfirm
    };
};

// --- ĐÂY LÀ PHẦN QUAN TRỌNG: Component Wrapper ---
const WaterDeliveryLogic = () => {
    const logicProps = useWaterDeliveryLogic();
    
    // Trả về UI và truyền toàn bộ logic vào qua props
    return <WaterDeliveryPageUI  />;
};

export default WaterDeliveryLogic;