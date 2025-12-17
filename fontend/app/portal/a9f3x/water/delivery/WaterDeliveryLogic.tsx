import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

// --- Interfaces ---
export interface DeliveryItem {
    id: string;
    recipient: string;
    dept: string;
    quantity: number;
    waterType: string;
    status: 'Đang chờ xử lý' | 'Đang giao' | 'Hoàn thành';
    date: string;
}

export interface WaterDeliveryLogicProps {
    formData: any;
    isLoading: boolean;
    message: { type: 'success' | 'error', text: string } | null;
    deliveries: DeliveryItem[];
    selectedOrder: DeliveryItem | null;
    searchTerm: string;
    waterTypes: string[];
    departments: string[];
    handleChange: (e: any) => void;
    handleSubmit: (e: any) => Promise<void>;
    setSearchTerm: (val: string) => void;
    setSelectedOrder: (order: DeliveryItem | null) => void;
    getStatusColor: (status: string) => string;
}

// Cấu hình URL gọi đến các Route mới bạn vừa tách
const API_BASE = 'http://localhost:5000/api';
const WATER_TYPES_URL = `${API_BASE}/master/water-types`;
const DEPARTMENTS_URL = `${API_BASE}/departments`;

export const initialDeliveries: DeliveryItem[] = []; 

export const useWaterDeliveryLogic = (initialData: DeliveryItem[] = []): WaterDeliveryLogicProps => {
    const [waterTypes, setWaterTypes] = useState<string[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [allDeliveries, setAllDeliveries] = useState<DeliveryItem[]>(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<DeliveryItem | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const [formData, setFormData] = useState({
        quantity: 1,
        waterType: "",
        recipientName: '',
        department: "",
        content: '',
        deliveryTime: new Date().toISOString().substring(0, 16),
    });

    // --- FETCH DATA TỪ CÁC ROUTE MỚI ---
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                // Gọi song song cả 2 API để tối ưu tốc độ
                const [resWater, resDepts] = await Promise.all([
                    axios.get(WATER_TYPES_URL),
                    axios.get(DEPARTMENTS_URL)
                ]);

                // Xử lý dữ liệu Loại Nước (Dựa trên cấu trúc {success, data} của Controller mới)
                const waterData = resWater.data.data || resWater.data;
                const types = waterData.map((t: any) => t.name || t);
                setWaterTypes(types);

                // Xử lý dữ liệu Phòng Ban
                const deptData = resDepts.data.data || resDepts.data;
                const depts = deptData.map((d: any) => d.name || d);
                setDepartments(depts);

                // Thiết lập giá trị mặc định cho form
                setFormData(prev => ({
                    ...prev,
                    waterType: types[0] || "",
                    department: depts[0] || ""
                }));

            } catch (e) {
                console.error("Lỗi khi kết nối API:", e);
                setWaterTypes(["Nước Tinh Khiết 20L"]); // Dự phòng
                setDepartments(["Phòng Kỹ thuật"]);
            }
        };
        loadMasterData();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await new Promise(r => setTimeout(r, 800)); 
            const orderId = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const newItem: DeliveryItem = {
                id: orderId,
                recipient: formData.recipientName,
                dept: formData.department,
                quantity: formData.quantity,
                waterType: formData.waterType,
                status: 'Đang chờ xử lý',
                date: new Date().toLocaleDateString('vi-VN'),
            };
            setAllDeliveries(prev => [newItem, ...prev]);
            setSelectedOrder(newItem);
            setMessage({ type: 'success', text: `Đã tạo đơn ${orderId} thành công!` });
            setFormData(prev => ({ ...prev, recipientName: '', content: '' }));
        } catch (err) {
            setMessage({ type: 'error', text: 'Lỗi hệ thống.' });
        } finally { setIsLoading(false); }
    };

    const deliveries = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return allDeliveries.filter(d => d.recipient.toLowerCase().includes(term) || d.id.toLowerCase().includes(term));
    }, [allDeliveries, searchTerm]);

    const getStatusColor = (status: string) => {
        if (status === 'Đang giao') return 'bg-yellow-100 text-yellow-800';
        if (status === 'Hoàn thành') return 'bg-green-100 text-green-800';
        return 'bg-blue-100 text-blue-800';
    };

    return {
        formData, isLoading, message, deliveries,
        selectedOrder, searchTerm, waterTypes, departments,
        handleChange, handleSubmit, setSearchTerm, setSelectedOrder, getStatusColor
    };
};