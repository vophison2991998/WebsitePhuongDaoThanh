"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { waterDeliveryApi } from './waterDeliveryApi';
import { DeliveryItem, TrashItem } from './WaterDeliveryPageUI';
import WaterDeliveryPageUI from './WaterDeliveryPageUI';

export const useWaterDeliveryLogic = () => {
    const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
    const [trashDeliveries, setTrashDeliveries] = useState<TrashItem[]>([]);
    const [waterTypes, setWaterTypes] = useState<{id: string | number, name: string}[]>([]);
    const [departments, setDepartments] = useState<{id: string | number, name: string}[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);

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

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Lấy dữ liệu khởi tạo (Types, Depts, Active Deliveries)
            const [typesRes, deptsRes, deliveriesRes] = await waterDeliveryApi.getInitialData();
            
            // 2. Lấy riêng danh sách thùng rác
            const trashRes = await waterDeliveryApi.getTrashData();

            setWaterTypes(typesRes.data?.data ?? []);
            setDepartments(deptsRes.data?.data ?? []);
            
            // Map dữ liệu đơn hàng đang hoạt động
            const active = (deliveriesRes.data?.data ?? []).map((d: any) => ({
                id: d.delivery_id,
                recipient: d.recipient_name,
                dept: d.department_name,
                waterType: d.product_name,
                quantity: Number(d.quantity),
                status: (d.status_name || "XỬ LÝ").toUpperCase(),
                date: d.delivery_time,
            }));

            // Map dữ liệu thùng rác (đúng các trường từ backend mới)
            const trash = (trashRes.data?.data ?? []).map((d: any) => ({
                id: d.delivery_id,
                recipient: d.recipient_name,
                waterType: d.product_name,
                quantity: Number(d.quantity),
                deletedAt: new Date(d.deleted_at).toLocaleDateString('vi-VN'),
                daysLeft: d.days_left, // Lấy từ kết quả CEIL của SQL
                expiresAt: d.expires_at
            }));
            
            setDeliveries(active);
            setTrashDeliveries(trash);
        } catch (error: any) {
            setConfirmConfig({
                isOpen: true,
                title: "LỖI HỆ THỐNG",
                message: "Không thể kết nối đến máy chủ: " + error.message,
                type: "danger",
                onConfirm: closeConfirm
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- ACTIONS ---

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await waterDeliveryApi.createDelivery({ ...formData });
            setFormData(initialFormState);
            await fetchData();
            setConfirmConfig({
                isOpen: true,
                title: "THÀNH CÔNG",
                message: "Đơn hàng đã được ghi nhận.",
                type: "info",
                onConfirm: closeConfirm
            });
        } catch (error) {
            setConfirmConfig({
                isOpen: true,
                title: "THẤT BẠI",
                message: "Không thể tạo đơn hàng. Vui lòng kiểm tra lại.",
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
            title: "XÁC NHẬN XÓA TẠM THỜI",
            message: "Đơn hàng sẽ được chuyển vào thùng rác và tự hủy sau 30 ngày.",
            type: "warning",
            onConfirm: async () => {
                try {
                    await waterDeliveryApi.deleteDelivery(id);
                    await fetchData();
                } catch (error) {
                    console.error("Delete error:", error);
                }
                closeConfirm();
            }
        });
    };

    const handleRestore = async (id: string) => {
        try {
            await waterDeliveryApi.restoreDelivery(id); // Sử dụng API restore mới
            await fetchData();
            setConfirmConfig({
                isOpen: true,
                title: "KHÔI PHỤC",
                message: "Đơn hàng đã quay trở lại danh sách hoạt động.",
                type: "info",
                onConfirm: closeConfirm
            });
        } catch (error) {
            console.error("Restore error:", error);
        }
    };

    const handlePermanentlyDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "XÓA VĨNH VIỄN",
            message: "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?",
            type: "danger",
            onConfirm: async () => {
                try {
                    await waterDeliveryApi.permanentlyDelete(id);
                    await fetchData();
                } catch (error) {
                    console.error("Hard delete error:", error);
                }
                closeConfirm();
            }
        });
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
        handleDelete, handleRestore, handlePermanentlyDelete, closeConfirm
    };
};

const WaterDeliveryLogic = () => {
    const logicProps = useWaterDeliveryLogic();
    // Đảm bảo truyền logicProps vào UI component
    return <WaterDeliveryPageUI/>;
};

export default WaterDeliveryLogic;