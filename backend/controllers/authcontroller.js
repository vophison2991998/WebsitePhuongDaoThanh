import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByUsername } from "../models/authModels.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Thiếu username hoặc password" });

  try {
    const user = await findUserByUsername(username);

    if (!user)
      return res.status(401).json({ message: "Tài khoản không tồn tại" });

    if (!user.is_active)
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Sai mật khẩu" });

    // JWT payload
    const payload = {
      id: user.id,
      role: user.role, // ADMIN | MANAGER | USER
    };

  const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN } // ✅ đúng tên biến
);


    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
