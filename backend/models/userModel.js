import pool from "../config/db.js";

const userModel = {
  getManagementData: async () => {
    const users = await pool.query(`
      SELECT u.id, u.username, u.is_active as status, r.code as role, d.name as dept, p.full_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN departments d ON p.department_id = d.id
      ORDER BY u.id DESC`);
    
    const roles = await pool.query("SELECT id, code, name FROM roles ORDER BY id ASC");
    const depts = await pool.query("SELECT id, name FROM departments ORDER BY name ASC");
    
    return { users: users.rows, roles: roles.rows, departments: depts.rows };
  },

  createUser: async (data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Chèn vào bảng users
      const userRes = await client.query(
        "INSERT INTO users (username, password, role_id, is_active) VALUES ($1, $2, $3, true) RETURNING id",
        [data.username, data.password, data.role_id]
      );
      const userId = userRes.rows[0].id;

      // Chèn vào bảng user_profiles
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

  deleteUser: async (id) => {
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return rowCount > 0;
  },

  // Thay đổi vai trò
  updateUserRole: async (id, roleId) => {
    const { rowCount } = await pool.query(
      "UPDATE users SET role_id = $1 WHERE id = $2",
      [roleId, id]
    );
    return rowCount > 0;
  },


  toggleUserStatus: async (id) => {
    // Câu lệnh này tự động đảo ngược giá trị: true -> false, false -> true
    const { rowCount } = await pool.query(
      "UPDATE users SET is_active = NOT is_active WHERE id = $1",
      [id]
    );
    return rowCount > 0;
  }

};

export default userModel;