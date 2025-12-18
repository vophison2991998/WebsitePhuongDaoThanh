"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import WaterDeliveryPageUI, { 
    DeliveryItem 
} from './WaterDeliveryPageUI';

// --- Cấu hình API Endpoint ---
const API_BASE = 'http://localhost:5000/api';
const MASTER_WATER_URL = `${API_BASE}/master/water-types`;
const DEPARTMENTS_URL = `${API_BASE}/departments`;
const DELIVERY_API_URL = `${API_BASE}/deliveries`;

interface MasterEntry {
    id: string | number;
    name: string;
    product_id?: string; 
}

export const useWaterDeliveryLogic = (initialData: DeliveryItem[] = []) => {
    const [waterTypesData, setWaterTypesData] = useState<MasterEntry[]>([]);
    const [deptsData, setDeptsData] = useState<MasterEntry[]>([]);
    const [allDeliveries, setAllDeliveries] = useState<DeliveryItem[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        quantity: "1", 
        waterType: "", 
        recipientName: '',
        department: "", 
        content: '',
        deliveryTime: new Date().toISOString().substring(0, 16),
    });

    // --- 1. FETCH DỮ LIỆU ---
    const fetchAllData = useCallback(async () => {
        try {
            const [resWater, resDepts, resDeliveries] = await Promise.all([
                axios.get(MASTER_WATER_URL),
                axios.get(DEPARTMENTS_URL),
                axios.get(DELIVERY_API_URL)
            ]);

            const wData = resWater.data.data || [];
            const dData = resDepts.data.data || [];
            setWaterTypesData(wData);
            setDeptsData(dData);

            const mapped = (resDeliveries.data.data || []).map((item: any) => ({
                id: item.delivery_id,
                recipient: item.recipient_name,
                dept: item.department_name,
                quantity: item.quantity,
                waterType: item.product_name,
                status: item.status || 'Chờ giao',
                date: new Date(item.delivery_time).toLocaleDateString('vi-VN'),
                content: item.note
            }));
            setAllDeliveries(mapped);

            if (wData.length > 0 && dData.length > 0 && !formData.waterType) {
                setFormData(prev => ({
                    ...prev,
                    waterType: wData[0].product_id || wData[0].id,
                    department: dData[0].id
                }));
            }
        } catch (e) {
            console.error("Lỗi tải dữ liệu:", e);
        }
    }, [formData.waterType]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- 2. TẠO MỚI ĐƠN HÀNG ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const orderId = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const payload = {
                delivery_id: orderId,
                recipient_name: formData.recipientName,
                dept_id: formData.department,
                product_id: formData.waterType,
                quantity: parseInt(formData.quantity),
                delivery_time: formData.deliveryTime,
                note: formData.content,
                qr_code_data: orderId,
                status: 'Chờ giao'
            };

            const response = await axios.post(DELIVERY_API_URL, payload);
            if (response.data.success) {
                await fetchAllData();
                setMessage({ type: 'success', text: `Đã tạo đơn ${orderId} thành công!` });
                setFormData(prev => ({ ...prev, recipientName: '', content: '' }));
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Lỗi khi lưu đơn hàng.' });
        } finally { setIsLoading(false); }
    };

    // --- 3. CẬP NHẬT TRẠNG THÁI ---
    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const response = await axios.patch(`${DELIVERY_API_URL}/${id}/status`, {
                status: newStatus
            });
            
            if (response.data.success) {
                setAllDeliveries(prev => 
                    prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
                );
                setMessage({ type: 'success', text: 'Cập nhật trạng thái thành công!' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Không thể cập nhật trạng thái.' });
        }
    };

    // --- 4. XÓA ĐƠN HÀNG ---
    const handleDelete = async (id: string) => {

        try {
            const response = await axios.delete(`${DELIVERY_API_URL}/${id}`);
            if (response.data.success) {
                setAllDeliveries(prev => prev.filter(item => item.id !== id));
                setMessage({ type: 'success', text: 'Đã xóa đơn hàng thành công!' });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || "Không thể xóa đơn hàng.";
            setMessage({ type: 'error', text: errorMsg });
        }
    };

    // --- 5. XỬ LÝ HIỂN THỊ ---
    const filteredDeliveries = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return allDeliveries.filter(d =>
            d.recipient.toLowerCase().includes(term) || d.id.toLowerCase().includes(term)
        );
    }, [allDeliveries, searchTerm]);

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('đang giao')) return 'bg-blue-100 text-blue-800 border-blue-300';
        if (s.includes('chờ giao')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        if (s.includes('đã giao')) return 'bg-green-100 text-green-800 border-green-300';
        if (s.includes('hủy')) return 'bg-red-100 text-red-800 border-red-300';
        return 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return {
        formData, isLoading, message, deliveries: filteredDeliveries,
        selectedOrder, searchTerm, 
        waterTypes: waterTypesData, 
        departments: deptsData, 
        handleChange, handleSubmit, setSearchTerm, setSelectedOrder, getStatusColor,
        handleUpdateStatus, handleDelete // Đã thêm handleDelete vào đây
    };
};

const WaterDeliveryLogic: React.FC = () => {
    const logic = useWaterDeliveryLogic();
    
    return (
        <WaterDeliveryPageUI 
            {...logic} 
            waterTypes={logic.waterTypes.map(t => t.name)}
            departments={logic.departments.map(d => d.name)}
        />
    );
};

export default WaterDeliveryLogic;