// backend/controllers/receiptController.js

import { ReceiptModel } from '../models/receiptModel.js';
import QRCode from 'qrcode';

// Hàm helper để tạo chuỗi dữ liệu QR Code từ thông tin lô hàng
// HÀM NÀY CHỈ DÙNG TRONG getQRCode NẾU THIẾU DỮ LIỆU HOẶC TRONG MODEL
const generateQrCodeData = (lotInfo) => {
    return JSON.stringify({
        id: lotInfo.id,
        lotCode: lotInfo.lot_code,
        quantity: lotInfo.quantity,
        supplier: lotInfo.supplier
    });
};

export const receiptController = {
    // [POST] /api/receipts
    createReceipt: async (req, res) => {
        try {
            // Lấy userId từ token/session (Giả định user ID là 1 nếu chưa có auth)
            const userId = req.user ? req.user.id : 1;
            
            // 1. Tạo lô hàng
            // Hàm này thực hiện TẤT CẢ: tạo Supplier, Delivery Person, tạo Lot, và lưu trữ QR_CODE_DATA
            const newLotResult = await ReceiptModel.createReceiptLot(req.body, userId);
            
            // 2. Format kết quả trả về
            res.status(201).json({
                message: "Ghi nhận lô hàng nhập kho thành công. Dữ liệu QR code đã được lưu trữ.",
                data: {
                    ...newLotResult,
                    // Thêm lại các trường cần thiết từ req.body nếu newLotResult không trả về
                    supplier: req.body.supplier, 
                    deliveryPerson: req.body.deliveryPerson,
                    // Format lại ngày tháng
                    receiptDate: new Date(newLotResult.receipt_date).toLocaleDateString('vi-VN')
                }
            });

        } catch (error) {
            console.error('Error creating receipt lot:', error);
            // Kiểm tra lỗi không tìm thấy loại nước (hoặc lỗi Validation khác)
            const statusCode = error.message.includes("not found") ? 400 : 500; 
            res.status(statusCode).json({ 
                message: `Lỗi Server khi tạo lô hàng. ${error.message}`,
                error: error.message
            });
        }
    },

    // [GET] /api/receipts
    getReceipts: async (req, res) => {
        try {
            const searchTerm = req.query.search || '';
            const receipts = await ReceiptModel.getReceiptLots(searchTerm);
            res.status(200).json(receipts);
        } catch (error) {
            console.error('Error fetching receipt lots:', error);
            res.status(500).json({ 
                message: "Lỗi Server khi lấy danh sách lô hàng.", 
                error: error.message 
            });
        }
    },

    // [PUT] /api/receipts/:id/status
    updateStatus: async (req, res) => {
        try {
            const lotId = req.params.id;
            const { status } = req.body;
            
            if (!status) {
                return res.status(400).json({ message: "Trạng thái mới không được bỏ trống." });
            }
            
            const validStatuses = ['ĐÃ NHẬP', 'CHỜ XÁC NHẬN', 'ĐÃ HỦY'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: "Trạng thái không hợp lệ." });
            }

            const updatedLot = await ReceiptModel.updateLotStatus(lotId, status);

            if (!updatedLot) {
                return res.status(404).json({ message: "Không tìm thấy lô hàng để cập nhật." });
            }

            res.status(200).json({
                message: `Cập nhật trạng thái lô hàng ${updatedLot.lot_code} thành ${status} thành công.`,
                data: updatedLot
            });

        } catch (error) {
            console.error('Error updating lot status:', error);
            res.status(500).json({ 
                message: "Lỗi Server khi cập nhật trạng thái lô hàng.", 
                error: error.message 
            });
        }
    },

    // [DELETE] /api/receipts/:id
    deleteReceipt: async (req, res) => {
        try {
            const lotId = req.params.id;
            
            const deletedLot = await ReceiptModel.deleteReceiptLot(lotId);

            if (!deletedLot) {
                return res.status(404).json({ message: "Không tìm thấy lô hàng để xóa." });
            }

            res.status(200).json({
                message: `Đã xóa lô hàng ${deletedLot.lot_code} thành công.`,
                data: deletedLot
            });

        } catch (error) {
            console.error('Error deleting lot:', error);
            res.status(500).json({ 
                message: "Lỗi Server khi xóa lô hàng.", 
                error: error.message 
            });
        }
    },
    
    // [GET] /api/receipts/:id/qrcode
    getQRCode: async (req, res) => {
        try {
            const lotId = req.params.id;
            
            // 1. Lấy dữ liệu lô hàng
            const lot = await ReceiptModel.getLotById(lotId); 
            
            if (!lot) {
                return res.status(404).json({ message: "Không tìm thấy lô hàng." });
            }

            // 2. Kiểm tra dữ liệu QR code đã được lưu
            let qrCodeData = lot.qr_code_data; 
            
            if (!qrCodeData) {
                // Nếu dữ liệu QR code bị thiếu, tạo lại và cập nhật vào DB
                console.warn(`Lô hàng ${lotId} thiếu dữ liệu QR code. Đang tạo lại và cập nhật.`);
                
                // Lấy thông tin supplier
                // LƯU Ý: Nếu cần tên Supplier/Delivery Person cho QR code data, 
                // bạn cần JOIN chúng trong getLotById hoặc truyền nó từ Controller vào Model.
                
                const newQrData = generateQrCodeData({
                    id: lot.id,
                    lot_code: lot.lot_code,
                    quantity: lot.quantity,
                    supplier: lot.supplier_name || 'UNKNOWN' // Placeholder
                });
                
                // Cập nhật vào DB để lần sau có thể sử dụng lại
                await ReceiptModel.updateLotQrCodeData(lotId, newQrData); 
                qrCodeData = newQrData; // Sử dụng dữ liệu mới để tạo hình ảnh
            }
            
            // 3. Tạo hình ảnh QR code dưới dạng Data URL
            const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
                errorCorrectionLevel: 'H', 
                type: 'image/png',
                margin: 1,
                scale: 8
            });
            
            // 4. Cắt bỏ tiền tố Data URL để chỉ gửi Base64 thô
            const base64WithoutPrefix = qrCodeDataUrl.replace(/^data:image\/png;base64,/, ""); 

            res.status(200).json({ 
                qrCodeImage: base64WithoutPrefix, 
                encodedData: qrCodeData
            });

        } catch (error) {
            console.error('Error generating QR code:', error);
            res.status(500).json({ 
                message: "Lỗi Server khi tạo hình ảnh QR code.", 
                error: error.message 
            });
        }
    }
};