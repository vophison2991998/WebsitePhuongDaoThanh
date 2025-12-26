import db from '../../config/db.js';

/**
 * HỆ THỐNG QUẢN LÝ TẬP TRUNG PHƯƠNG ĐÀO THÀNH
 * MODEL: QUẢN LÝ XUẤT KHO / GIAO HÀNG (DELIVERIES)
 * CHỨC NĂNG: SOFT DELETE & RECYCLE BIN (30 DAYS)
 */

const DeliveryModel = {
    /**
     * 1. LẤY DANH SÁCH ĐƠN HÀNG ĐANG HOẠT ĐỘNG (ACTIVE)
     */
    getAll: async () => {
        const sql = `                    
            SELECT 
                d.delivery_id, d.recipient_name, d.quantity, 
                d.delivery_time, d.note, d.updated_at, d.status_id,
                dept.name AS department_name,      
                p.name AS product_name, p.unit,                                                                         
                ds.name AS status_name
            FROM deliveries d
            LEFT JOIN departments dept ON d.dept_id = dept.id
            LEFT JOIN water_product p ON d.product_id = p.product_id
            JOIN delivery_status ds ON d.status_id = ds.id
            WHERE d.deleted_at IS NULL 
            ORDER BY d.delivery_time DESC;
        `;
        const { rows } = await db.query(sql);
        return rows;
    },

    /**
     * 2. LẤY DANH SÁCH THÙNG RÁC (TRASH)
     * Tính toán chính xác ngày còn lại trước khi bị xóa vĩnh viễn
     */
    getTrash: async () => {
        const sql = `
            SELECT 
                d.delivery_id, d.recipient_name, d.quantity, d.deleted_at,
                p.name AS product_name,
                (d.deleted_at + INTERVAL '30 days') AS expires_at,
                -- Tính số ngày còn lại (Làm tròn lên)
                CEIL(EXTRACT(EPOCH FROM (d.deleted_at + INTERVAL '30 days' - NOW())) / 86400)::INT AS days_left
            FROM deliveries d
            LEFT JOIN water_product p ON d.product_id = p.product_id
            WHERE d.deleted_at IS NOT NULL
              AND d.deleted_at > NOW() - INTERVAL '30 days'
            ORDER BY d.deleted_at DESC;
        `;
        const { rows } = await db.query(sql);
        return rows;
    },

    /**
     * 3. TẠO ĐƠN HÀNG MỚI
     */
    create: async (data) => {
        const { 
            delivery_id, recipient_name, dept_id, product_id, 
            quantity, delivery_time, status_id = 1, note 
        } = data;

        const sql = `
            INSERT INTO deliveries (
                delivery_id, recipient_name, dept_id, product_id, 
                quantity, delivery_time, status_id, note
            )
            VALUES (
                COALESCE($1, 'ORD-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 8))), 
                $2, $3, $4, $5, 
                COALESCE($6, CURRENT_TIMESTAMP), 
                $7, $8
            ) 
            RETURNING *;
        `;
        
        const values = [delivery_id || null, recipient_name, dept_id, product_id, quantity, delivery_time, status_id, note];
        const { rows } = await db.query(sql, values);
        return rows[0];
    },

    /**
     * 4. CẬP NHẬT THÔNG TIN CHI TIẾT (DYNAMIC UPDATE)
     * Chỉ cập nhật những trường được gửi lên, tránh ghi đè dữ liệu cũ bằng NULL
     */
    update: async (id, data) => {
        const fields = [];
        const values = [];
        let idx = 1;

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                fields.push(`${key} = $${idx}`);
                values.push(value);
                idx++;
            }
        }

        if (fields.length === 0) return null;

        values.push(id);
        const sql = `
            UPDATE deliveries 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE delivery_id = $${idx} AND deleted_at IS NULL
            RETURNING *;
        `;

        const { rows } = await db.query(sql, values);
        return rows[0] || null;
    },

    /**
     * 5. KHÔI PHỤC TỪ THÙNG RÁC
     */
    restore: async (id) => {
        const sql = `
            UPDATE deliveries 
            SET deleted_at = NULL, updated_at = NOW() 
            WHERE delivery_id = $1 AND deleted_at IS NOT NULL
            RETURNING *;
        `;
        const { rows } = await db.query(sql, [id]);
        return rows[0] || null;
    },

    /**
     * 6. XÓA TẠM THỜI (SOFT DELETE)
     */
    delete: async (id) => {
        const sql = `UPDATE deliveries SET deleted_at = NOW() WHERE delivery_id = $1 AND deleted_at IS NULL;`;
        const result = await db.query(sql, [id]);
        return result.rowCount > 0;
    },

    /**
     * 7. XÓA VĨNH VIỄN (MANUAL HARD DELETE)
     */
    permanentlyDelete: async (id) => {
        const sql = `DELETE FROM deliveries WHERE delivery_id = $1 AND deleted_at IS NOT NULL;`;
        const result = await db.query(sql, [id]);
        return result.rowCount > 0;
    },

    /**
     * 8. TỰ ĐỘNG DỌN DẸP (CRON JOB CALL)
     */
    autoCleanExpired: async () => {
        return await db.query(`SELECT clean_expired_trash();`);
    }
};

export default DeliveryModel;