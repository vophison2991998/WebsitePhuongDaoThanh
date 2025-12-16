import db from "../config/db.js";

export const findUserByUsername = async (username) => {
  const query = `
    SELECT
      u.id,
      u.username,
      u.password,
      u.is_active,
      r.code AS role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.username = $1
  `;
  const { rows } = await db.query(query, [username]);
  return rows[0];
};
