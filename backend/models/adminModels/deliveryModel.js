import db from '../../config/db.js';

const DeliveryModel = {
    /**
     * Lấy danh sách tất cả đơn hàng (Gồm tên phòng ban, tên sản phẩm và tên trạng thái)
     */
    getAll: async () => {
        const sql = `                    
            SELECT 
                d.delivery_id,
                d.recipient_name,
                dept.name AS department_name,      
                p.name AS product_name,           
                p.unit,                                          
                d.quantity,
                d.delivery_time,
                ds.name AS status, -- Lấy tên trạng thái từ bảng delivery_status
                d.status_id,      -- Giữ ID để xử lý logic nếu cần
                d.note,
                d.updated_at
            FROM deliveries d
            LEFT JOIN departments dept ON d.dept_id = dept.id
            LEFT JOIN water_product p ON d.product_id = p.product_id
            LEFT JOIN delivery_status ds ON d.status_id = ds.id
            WHERE d.deleted_at IS NULL -- Chỉ lấy các đơn chưa xóa (Soft Delete)
            ORDER BY d.delivery_time DESC;
            `;
        const { rows } = await db.query(sql);
        return rows;
    },

    /**
     * Tạo đơn hàng mới (Sử dụng status_id thay vì status văn bản)
     */
    create: async (data) => {
        const { 
            delivery_id, 
            recipient_name, 
            dept_id, 
            product_id, 
            quantity, 
            delivery_time, 
            status_id, // Truyền ID trạng thái (VD: 1 cho PROCESSING, 2 cho COMPLETED)
            note 
        } = data;

        const sql = `
            INSERT INTO deliveries (
                delivery_id, recipient_name, dept_id, product_id, 
                quantity, delivery_time, status_id, note
            )
            VALUES (
                COALESCE($1, 'ORD-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 8))), 
                $2, $3, $4, $5, $6, $7, $8
            ) 
            RETURNING *;
        `;
        
        const { rows } = await db.query(sql, [
            delivery_id || null, 
            recipient_name, 
            dept_id, 
            product_id, 
            quantity, 
            delivery_time || new Date(), 
            status_id || 1, // Mặc định là trạng thái đầu tiên nếu không truyền
            note || null
        ]);
        return rows[0];
    },

    /**
     * Cập nhật thông tin đơn hàng
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

        try {
            const values = [
                recipient_name ?? null, 
                dept_id ?? null, 
                product_id ?? null, 
                quantity ?? null, 
                delivery_time ?? null, 
                status_id ?? null,
                note ?? null, 
                id
            ];
            const { rows } = await db.query(sql, values);
            return rows[0] || null;
        } catch (error) {
            console.error("Error in DeliveryModel.update:", error);
            throw error;
        }
    },

    /**
     * Cập nhật riêng trạng thái đơn hàng (Sử dụng ID trạng thái)
     */
    updateStatus: async (id, statusId) => {
        const sql = `
            UPDATE deliveries 
            SET status_id = $1, updated_at = NOW() 
            WHERE delivery_id = $2 AND deleted_at IS NULL
            RETURNING *;`;
        
        try {
            const { rows } = await db.query(sql, [statusId, id]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error in DeliveryModel.updateStatus:", error);
            throw error;
        }
    },

    /**
     * Xóa đơn hàng (Thực hiện Soft Delete theo cấu trúc V10.3)
     */
    delete: async (id) => {
        // Chuyển từ DELETE vật lý sang UPDATE deleted_at để đưa vào thùng rác
        const sql = `UPDATE deliveries SET deleted_at = NOW() WHERE delivery_id = $1;`;
        
        try {
            const result = await db.query(sql, [id]);
            return result.rowCount > 0;
        } catch (error) {
            console.error("Error in DeliveryModel.delete:", error);
            throw error;
        }
    }
};

export default DeliveryModel;