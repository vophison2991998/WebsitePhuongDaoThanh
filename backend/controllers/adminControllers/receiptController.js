import { ReceiptModel } from '../../models/adminModels/receiptModel.js';
import QRCode from 'qrcode';

/**
 * Hàm helper tạo dữ liệu QR Code (Dự phòng nếu DB không có sẵn qr_code_data)
 */
const generateQrCodeData = (lotInfo) => {
    return JSON.stringify({
        id: lotInfo.id,
        lotCode: lotInfo.lot_code,
        waterType: lotInfo.water_type || 'N/A',
        quantity: lotInfo.quantity,
        supplier: lotInfo.supplier || 'N/A',
        timestamp: new Date().toISOString()
    });
};

export const receiptController = {
    /**
     * [POST] /api/receipts - Tạo lô hàng mới
     */
    createReceipt: async (req, res) => {
        try {
            const userId = req.user ? req.user.id : 1; 
            const newLotResult = await ReceiptModel.create(req.body, userId);
            
            res.status(201).json({
                message: "Ghi nhận lô hàng nhập kho thành công.",
                data: newLotResult
            });
        } catch (error) {
            console.error('Error creating receipt lot:', error);
            res.status(400).json({ message: error.message || "Lỗi khi tạo lô hàng." });
        }
    },

    /**
     * [GET] /api/receipts - Lấy danh sách lô hàng (Chỉ lấy các mục CHƯA XÓA)
     */
    getReceipts: async (req, res) => {
        try {
            const searchTerm = req.query.search || '';
            const receipts = await ReceiptModel.find(searchTerm);
            res.status(200).json(receipts);
        } catch (error) {
            console.error('Error fetching receipts:', error);
            res.status(500).json({ message: "Lỗi Server khi lấy danh sách." });
        }
    },

    /**
     * [PUT] /api/receipts/:id/status - Cập nhật trạng thái
     */
    updateStatus: async (req, res) => {
        try {
            const { status } = req.body;
            if (!status) return res.status(400).json({ message: "Trạng thái là bắt buộc." });

            const updatedLot = await ReceiptModel.updateStatus(req.params.id, status);
            if (!updatedLot) return res.status(404).json({ message: "Không tìm thấy lô hàng." });

            res.status(200).json({ message: "Cập nhật trạng thái thành công.", data: updatedLot });
        } catch (error) {
            res.status(500).json({ message: "Lỗi Server khi cập nhật trạng thái." });
        }
    },

    /**
     * [DELETE] /api/receipts/:id - Chuyển lô hàng vào THÙNG RÁC (Soft Delete)
     */
    deleteReceipt: async (req, res) => {
        try {
            const resultCount = await ReceiptModel.delete(req.params.id);
            if (resultCount === 0) return res.status(404).json({ message: "Lô hàng không tồn tại." });

            res.status(200).json({ message: "Lô hàng đã được chuyển vào thùng rác (tự động xóa sau 30 ngày)." });
        } catch (error) {
            res.status(500).json({ message: "Lỗi Server khi xóa lô hàng." });
        }
    },

    /**
     * [GET] /api/receipts/trash - Lấy danh sách trong THÙNG RÁC
     */
    getTrashItems: async (req, res) => {
        try {
            const trashItems = await ReceiptModel.getTrash();
            res.status(200).json(trashItems);
        } catch (error) {
            res.status(500).json({ message: "Lỗi lấy danh sách thùng rác." });
        }
    },

    /**
     * [POST] /api/receipts/:id/restore - KHÔI PHỤC lô hàng từ thùng rác
     */
    restoreReceipt: async (req, res) => {
        try {
            const restoredItem = await ReceiptModel.restore(req.params.id);
            if (!restoredItem) return res.status(404).json({ message: "Không tìm thấy để khôi phục." });

            res.status(200).json({ message: "Khôi phục lô hàng thành công.", data: restoredItem });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi khôi phục dữ liệu." });
        }
    },

    /**
     * [GET] /api/receipts/:id/qr-image - Tạo ảnh QR Code
     */
    getQRCode: async (req, res) => {
        try {
            const lot = await ReceiptModel.findById(req.params.id); 
            if (!lot) return res.status(404).json({ message: "Không tìm thấy lô hàng." });

            const qrCodeText = lot.qr_code_data || generateQrCodeData(lot);
            const qrCodeDataUrl = await QRCode.toDataURL(qrCodeText, {
                errorCorrectionLevel: 'H', 
                margin: 2,
                scale: 10
            });
            
            res.status(200).json({ qrCodeImage: qrCodeDataUrl, lotCode: lot.lot_code });
        } catch (error) {
            res.status(500).json({ message: "Lỗi tạo mã QR." });
        }
    }
};