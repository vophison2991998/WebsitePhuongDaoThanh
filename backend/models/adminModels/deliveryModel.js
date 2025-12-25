import db from '../../config/db.js';

const DeliveryModel = {
    /**
     * 1. LẤY DANH SÁCH ĐƠN HÀNG (ACTIVE)
     * JOIN với bảng delivery_status để lấy tên trạng thái hiển thị
     */
    getAll: async () => {
        const sql = `                    
            SELECT 
                d.delivery_id, 
                d.recipient_name, 
                d.quantity, 
                d.delivery_time, 
                d.note, 
                d.updated_at,
                dept.name AS department_name,      
                p.name AS product_name, 
                p.unit,                                                         
                ds.name AS status, -- Lấy từ bảng delivery_status
                d.status_id
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
     * Tính toán thời gian còn lại trước khi clean_expired_trash() dọn dẹp (30 ngày)
     */
    getTrash: async () => {
        const sql = `
            SELECT 
                d.delivery_id, 
                d.recipient_name, 
                d.quantity, 
                d.deleted_at,
                p.name AS product_name,
                (d.deleted_at + INTERVAL '30 days') AS expires_at,
                (30 - EXTRACT(DAY FROM NOW() - d.deleted_at))::INT AS days_left
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
     * Mặc định status_id = 1 (PROCESSING) theo bảng danh mục mới
     */
    create: async (data) => {
        const { 
            delivery_id, recipient_name, dept_id, product_id, 
            quantity, delivery_time, status_id, note 
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
                COALESCE($7, 1), -- Mặc định 1: PROCESSING (theo INSERT dữ liệu mẫu)
                $8
            ) 
            RETURNING *;
        `;
        
        const values = [
            delivery_id || null, 
            recipient_name, 
            dept_id, 
            product_id, 
            quantity, 
            delivery_time, 
            status_id, 
            note
        ];

        const { rows } = await db.query(sql, values);
        return rows[0];
    },

    /**
     * 4. CẬP NHẬT CHI TIẾT
     */
    update: async (id, data) => {
        const { recipient_name, dept_id, product_id, quantity, delivery_time, status_id, note } = data;
        
        const sql = `
            UPDATE deliveries 
            SET 
                recipient_name = COALESCE($1, recipient_name), 
                dept_id = COALESCE($2, dept_id), 
                product_id = COALESCE($3, product_id), 
                quantity = COALESCE($4, quantity), 
                delivery_time = COALESCE($5, delivery_time), 
                status_id = COALESCE($6, status_id),
                note = COALESCE($7, note), 
                updated_at = NOW()
            WHERE delivery_id = $8 AND deleted_at IS NULL
            RETURNING *;`;

        const values = [recipient_name, dept_id, product_id, quantity, delivery_time, status_id, note, id];
        const { rows } = await db.query(sql, values);
        return rows[0] || null;
    },

    /**
     * 5. CẬP NHẬT TRẠNG THÁI (PROCESSING <-> COMPLETED)
     * Đảm bảo chỉ cập nhật các bản ghi chưa bị xóa
     */
    updateStatus: async (id, statusId) => {
        const sql = `
            UPDATE deliveries 
            SET status_id = $1, updated_at = NOW() 
            WHERE delivery_id = $2 AND deleted_at IS NULL
            RETURNING *;`;
        
        const { rows } = await db.query(sql, [statusId, id]);
        return rows[0] || null;
    },

    /**
     * 6. KHÔI PHỤC TỪ THÙNG RÁC
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
     * 7. XÓA TẠM THỜI (SOFT DELETE)
     */
    delete: async (id) => {
        const sql = `UPDATE deliveries SET deleted_at = NOW() WHERE delivery_id = $1 AND deleted_at IS NULL;`;
        const result = await db.query(sql, [id]);
        return result.rowCount > 0;
    },

    /**
     * 8. XÓA VĨNH VIỄN
     * Thường dùng cho nút "Empty Trash" hoặc xóa thủ công từng dòng trong thùng rác
     */
    permanentlyDelete: async (id) => {
        const sql = `DELETE FROM deliveries WHERE delivery_id = $1 AND deleted_at IS NOT NULL;`;
        const result = await db.query(sql, [id]);
        return result.rowCount > 0;
    }
};

export default DeliveryModel;