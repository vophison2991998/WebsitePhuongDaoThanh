import api from '@/lib/api';

/**
 * ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES)
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

export interface TrashItem {
    delivery_id: string;
    recipient_name: string;
    product_name: string;
    quantity: number;
    deleted_at: string;
    expires_at: string;
    days_left: number;
}

/**
 * API SERVICE QUẢN LÝ GIAO NƯỚC
 */
export const waterDeliveryApi = {
    // 1. Lấy dữ liệu ban đầu cho trang Nhật ký
    getInitialData: async () => {
        const endpoints = [
            api.get('/master/water-types'), // Danh mục loại nước
            api.get('/departments'),       // Danh mục phòng ban
            api.get('/deliveries')         // Danh sách đơn hàng hoạt động
        ];
        
        const results = await Promise.allSettled(endpoints);
        
        // Trả về dữ liệu nếu thành công, ngược lại trả về mảng rỗng để tránh lỗi giao diện
        return results.map(res => 
            res.status === 'fulfilled' ? res.value : { data: { data: [] } }
        );
    },

    // 2. Lấy danh sách thùng rác (Đúng route: /trash/all)
    getTrashData: async () => api.get('/deliveries/trash/all'),

    // 3. Tạo đơn hàng mới (Map đúng trường Backend: recipient_name, dept_id, product_id, note)
    createDelivery: async (payload: DeliveryPayload) => {
        const dbPayload = {
            delivery_id: payload.delivery_id,
            recipient_name: payload.recipientName,
            dept_id: payload.department,
            product_id: payload.waterType,
            quantity: Number(payload.quantity),
            delivery_time: payload.deliveryTime,
            note: payload.content,
            status_id: 1 // Mặc định: PROCESSING (Đang xử lý)
        };
        return api.post('/deliveries', dbPayload);
    },

    // 4. Cập nhật trạng thái nhanh (PATCH)
    updateStatus: async (id: string, statusId: number) => 
        api.patch(`/deliveries/${id}/status`, { status_id: statusId }),

    // 5. Khôi phục từ thùng rác (Đúng route: /trash/:id/restore)
    restoreDelivery: async (id: string) => 
        api.post(`/deliveries/trash/${id}/restore`),

    // 6. Xóa tạm thời (Chuyển vào thùng rác)
    deleteDelivery: async (id: string) => 
        api.delete(`/deliveries/${id}`),

    // 7. Xóa vĩnh viễn (Đúng route: /trash/:id/permanent)
    permanentlyDelete: async (id: string) => 
        api.delete(`/deliveries/trash/${id}/permanent`),

    // 8. Dọn dẹp thùng rác thủ công (Dành cho Admin)
    cleanTrash: async () => 
        api.post('/deliveries/trash/cleanup')
};