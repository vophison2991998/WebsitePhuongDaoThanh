"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import WaterDeliveryPageUI, { DeliveryItem } from './WaterDeliveryPageUI';
import { waterDeliveryApi } from './waterDeliveryApi';
import ConfirmModal from '@/components/ui/ConfirmModal';

export const useWaterDeliveryLogic = (initialData: DeliveryItem[] = []) => {
    // --- STATE CHO CONFIRM MODAL ---
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string;
        type: "danger" | "warning" | "info"; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: () => {} });

    // --- STATE DỮ LIỆU ---
    const [waterTypesData, setWaterTypesData] = useState<any[]>([]);
    const [deptsData, setDeptsData] = useState<any[]>([]);
    const [allDeliveries, setAllDeliveries] = useState<DeliveryItem[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        quantity: "1", waterType: "", recipientName: '',
        department: "", content: '',
        deliveryTime: new Date().toISOString().substring(0, 16),
    });

    // --- FETCH DATA ---
    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [resWater, resDepts, resDeliveries] = await waterDeliveryApi.getInitialData();

            const waterTypes = resWater.data.data || [];
            const depts = resDepts.data.data || [];
            const deliveries = resDeliveries.data.data || [];

            setWaterTypesData(waterTypes);
            setDeptsData(depts);

            // Map dữ liệu từ API vào giao diện
            const mapped = deliveries.map((item: any) => ({
                id: item.delivery_id,
                recipient: item.recipient_name,
                dept: item.department_name,
                quantity: item.quantity,
                waterType: item.product_name,
                status: item.status, 
                date: new Date(item.delivery_time).toLocaleDateString('vi-VN'),
                content: item.note
            }));
            setAllDeliveries(mapped);

            // Auto-select giá trị mặc định cho dropdown nếu chưa có
            if (waterTypes.length > 0 || depts.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    waterType: prev.waterType || (waterTypes[0]?.product_id || waterTypes[0]?.id || ""),
                    department: prev.department || (depts[0]?.id || "")
                }));
            }
            
            // Xóa thông báo lỗi nếu tải lại thành công
            if (message?.text.includes('Phiên')) setMessage(null);

        } catch (e: any) {
            console.error("Lỗi Fetch Data:", e);
            if (e.response?.status === 401) {
                setMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn! Vui lòng tải lại trang hoặc đăng nhập lại.' });
            } else {
                setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
            }
        } finally {
            setIsLoading(false);
        }
    }, [message?.text]);

    useEffect(() => { 
        fetchAllData(); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy 1 lần khi mount

    // --- ACTIONS ---
    const handleDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "Xác nhận xóa",
            message: `Bạn có chắc chắn muốn xóa đơn hàng ${id}?`,
            type: "danger",
            onConfirm: async () => {
                try {
                    await waterDeliveryApi.deleteDelivery(id);
                    setAllDeliveries(prev => prev.filter(item => item.id !== id));
                    setMessage({ type: 'success', text: 'Đã xóa đơn hàng thành công!' });
                } catch (err) { 
                    setMessage({ type: 'error', text: 'Lỗi khi xóa đơn hàng.' }); 
                }
                setConfirmConfig(p => ({ ...p, isOpen: false }));
            }
        });
    };

    const handleUpdateStatus = (id: string, currentStatus: string) => {
        const isCompleted = currentStatus.includes('Hoàn thành');
        const newStatusId = isCompleted ? 1 : 2; // Toggle 1 <-> 2
        const statusLabel = newStatusId === 2 ? "Hoàn thành" : "Đang xử lý";

        setConfirmConfig({
            isOpen: true,
            title: "Cập nhật trạng thái",
            message: `Chuyển đơn ${id} sang "${statusLabel}"?`,
            type: "info",
            onConfirm: async () => {
                try {
                    await waterDeliveryApi.updateStatus(id, newStatusId);
                    await fetchAllData();
                    setMessage({ type: 'success', text: 'Cập nhật thành công!' });
                } catch (err) { 
                    setMessage({ type: 'error', text: 'Lỗi cập nhật trạng thái.' }); 
                }
                setConfirmConfig(p => ({ ...p, isOpen: false }));
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.recipientName) {
            setMessage({ type: 'error', text: 'Vui lòng nhập tên người nhận.' });
            return;
        }

        setIsLoading(true);
        try {
            await waterDeliveryApi.createDelivery(formData);
            await fetchAllData();
            setMessage({ type: 'success', text: `Tạo đơn hàng mới thành công!` });
            setFormData(prev => ({ ...prev, recipientName: '', content: '' })); 
        } catch (err: any) { 
            const errorMsg = err.response?.status === 401 ? 'Hết hạn phiên làm việc.' : 'Lỗi lưu đơn hàng.';
            setMessage({ type: 'error', text: errorMsg }); 
        } finally { 
            setIsLoading(false); 
        }
    };

    // --- SEARCH LOGIC ---
    const filteredDeliveries = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return allDeliveries.filter(d => 
            d.recipient.toLowerCase().includes(term) || 
            d.id.toLowerCase().includes(term) ||
            d.dept.toLowerCase().includes(term)
        );
    }, [allDeliveries, searchTerm]);

    return {
        formData, isLoading, message, deliveries: filteredDeliveries,
        selectedOrder, searchTerm, waterTypes: waterTypesData, departments: deptsData,
        confirmConfig, setConfirmConfig, 
        handleChange: (e: any) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })),
        handleSubmit, setSearchTerm, setSelectedOrder, handleUpdateStatus, handleDelete,
        getStatusColor: (status: string) => {
            const s = status?.toLowerCase() || '';
            if (s.includes('xử lý')) return 'bg-blue-100 text-blue-800 border-blue-300';
            if (s.includes('hoàn thành')) return 'bg-green-100 text-green-800 border-green-300';
            return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
};

const WaterDeliveryLogic: React.FC = () => {
    const logic = useWaterDeliveryLogic();
    
    return (
        <>
            <WaterDeliveryPageUI 
                {...logic} 
                // Đồng bộ hóa tên trường từ API Object sang UI Props
                waterTypes={logic.waterTypes.map(t => ({ id: t.product_id || t.id, name: t.name }))}
                departments={logic.departments.map(d => ({ id: d.id, name: d.name }))}
            />

            <ConfirmModal 
                isOpen={logic.confirmConfig.isOpen}
                title={logic.confirmConfig.title}
                message={logic.confirmConfig.message}
                type={logic.confirmConfig.type}
                onConfirm={logic.confirmConfig.onConfirm}
                onCancel={() => logic.setConfirmConfig(p => ({ ...p, isOpen: false }))}
            />
        </>
    );
};

export default WaterDeliveryLogic;