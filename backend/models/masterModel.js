// backend/models/masterModel.js

import pool from '../config/db.js';

export const MasterModel = {
    /**
     * Lấy danh sách tất cả các loại nước (Water Products)
     */
    getWaterTypes: async () => {
        try {
            const query = `
                SELECT 
    product_id AS id, 
    name
FROM 
    water_product
ORDER BY 
    name ASC;`; 
            
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error fetching water types:", error);
            // Quan trọng: Ném lại lỗi với thông báo chung
            throw new Error("Could not retrieve water product list from database."); 
        }
    }

    // Có thể thêm các hàm khác cho Master Data (ví dụ: getSuppliers, getDeliveryPeople) ở đây
};