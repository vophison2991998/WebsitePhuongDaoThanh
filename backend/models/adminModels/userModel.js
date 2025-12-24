import pool from "../../config/db.js";

const userModel = {
  /**
   * Lấy dữ liệu quản lý (Chỉ lấy các user CHƯA bị xóa - deleted_at IS NULL)
   */
  getManagementData: async () => {
    // Lấy danh sách cán bộ đang hoạt động
    const users = await pool.query(`
      SELECT u.id, u.username, u.is_active as status, r.code as role, d.name as dept, p.full_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE u.deleted_at IS NULL
      ORDER BY u.id DESC`);
    
    const roles = await pool.query("SELECT id, code, name FROM roles ORDER BY id ASC");
    const depts = await pool.query("SELECT id, name FROM departments ORDER BY name ASC");
    
    return { 
      users: users.rows, 
      roles: roles.rows, 
      departments: depts.rows 
    };
  },

  /**
   * Lấy danh sách cán bộ trong thùng rác (Bị xóa trong vòng 30 ngày trở lại)
   */
  getTrashData: async () => {
    const res = await pool.query(`
      SELECT u.id, u.username, u.deleted_at, p.full_name, d.name as dept
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE u.deleted_at IS NOT NULL 
      AND u.deleted_at > NOW() - INTERVAL '30 days'
      ORDER BY u.deleted_at DESC`);
    return res.rows;
  },

  /**
   * Tạo tài khoản mới (Sử dụng Transaction)
   */
  createUser: async (data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const userRes = await client.query(
        "INSERT INTO users (username, password, role_id, is_active) VALUES ($1, $2, $3, true) RETURNING id",
        [data.username, data.password, data.role_id]
      );
      const userId = userRes.rows[0].id;

      await client.query(
        "INSERT INTO user_profiles (user_id, full_name, department_id) VALUES ($1, $2, $3)",
        [userId, data.full_name, data.department_id]
      );

      await client.query('COMMIT');
      return userId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  /**
   * Xóa tạm vào thùng rác (Soft Delete)
   */
  softDeleteUser: async (id) => {
    const { rowCount } = await pool.query(
      "UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1",
      [id]
    );
    return rowCount > 0;
  },

  /**
   * Khôi phục tài khoản từ thùng rác
   */
  restoreUser: async (id) => {
    const { rowCount } = await pool.query(
      "UPDATE users SET deleted_at = NULL, is_active = true WHERE id = $1",
      [id]
    );
    return rowCount > 0;
  },

  /**
   * Xóa vĩnh viễn khỏi Database
   */
  deleteUserPermanently: async (id) => {
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return rowCount > 0;
  },

  /**
   * Cập nhật vai trò (Role)
   */
  updateUserRole: async (id, roleId) => {
    const { rowCount } = await pool.query(
      "UPDATE users SET role_id = $1 WHERE id = $2",
      [roleId, id]
    );
    return rowCount > 0;
  },

  /**
   * Khóa/Mở khóa tài khoản nhanh
   */
  toggleUserStatus: async (id) => {
    const { rowCount } = await pool.query(
      "UPDATE users SET is_active = NOT is_active WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    return rowCount > 0;
  },

  /**
   * Điều chuyển phòng ban (Cập nhật bảng user_profiles)
   */
  updateUserDepartment: async (id, departmentId) => {
    const { rowCount } = await pool.query(
      "UPDATE user_profiles SET department_id = $1 WHERE user_id = $2",
      [departmentId, id]
    );
    return rowCount > 0;
  },
};

export default userModel;