import db from '../config/db.js';

const DeliveryModel = {
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
                d.status,
                d.qr_code_data,                  
                d.updated_at
            FROM deliveries d
            LEFT JOIN departments dept ON d.dept_id = dept.id
            LEFT JOIN water_product p ON d.product_id = p.product_id
            ORDER BY d.delivery_time DESC;
            `;
        const { rows } = await db.query(sql);
        return rows;
    },

  create: async (data) => {
    const { 
        delivery_id, 
        recipient_name, 
        dept_id, 
        product_id, 
        quantity, 
        delivery_time, 
        note, 
        qr_code_data 
    } = data;

    const sql = `
        INSERT INTO deliveries (
            delivery_id, recipient_name, dept_id, product_id, 
            quantity, delivery_time, note, qr_code_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *;
    `;
    
    // Nếu note hoặc qr_code_data không có, nó sẽ tự chèn NULL vào DB
    const { rows } = await db.query(sql, [
        delivery_id, recipient_name, dept_id, product_id, 
        quantity, delivery_time, note || null, qr_code_data || null
    ]);
    return rows[0];
},

  update: async (id, data) => {
        const { recipient_name, dept_id, product_id, quantity, delivery_time, note } = data;
        
        const sql = `
            UPDATE deliveries 
            SET 
                recipient_name = COALESCE($1, recipient_name), 
                dept_id = COALESCE($2, dept_id), 
                product_id = COALESCE($3, product_id), 
                quantity = COALESCE($4, quantity), 
                delivery_time = COALESCE($5, delivery_time), 
                note = COALESCE($6, note), 
                updated_at = NOW()
            WHERE delivery_id = $7 
            RETURNING *;`;

        try {
            const values = [
                recipient_name ?? null, 
                dept_id ?? null, 
                product_id ?? null, 
                quantity ?? null, 
                delivery_time ?? null, 
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
     * Cập nhật riêng trạng thái đơn hàng
     */
  updateStatus: async (id, status) => {
        const sql = `
            UPDATE deliveries 
            SET status = $1, updated_at = NOW() 
            WHERE delivery_id = $2 
            RETURNING *;`;
        
        try {
            const { rows } = await db.query(sql, [status, id]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error in DeliveryModel.updateStatus:", error);
            throw error;
        }
    },

    /**
     * Xóa phiếu giao hàng và trả về kết quả thành công/thất bại
     */
    delete: async (id) => {
        const sql = `DELETE FROM deliveries WHERE delivery_id = $1;`;
        
        try {
            const result = await db.query(sql, [id]);
            // rowCount > 0 nghĩa là có ít nhất 1 dòng đã bị xóa
            return result.rowCount > 0;
        } catch (error) {
            console.error("Error in DeliveryModel.delete:", error);
            throw error;
        }
    }
};

export default DeliveryModel;