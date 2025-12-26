import express from 'express';
import * as controller from '../../controllers/adminControllers/deliveryController.js';

const router = express.Router();

// --- NHÓM 1: QUẢN LÝ THÙNG RÁC (TRASH) ---
// Đặt các route /trash lên trên để tránh bị nhầm với /:id của nhóm hoạt động
router.get('/trash/all', controller.getTrashDeliveries);            // Xem danh sách thùng rác
router.post('/trash/:id/restore', controller.restoreDelivery);      // Khôi phục đơn hàng
router.delete('/trash/:id/permanent', controller.permanentlyDeleteDelivery); // Xóa vĩnh viễn
router.post('/trash/cleanup', controller.cleanTrash);              // Dọn dẹp thủ công

// --- NHÓM 2: QUẢN LÝ ĐƠN HÀNG HOẠT ĐỘNG (ACTIVE) ---
router.get('/', controller.getDeliveries);           // Lấy tất cả đơn hàng chưa xóa
router.post('/', controller.createDelivery);         // Tạo đơn hàng mới
router.put('/:id', controller.updateDelivery);       // Cập nhật toàn bộ/chi tiết đơn hàng
router.patch('/:id/status', controller.updateStatus); // Cập nhật nhanh trạng thái
router.delete('/:id', controller.deleteDelivery);    // Xóa tạm thời (Chuyển vào thùng rác)

export default router;