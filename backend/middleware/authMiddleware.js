// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  let token;

  // 1. Kiểm tra Token trong Header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Vui lòng đăng nhập để truy cập tài nguyên này." 
    });
  }

  try {
    // 2. Xác minh Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Đính kèm dữ liệu vào request
    req.user = {
      id: decoded.id,
      role: decoded.role.toUpperCase(), // Đảm bảo đồng bộ in hoa
      username: decoded.username
    };

    next();
  } catch (error) {
    const msg = error.name === "TokenExpiredError" ? "Phiên làm việc hết hạn." : "Mã xác thực không hợp lệ.";
    return res.status(401).json({ success: false, message: msg });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Nếu người dùng là ADMIN, luôn cho phép qua (Hierarchy logic)
    if (req.user.role === "ADMIN") return next();

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Quyền truy cập bị từ chối cho vai trò: ${req.user.role}` 
      });
    }
    next();
  };
};