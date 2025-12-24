import api from '@/lib/api';

export interface ReceiptFormData {
    waterType: string | number;
    quantity: number;
    receiptDate: string;
    deliveryPerson: string;
    supplier: string;
}

// Định nghĩa interface cho mục trong thùng rác để dễ quản lý ở UI
export interface TrashItem {
    id: number;
    lot_code: string;
    quantity: number;
    deleted_at: string;
    expires_at: string; // Ngày sẽ bị xóa vĩnh viễn
}

export const waterReceiptApi = {
    /**
     * 1. Lấy danh sách loại nước từ master data
     */
    getWaterTypes: async () => {
        const response = await api.get('/master/water-types');
        return response.data?.data || response.data || [];
    },

    /**
     * 2. Lấy danh sách lô hàng (Chỉ các mục chưa xóa)
     */
    getReceipts: async (searchTerm: string = '') => {
        const response = await api.get('/receipts', { 
            params: { search: searchTerm } 
        });
        return response.data?.data || response.data || [];
    },

    /**
     * 3. Tạo lô hàng mới
     */
    createReceipt: async (formData: ReceiptFormData) => {
        const payload = {
            waterType: formData.waterType, 
            quantity: Number(formData.quantity),
            receiptDate: formData.receiptDate,
            deliveryPerson: formData.deliveryPerson,
            supplier: formData.supplier
        };
        const response = await api.post('/receipts', payload);
        return response.data;
    },

    /**
     * 4. Cập nhật trạng thái lô hàng
     */
    updateStatus: async (id: number | string, status: 'confirm' | 'cancel' | 'COMPLETED' | 'CANCELLED') => {
        const response = await api.put(`/receipts/${id}/status`, { status });
        return response.data;
    },

    /**
     * 5. Xóa lô hàng (Soft Delete - Đưa vào thùng rác)
     */
    deleteReceipt: async (id: number | string) => {
        const response = await api.delete(`/receipts/${id}`);
        return response.data;
    },

    /**
     * 6. Lấy ảnh QR Code
     */
    getQrCode: async (id: number | string) => {
        const response = await api.get(`/receipts/${id}/qr-image`);
        return response.data?.qrCodeImage || response.data;
    },

    /**
     * 7. LẤY DANH SÁCH THÙNG RÁC (MỚI)
     */
    getTrash: async (): Promise<TrashItem[]> => {
        const response = await api.get('/receipts/trash');
        return response.data?.data || response.data || [];
    },

    /**
     * 8. KHÔI PHỤC LÔ HÀNG (MỚI)
     */
    restoreReceipt: async (id: number | string) => {
        const response = await api.post(`/receipts/${id}/restore`);
        return response.data;
    }
};