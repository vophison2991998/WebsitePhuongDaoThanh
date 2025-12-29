import db from '../../config/db.js';

/**
 * LẤY TẤT CẢ PHÒNG BAN + SỐ LƯỢNG NHÂN SỰ
 * Hiển thị ở danh sách tổng quát
 */
export const getAllDepartments = async () => {
    const query = `
        SELECT 
            d.*, 
            COUNT(up.user_id)::INT as user_count
        FROM departments d
        LEFT JOIN user_profiles up ON d.id = up.department_id
        LEFT JOIN users u ON up.user_id = u.id
        WHERE u.deleted_at IS NULL OR u.id IS NULL
        GROUP BY d.id 
        ORDER BY d.id ASC`;
    const { rows } = await db.query(query);
    return rows;
};

/**
 * LẤY DANH SÁCH NHÂN VIÊN THEO PHÒNG BAN
 * Phục vụ hiển thị Admin, Manager, User ở giao diện Workspace
 */
export const getUsersByDepartment = async (deptId) => {
    const query = `
        SELECT 
            u.id, 
            u.username, 
            u.is_active,
            up.full_name, 
            up.email, 
            up.phone,
            r.name as role_name  -- Quan trọng: Dùng để Frontend .filter()
        FROM users u
        INNER JOIN user_profiles up ON u.id = up.user_id
        INNER JOIN roles r ON u.role_id = r.id
        WHERE 
            up.department_id = $1 
            AND u.deleted_at IS NULL
        ORDER BY 
            CASE 
                WHEN r.name ILIKE '%admin%' THEN 1
                WHEN r.name ILIKE '%manager%' THEN 2
                ELSE 3
            END, 
            up.full_name ASC`; // Sắp xếp thứ tự ưu tiên ngay từ DB
            
    const { rows } = await db.query(query, [deptId]);
    return rows;
};

/**
 * TẠO PHÒNG BAN MỚI
 */
export const createDepartment = async (name, description) => {
    const query = `
        INSERT INTO departments (name, description, created_at) 
        VALUES ($1, $2, NOW()) 
        RETURNING *`;
    const { rows } = await db.query(query, [name, description]);
    return rows[0];
};

/**
 * CẬP NHẬT THÔNG TIN PHÒNG BAN
 */
export const updateDepartment = async (id, name, description) => {
    const query = `
        UPDATE departments 
        SET name = $1, description = $2, updated_at = NOW() 
        WHERE id = $3 
        RETURNING *`;
    const { rows } = await db.query(query, [name, description, id]);
    return rows[0];
};

/**
 * XÓA PHÒNG BAN
 */
export const deleteDepartment = async (id) => {
    // Lưu ý: Trong thực tế nên kiểm tra xem phòng ban có nhân sự không trước khi xóa
    const query = 'DELETE FROM departments WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
};