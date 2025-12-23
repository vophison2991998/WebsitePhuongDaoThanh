import db from '../../config/db.js'; // Nhớ thêm đuôi .js khi dùng import

export const getAllDepartments = async () => {
    const query = 'SELECT id, name FROM departments ORDER BY name ASC';
    const { rows } = await db.query(query);
    return rows;
};