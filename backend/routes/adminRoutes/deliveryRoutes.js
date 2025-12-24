import express from 'express';
import * as controller from '../../controllers/adminControllers/deliveryController.js';

const router = express.Router();

// Lấy danh sách đơn hàng (Chỉ những đơn chưa xóa)
router.get('/', controller.getDeliveries);

// Tạo mới đơn hàng (Mặc định status_id = 1)
router.post('/', controller.createDelivery);

// Cập nhật toàn bộ thông tin đơn hàng
router.put('/:id', controller.updateDelivery);

// Cập nhật riêng trạng thái (PATCH là lựa chọn đúng cho status_id)
router.patch('/:id/status', controller.updateStatus);

// Xóa đơn hàng (Thực tế là Soft Delete - chuyển vào thùng rác)
router.delete('/:id', controller.deleteDelivery);

// GỢI Ý: Bạn có thể thêm route này để xem thùng rác
// router.get('/trash', controller.getDeletedDeliveries);

export default router;