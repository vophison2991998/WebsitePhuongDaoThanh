import express from 'express';
// Cách import này rất gọn, giúp bạn quản lý controller tập trung
import * as controller from '../controllers/deliveryController.js';

const router = express.Router();

/** * QUẢN LÝ PHIẾU GIAO HÀNG (DELIVERIES)
 * Cấu trúc: /api/deliveries (tùy thuộc vào cách bạn gắn router ở app.js)
 */

// 1. Lấy danh sách (GET) - Thường dùng để hiển thị lên bảng (Table)
router.get('/', controller.getDeliveries);

// 2. Thêm mới (POST) - Nhận dữ liệu từ form thêm mới
router.post('/', controller.createDelivery);

// 3. Sửa toàn bộ thông tin (PUT) - Cập nhật các trường: tên, số lượng, ngày...
// Ví dụ: PUT /api/deliveries/DEL001
router.put('/:id', controller.updateDelivery);

// 4. Sửa một phần (PATCH) - Ở đây là chỉ cập nhật trạng thái đơn hàng
// Sử dụng PATCH cho status là cực kỳ chuẩn xác theo REST API
router.patch('/:id/status', controller.updateStatus);

// 5. Xóa (DELETE) - Xóa hẳn bản ghi khỏi database
router.delete('/:id', controller.deleteDelivery);

export default router;