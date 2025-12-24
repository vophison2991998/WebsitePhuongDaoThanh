import api from '@/lib/api';

/**
 * Interface cho dữ liệu Payload (tùy chọn nhưng nên có để tránh lỗi Type)
 */
export interface DeliveryPayload {
    delivery_id?: string;
    recipientName: string;
    department: number | string;
    waterType: number | string;
    quantity: number | string;
    deliveryTime: string;
    content: string;
}

export const waterDeliveryApi = {
    /**
     * Lấy toàn bộ dữ liệu ban đầu cho trang Giao Nước
     */
    getInitialData: async () => {
        const endpoints = [
            api.get('/master/water-types'),
            api.get('/departments'),
            api.get('/deliveries')
        ];

        const results = await Promise.allSettled(endpoints);
        
        // Log lỗi chi tiết để Dev dễ theo dõi trong Console
        results.forEach((res, index) => {
            if (res.status === 'rejected') {
                const url = (res.reason.config?.url) || `Endpoint ${index + 1}`;
                console.warn(`Lỗi tại ${url}:`, res.reason.message);
            }
        });

        // Trả về dữ liệu an toàn (tránh sập UI nếu Backend lỗi 1 phần)
        return results.map(res => 
            res.status === 'fulfilled' ? res.value : { data: { data: [] } }
        );
    },

    /**
     * Tạo đơn hàng mới - Ánh xạ từ UI sang Database Schema
     */
    createDelivery: async (payload: DeliveryPayload) => {
        const dbPayload = {
            delivery_id: payload.delivery_id,
            recipient_name: payload.recipientName,
            dept_id: payload.department,
            product_id: payload.waterType,
            quantity: Number(payload.quantity),
            delivery_time: payload.deliveryTime,
            note: payload.content,
            status_id: 1 // Mặc định: PROCESSING
        };
        return api.post('/deliveries', dbPayload);
    },

    /**
     * Cập nhật trạng thái (Ví dụ: Hoàn thành, Hủy)
     */
    updateStatus: async (id: string, statusId: number) => {
        return api.patch(`/deliveries/${id}/status`, { status_id: statusId });
    },

    /**
     * Xóa đơn hàng (Soft Delete)
     */
    deleteDelivery: async (id: string) => {
        return api.delete(`/deliveries/${id}`);
    }
};