import api from '@/lib/api';

export interface DeliveryPayload {
    delivery_id?: string;
    recipientName: string;
    department: number | string;
    waterType: number | string;
    quantity: number | string;
    deliveryTime: string;
    content: string;
}

export interface TrashItem {
    delivery_id: string;
    recipient_name: string;
    product_name: string;
    quantity: number;
    deleted_at: string;
    expires_at: string;
    days_left: number;
}

export const waterDeliveryApi = {
    // Lấy dữ liệu ban đầu (Loại nước, Phòng ban, Danh sách đơn)
    getInitialData: async () => {
        const endpoints = [
            api.get('/master/water-types'),
            api.get('/departments'),
            api.get('/deliveries')
        ];
        const results = await Promise.allSettled(endpoints);
        return results.map(res => res.status === 'fulfilled' ? res.value : { data: { data: [] } });
    },

    getTrashData: async () => api.get('/deliveries/trash'),

    createDelivery: async (payload: DeliveryPayload) => {
        const dbPayload = {
            delivery_id: payload.delivery_id,
            recipient_name: payload.recipientName,
            dept_id: payload.department,
            product_id: payload.waterType,
            quantity: Number(payload.quantity),
            delivery_time: payload.deliveryTime,
            note: payload.content,
            status_id: 1 // 1: Đang xử lý
        };
        return api.post('/deliveries', dbPayload);
    },

    updateStatus: async (id: string, statusId: number) => api.patch(`/deliveries/${id}/status`, { status_id: statusId }),

    restoreDelivery: async (id: string) => api.patch(`/deliveries/${id}/restore`),

    deleteDelivery: async (id: string) => api.delete(`/deliveries/${id}`),

    permanentlyDelete: async (id: string) => api.delete(`/deliveries/${id}/permanent`)
};