import pool from '../../config/db.js';

/**
 * Hàm Helper: Tạo chuỗi dữ liệu JSON để mã hóa vào QR
 */
const generateQRCodeData = (lotCode, extraData = {}) => {
    return JSON.stringify({
        type: 'RECEIPT_LOT',
        code: lotCode,
        ...extraData,
        timestamp: Date.now()
    });
};

export const ReceiptModel = {
    
    /**
     * Tạo một lô hàng nhận mới
     */
    create: async (data, userId) => {
        const client = await pool.connect();
        try {
            const deliveryName = (data.delivery_person || data.deliveryPerson)?.trim();
            const supplierName = (data.supplier)?.trim();
            const waterTypeVal = data.water_type_id || data.waterType;
            const receiptDate = data.receipt_date || data.receiptDate || new Date();

            if (!deliveryName || !supplierName) {
                throw new Error("Thông tin Nhà cung cấp và Người giao hàng là bắt buộc.");
            }

            await client.query('BEGIN');

            // 1. Xử lý Nhà Cung Cấp
            const supplierRes = await client.query(
                `INSERT INTO app_supplier (name) VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
                [supplierName]
            );
            const supplierId = supplierRes.rows[0].id;

            // 2. Xử lý Người Giao Hàng
            const deliveryRes = await client.query(
                `INSERT INTO app_delivery_person (full_name, supplier_id) VALUES ($1, $2) 
                 ON CONFLICT (full_name, supplier_id) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id`,
                [deliveryName, supplierId]
            );
            const deliveryPersonId = deliveryRes.rows[0].id;

            // 3. Lấy Water Type ID
            const waterTypeRes = await client.query(
                "SELECT product_id, name FROM water_product WHERE product_id = $1 OR name = $2", 
                [isNaN(parseInt(waterTypeVal)) ? -1 : parseInt(waterTypeVal), waterTypeVal]
            );
            
            if (waterTypeRes.rows.length === 0) throw new Error(`Sản phẩm '${waterTypeVal}' không tồn tại.`);
            const waterTypeId = waterTypeRes.rows[0].product_id;
            const waterTypeName = waterTypeRes.rows[0].name;

            // 4. Lấy ID trạng thái mặc định (PROCESSING)
            const statusRes = await client.query("SELECT id FROM receipt_status WHERE code = 'PROCESSING'");
            const statusId = statusRes.rows[0].id;

            // 5. Tạo Mã Lô Hàng và QR
            const lotCode = `LOT-${Date.now().toString().slice(-8)}`; 
            const qrCodeData = generateQRCodeData(lotCode, {
                supplier: supplierName,
                product: waterTypeName,
                qty: data.quantity
            }); 

            // 6. Insert bản ghi
            const result = await client.query(`
                INSERT INTO app_receipt_lot 
                (lot_code, supplier_id, delivery_person_id, water_type_id, quantity, receipt_date, status_id, received_by, qr_code_data) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, 
                [lotCode, supplierId, deliveryPersonId, waterTypeId, parseInt(data.quantity) || 0, receiptDate, statusId, userId, qrCodeData]
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    
    /**
     * Lấy danh sách lô hàng (Chỉ lấy bản ghi chưa bị xóa)
     */
    find: async (searchTerm = '') => {
        let query = `
            SELECT 
                rl.id, rl.lot_code, rl.quantity, 
                TO_CHAR(rl.receipt_date, 'YYYY-MM-DD') as receipt_date,
                rs.name AS status, rs.code AS status_code,
                rl.qr_code_data, s.name AS supplier,
                dp.full_name AS delivery_person, wp.name AS water_type 
            FROM app_receipt_lot rl
            JOIN app_supplier s ON rl.supplier_id = s.id
            JOIN app_delivery_person dp ON rl.delivery_person_id = dp.id
            JOIN water_product wp ON rl.water_type_id = wp.product_id
            JOIN receipt_status rs ON rl.status_id = rs.id
            WHERE rl.deleted_at IS NULL
        `;
        const params = [];
        if (searchTerm) {
            query += ` AND (rl.lot_code ILIKE $1 OR s.name ILIKE $1 OR dp.full_name ILIKE $1 OR wp.name ILIKE $1)`;
            params.push(`%${searchTerm}%`);
        }
        query += ' ORDER BY rl.created_at DESC';
        const result = await pool.query(query, params);
        return result.rows;
    },
    
    /**
     * Cập nhật trạng thái
     */
    updateStatus: async (lotId, statusKey) => {
        let finalCode = statusKey;
        if (statusKey === 'confirm') finalCode = 'COMPLETED';
        if (statusKey === 'cancel') finalCode = 'CANCELLED';

        const query = `
            UPDATE app_receipt_lot
            SET status_id = (SELECT id FROM receipt_status WHERE code = $1 OR name = $1 LIMIT 1)
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING *`;
        const result = await pool.query(query, [finalCode, lotId]);
        return result.rows[0];
    },

    /**
     * Tìm theo ID (Chi tiết lô hàng)
     */
    findById: async (lotId) => {
        const query = `
            SELECT rl.*, rs.name as status_name, rs.code as status_code, 
                   wp.name AS water_type, s.name AS supplier, dp.full_name as delivery_person
            FROM app_receipt_lot rl
            JOIN receipt_status rs ON rl.status_id = rs.id
            JOIN water_product wp ON rl.water_type_id = wp.product_id 
            JOIN app_supplier s ON rl.supplier_id = s.id
            JOIN app_delivery_person dp ON rl.delivery_person_id = dp.id
            WHERE rl.id = $1`;
        const result = await pool.query(query, [lotId]);
        return result.rows[0];
    },

    /**
     * THÙNG RÁC: Xóa mềm (Soft Delete)
     */
    delete: async (lotId) => {
        const query = `UPDATE app_receipt_lot SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [lotId]);
        return result.rowCount; 
    },

    /**
     * THÙNG RÁC: Khôi phục dữ liệu
     */
    restore: async (lotId) => {
        const query = `UPDATE app_receipt_lot SET deleted_at = NULL WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [lotId]);
        return result.rows[0];
    },

    /**
     * THÙNG RÁC: Lấy danh sách các mục đã xóa
     */
    getTrash: async () => {
        const query = `
            SELECT id, lot_code, quantity, deleted_at,
                   (deleted_at + INTERVAL '30 days') as expires_at
            FROM app_receipt_lot 
            WHERE deleted_at IS NOT NULL
            ORDER BY deleted_at DESC`;
        const result = await pool.query(query);
        return result.rows;
    },

    /**
     * THÙNG RÁC: Tự động dọn dẹp sau 30 ngày
     * Hàm này nên được gọi bởi một Cron Job định kỳ
     */
    cleanupTrash: async () => {
        const query = `DELETE FROM app_receipt_lot WHERE deleted_at < NOW() - INTERVAL '30 days'`;
        const result = await pool.query(query);
        return result.rowCount;
    }
};