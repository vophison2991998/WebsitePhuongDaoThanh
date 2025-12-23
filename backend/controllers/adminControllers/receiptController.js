// backend/controllers/receiptController.js

import { ReceiptModel } from '../../models/adminModels/receiptModel.js';
import QRCode from 'qrcode';

// Hàm helper để tạo chuỗi dữ liệu QR Code từ thông tin lô hàng
const generateQrCodeData = (lotInfo) => {
    return JSON.stringify({
        id: lotInfo.id,
        lotCode: lotInfo.lot_code,
        waterType: lotInfo.water_type || 'N/A',
        quantity: lotInfo.quantity,
        supplier: lotInfo.supplier || 'N/A'
    });
};

export const receiptController = {
    // [POST] /api/receipts
    createReceipt: async (req, res) => {
        try {
            // Giả định userId là 1 nếu chưa có auth
            const userId = req.user ? req.user.id : 1; 
            
            // 1. Tạo lô hàng
            const newLotResult = await ReceiptModel.create(req.body, userId);
            
            // 2. Format kết quả trả về
            res.status(201).json({
                message: "Ghi nhận lô hàng nhập kho thành công. Dữ liệu QR code đã được lưu trữ.",
                data: {
                    ...newLotResult,
                    waterType: req.body.waterType, 
                    supplier: req.body.supplier, 
                    deliveryPerson: req.body.deliveryPerson,
                    receiptDate: new Date(newLotResult.receipt_date).toLocaleDateString('vi-VN')
                }
            });

        } catch (error) {
            console.error('Error creating receipt lot:', error);
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
            const receipts = await ReceiptModel.find(searchTerm);
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

            const updatedLot = await ReceiptModel.updateStatus(lotId, status);

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
            
            const deletedRowsCount = await ReceiptModel.delete(lotId);

            if (deletedRowsCount === 0) {
                return res.status(404).json({ message: "Không tìm thấy lô hàng để xóa." });
            }

            res.status(200).json({
                message: `Đã xóa lô hàng ID ${lotId} thành công.`,
                data: { id: lotId }
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
            
            // 1. Lấy dữ liệu lô hàng (đã có JOIN)
            const lot = await ReceiptModel.findById(lotId); 
            
            if (!lot) {
                return res.status(404).json({ message: "Không tìm thấy lô hàng." });
            }

            // 2. Kiểm tra dữ liệu QR code đã được lưu
            let qrCodeData = lot.qr_code_data; 
            
            if (!qrCodeData) {
                console.warn(`Lô hàng ${lotId} thiếu dữ liệu QR code. Đang tạo lại và cập nhật.`);
                
                // TẠO DỮ LIỆU MỚI
                const newQrData = generateQrCodeData({
                    id: lot.id,
                    lot_code: lot.lot_code,
                    quantity: lot.quantity,
                    water_type: lot.water_type, 
                    supplier: lot.supplier 
                });
                
                // Cập nhật vào DB (Sử dụng hàm đã thêm vào Model)
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
                encodedData: qrCodeData,
                lotCode: lot.lot_code
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