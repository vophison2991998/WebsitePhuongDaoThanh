// backend/models/receiptModel.js

import pool from '../../config/db.js'; 
import QRCode from 'qrcode'; 

/**
 * Hàm Helper: Tạo chuỗi dữ liệu JSON để mã hóa vào QR
 * @param {string} lotCode - Mã lô hàng
 * @returns {string} Chuỗi JSON chứa dữ liệu QR
 */
const generateQRCodeData = (lotCode) => {
    const dataToEncode = JSON.stringify({
        type: 'RECEIPT_LOT',
        code: lotCode,
        timestamp: Date.now()
    });
    return dataToEncode; 
};


export const ReceiptModel = {
    
    /**
     * Tạo một lô hàng nhận mới. (Ánh xạ tới receiptController.createReceipt)
     */
    create: async (data, userId) => {
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

            // 3. Lấy Water Type ID (Dùng data.waterType và bảng water_product)
            const waterTypeResult = await client.query(
                "SELECT product_id AS id FROM water_product WHERE name = $1", 
                [data.waterType]
            );
            
            if (waterTypeResult.rows.length === 0) {
                throw new Error(`Water type '${data.waterType}' not found. Please check Master Data.`);
            }
            const waterTypeId = waterTypeResult.rows[0].id;

            // 4. Tạo Mã Lô Hàng và QR Code Data
            const lotCode = `LOT-${Date.now().toString().slice(-6)}`; 
            const qrCodeData = generateQRCodeData(lotCode); 

            // 5. Thêm Lô Hàng Nhận (app_receipt_lot)
            const receiptQuery = `
                INSERT INTO app_receipt_lot (lot_code, supplier_id, delivery_person_id, water_type_id, quantity, receipt_date, status, received_by, qr_code_data) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, lot_code, quantity, receipt_date, status, water_type_id, supplier_id, delivery_person_id`; 
            
            const newLotResult = await client.query(receiptQuery, [
                lotCode,
                supplierId,
                deliveryPersonId,
                waterTypeId,
                data.quantity,
                data.receiptDate,
                'CHỜ XÁC NHẬN', 
                userId,
                qrCodeData 
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
     * Lấy danh sách lô hàng theo từ khóa tìm kiếm.
     */
    find: async (searchTerm = '') => {
        let query = `
            SELECT 
                rl.id, 
                rl.lot_code, 
                rl.quantity, 
                TO_CHAR(rl.receipt_date, 'DD/MM/YYYY') AS receipt_date, 
                rl.status, 
                rl.qr_code_data, 
                s.name AS supplier,
                dp.full_name AS delivery_person,
                wp.name AS water_type 
            FROM app_receipt_lot rl
            JOIN app_supplier s ON rl.supplier_id = s.id
            JOIN app_delivery_person dp ON rl.delivery_person_id = dp.id
            JOIN water_product wp ON rl.water_type_id = wp.product_id
            WHERE 1=1
        `;
        const params = [];

        if (searchTerm) {
            const searchPattern = `%${searchTerm.toLowerCase()}%`;
            query += ` AND (LOWER(rl.lot_code) LIKE $1 OR LOWER(s.name) LIKE $1 OR LOWER(dp.full_name) LIKE $1 OR LOWER(wp.name) LIKE $1)`;
            params.push(searchPattern);
        }

        query += ' ORDER BY rl.created_at DESC';

        const result = await pool.query(query, params);
        return result.rows;
    },
    
    /**
     * Lấy lô hàng theo ID.
     */
    findById: async (lotId) => {
        const query = `
            SELECT 
                rl.*, 
                wp.name AS water_type, 
                s.name AS supplier
            FROM app_receipt_lot rl
            JOIN water_product wp ON rl.water_type_id = wp.product_id 
            JOIN app_supplier s ON rl.supplier_id = s.id
            WHERE rl.id = $1
        `;
        const result = await pool.query(query, [lotId]);
        return result.rows[0];
    },

    /**
     * Cập nhật trạng thái của lô hàng.
     */
    updateStatus: async (lotId, newStatus) => {
        const query = `
            UPDATE app_receipt_lot
            SET status = $1
            WHERE id = $2
            RETURNING *`;
        const result = await pool.query(query, [newStatus, lotId]);
        return result.rows[0];
    },

    /**
     * Cập nhật trường qr_code_data cho một lô hàng. (Đã thêm)
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
     * Xóa vĩnh viễn lô hàng khỏi CSDL.
     */
    delete: async (lotId) => {
        const query = `
            DELETE FROM app_receipt_lot
            WHERE id = $1
            RETURNING *`;
        const result = await pool.query(query, [lotId]);
        return result.rows.length; 
    },
};