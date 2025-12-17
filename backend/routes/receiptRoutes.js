// backend/routes/receiptRoutes.js (FINAL - SỬ DỤNG ES MODULES)
import express from 'express';
const router = express.Router();
import { receiptController } from '../controllers/receiptController.js'; // <<< ĐÃ THÊM .js

router.get('/:id/qrcode', receiptController.getQRCode); // <<< ROUTE MỚI
// GET: Lấy danh sách lô hàng

router.get('/', receiptController.getReceipts);

// POST: Tạo lô hàng nhập mới
router.post('/', /* protect, */ receiptController.createReceipt);

// PUT: Cập nhật trạng thái lô hàng (ví dụ: xác nhận đã nhập)
router.put('/:id/status', /* protect, */ receiptController.updateStatus);

router.delete('/:id', /* protect, */ receiptController.deleteReceipt); // <<< ĐÃ THÊM
export default router;