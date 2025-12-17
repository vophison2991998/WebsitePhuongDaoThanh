// backend/models/receiptModel.js

import pool from '../config/db.js'; 
import QRCode from 'qrcode'; 

// Hàm Helper: Tạo chuỗi dữ liệu JSON để mã hóa vào QR
const generateQRCodeData = async (lotCode) => {
    // Dữ liệu muốn mã QR lưu trữ
    const dataToEncode = JSON.stringify({
        type: 'RECEIPT_LOT',
        code: lotCode,
        timestamp: Date.now()
    });
    
    // Chúng ta lưu chuỗi JSON này vào CSDL. 
    return dataToEncode; 
};


export const ReceiptModel = {
    
    /**
     * Tạo một lô hàng mới, bao gồm việc kiểm tra/tạo Supplier và Delivery Person, 
     * và tạo QR Code data.
     */
    createReceiptLot: async (data, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); // Bắt đầu Transaction

            // 1. Tìm hoặc tạo Nhà Cung Cấp (app_supplier)
            let supplierResult = await client.query(
                "SELECT id FROM app_supplier WHERE name = $1", 
                [data.supplier]
            );

            if (supplierResult.rows.length === 0) {
                supplierResult = await client.query(
                    "INSERT INTO app_supplier (name) VALUES ($1) RETURNING id",
                    [data.supplier]
                );
            }
            const supplierId = supplierResult.rows[0].id;

            // 2. Tìm hoặc tạo Người Giao Hàng (app_delivery_person)
            let deliveryPersonResult = await client.query(
                "SELECT id FROM app_delivery_person WHERE full_name = $1 AND supplier_id = $2",
                [data.deliveryPerson, supplierId]
            );
            
            if (deliveryPersonResult.rows.length === 0) {
                deliveryPersonResult = await client.query(
                    "INSERT INTO app_delivery_person (full_name, supplier_id) VALUES ($1, $2) RETURNING id",
                    [data.deliveryPerson, supplierId]
                );
            }
            const deliveryPersonId = deliveryPersonResult.rows[0].id;

            // 3. Lấy Water Type ID (Giả định 'Nước tinh khiết 20L' tồn tại)
            const waterTypeResult = await client.query(
                "SELECT id FROM inventory_water_types WHERE name = $1", 
                ['Nước tinh khiết 20L'] 
            );
            
            if (waterTypeResult.rows.length === 0) {
                // Nếu không tìm thấy loại nước, hủy transaction
                throw new Error("Water type 'Nước tinh khiết 20L' not found. Please insert data into inventory_water_types.");
            }
            const waterTypeId = waterTypeResult.rows[0].id;

            // 4. Tạo Mã Lô Hàng và QR Code Data
            const lotCode = `LOT-${Date.now().toString().slice(-6)}`;
            const qrCodeData = await generateQRCodeData(lotCode); 

            // 5. Thêm Lô Hàng Nhận (app_receipt_lot)
            const receiptQuery = `
                INSERT INTO app_receipt_lot (lot_code, supplier_id, delivery_person_id, water_type_id, quantity, receipt_date, status, received_by, qr_code_data) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`;
            
            const newLotResult = await client.query(receiptQuery, [
                lotCode,
                supplierId,
                deliveryPersonId,
                waterTypeId,
                data.quantity,
                data.receiptDate,
                'CHỜ XÁC NHẬN', 
                userId,
                qrCodeData // <<< LƯU DỮ LIỆU QR
            ]);

            await client.query('COMMIT'); // Commit Transaction
            return newLotResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK'); // Rollback nếu có lỗi
            throw error;
        } finally {
            client.release();
        }
    },
    
    /**
     * Cập nhật cột qr_code_data sau khi lô hàng đã được tạo.
     * (Hữu ích khi tạo lại QR code data)
     */
    updateLotQrCodeData: async (lotId, qrCodeData) => {
        const query = `
            UPDATE app_receipt_lot
            SET qr_code_data = $1
            WHERE id = $2
            RETURNING id, qr_code_data`;
        const result = await pool.query(query, [qrCodeData, lotId]);
        return result.rows[0];
    },


    /**
     * Lấy danh sách lô hàng theo từ khóa tìm kiếm.
     */
    getReceiptLots: async (searchTerm = '') => {
        let query = `
            SELECT 
                rl.id, rl.lot_code, rl.quantity, TO_CHAR(rl.receipt_date, 'DD/MM/YYYY') AS receipt_date, rl.status, 
                rl.qr_code_data, 
                s.name AS supplier,
                dp.full_name AS delivery_person
            FROM app_receipt_lot rl
            JOIN app_supplier s ON rl.supplier_id = s.id
            JOIN app_delivery_person dp ON rl.delivery_person_id = dp.id
            WHERE 1=1
        `;
        const params = [];

        if (searchTerm) {
            const searchPattern = `%${searchTerm.toLowerCase()}%`;
            query += ` AND (LOWER(rl.lot_code) LIKE $1 OR LOWER(s.name) LIKE $1 OR LOWER(dp.full_name) LIKE $1)`;
            params.push(searchPattern);
        }

        query += ' ORDER BY rl.created_at DESC';

        const result = await pool.query(query, params);
        return result.rows;
    },
    
    /**
     * Cập nhật trạng thái của lô hàng.
     */
    updateLotStatus: async (lotId, newStatus) => {
        const query = `
            UPDATE app_receipt_lot
            SET status = $1
            WHERE id = $2
            RETURNING *`;
        const result = await pool.query(query, [newStatus, lotId]);
        return result.rows[0];
    },
    
    /**
     * Xóa vĩnh viễn lô hàng khỏi CSDL.
     */
    deleteReceiptLot: async (lotId) => {
        const query = `
            DELETE FROM app_receipt_lot
            WHERE id = $1
            RETURNING *`;
        const result = await pool.query(query, [lotId]);
        return result.rows[0];
    },

    /**
     * Lấy lô hàng theo ID (cần cho việc lấy QR Code data trong Controller)
     */
    getLotById: async (lotId) => {
        const query = `SELECT * FROM app_receipt_lot WHERE id = $1`;
        const result = await pool.query(query, [lotId]);
        return result.rows[0];
    }
};