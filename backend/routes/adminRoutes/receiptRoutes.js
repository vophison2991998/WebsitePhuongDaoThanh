import express from 'express';
const router = express.Router(); 
import { receiptController } from '../../controllers/adminControllers/receiptController.js'; 

/**
 * Định tuyến cho nghiệp vụ Quản lý Lô hàng Nhập (Receipts)
 * Base URL: /api/receipts
 */

// --- NHÓM ROUTE QUẢN LÝ THÙNG RÁC (RECYCLE BIN) ---

// 1. [GET] /api/receipts/trash - Lấy danh sách lô hàng trong thùng rác
// Lưu ý: Đặt route '/trash' lên trước các route có tham số '/:id'
router.get('/trash', receiptController.getTrashItems);

// 2. [POST] /api/receipts/:id/restore - Khôi phục lô hàng từ thùng rác
router.post('/:id/restore', receiptController.restoreReceipt);


// --- NHÓM ROUTE NGHIỆP VỤ CHÍNH ---

// 3. [GET] /api/receipts/ - Lấy danh sách lô hàng (Chỉ lấy mục chưa xóa)
router.get('/', receiptController.getReceipts);

// 4. [GET] /api/receipts/:id/qr-image - Lấy hình ảnh QR Code
router.get('/:id/qr-image', receiptController.getQRCode); 

// 5. [POST] /api/receipts/ - Tạo lô hàng mới
router.post('/', receiptController.createReceipt);

// 6. [PUT] /api/receipts/:id/status - Cập nhật trạng thái (confirm/cancel)
router.put('/:id/status', receiptController.updateStatus);

// 7. [DELETE] /api/receipts/:id - Xóa mềm (Chuyển vào thùng rác)
// Theo logic mới, bản ghi sẽ được gắn deleted_at và lưu trữ 30 ngày
router.delete('/:id', receiptController.deleteReceipt); 

export default router;