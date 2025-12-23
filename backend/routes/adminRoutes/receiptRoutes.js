// backend/routes/receiptRoutes.js

import express from 'express';
const router = express.Router(); 

import { receiptController } from '../../controllers/adminControllers/receiptController.js'; 
// import { protect } from '../middleware/authMiddleware.js'; 

/**
 * Định tuyến cho nghiệp vụ Quản lý Lô hàng Nhập (Receipts)
 */

// [GET] /api/receipts/:id/qrcode -> Lấy dữ liệu và hình ảnh QR Code
router.get('/:id/qrcode', receiptController.getQRCode); 

// [GET] /api/receipts/ -> Lấy danh sách lô hàng (có thể kèm tìm kiếm)
router.get('/', receiptController.getReceipts);

// [POST] /api/receipts/ -> Tạo lô hàng mới
router.post('/', /* protect, */ receiptController.createReceipt);

// [PUT] /api/receipts/:id/status -> Cập nhật trạng thái lô hàng
router.put('/:id/status', /* protect, */ receiptController.updateStatus);

// [DELETE] /api/receipts/:id -> Xóa lô hàng
router.delete('/:id', /* protect, */ receiptController.deleteReceipt); 

export default router;