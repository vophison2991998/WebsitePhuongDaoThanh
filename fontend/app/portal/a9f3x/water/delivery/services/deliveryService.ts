// Định nghĩa kiểu dữ liệu cho đơn hàng đầu vào
export interface DeliveryOrder {
    orderCode?: string; // Tùy chọn, vì nó được tạo sau
    quantity: number;
    waterType: string;
    recipientName: string;
    department: string;
    content: string;
    deliveryTime: string; // ISO string for datetime-local
}

// Định nghĩa kiểu dữ liệu cho kết quả API
export interface SaveResult {
    success: boolean;
    orderId: string;
}

/**
 * Hàm giả lập việc gọi API lưu đơn hàng.
 * @param order - Thông tin đơn hàng cần lưu
 * @returns Promise<SaveResult>
 */
export const saveDeliveryOrder = async (order: DeliveryOrder): Promise<SaveResult> => {
    console.log("Lưu đơn hàng:", order);
    
    // Giả lập độ trễ API
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    // Giả lập việc tạo mã đơn hàng nếu chưa có
    const orderId = order.orderCode || `ORD-${Date.now().toString().slice(-6)}`;
    
    // Giả lập thành công
    return { 
        success: true, 
        orderId: orderId 
    };
    
    /* // Nếu muốn giả lập lỗi, dùng code sau:
    // throw new Error("Lỗi kết nối API: Server không phản hồi."); 
    */
};