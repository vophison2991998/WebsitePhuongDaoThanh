import jwt from "jsonwebtoken";

/**
 * Middleware xác thực người dùng dựa trên JWT Token
 *
 */
export const protect = (req, res, next) => {
  // Lấy token từ header Authorization
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      // Xác minh tính hợp lệ của token với Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Đính kèm dữ liệu người dùng đã giải mã vào req để sử dụng ở các controller sau
      req.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username
      };

      return next();
    } catch (error) {
      // Trường hợp token hết hạn hoặc không đúng
      return res.status(401).json({ 
        success: false, 
        message: "Phiên làm việc đã hết hạn hoặc mã xác thực không hợp lệ." 
      });
    }
  }

  // Trường hợp hoàn toàn không cung cấp token
  return res.status(401).json({ 
    success: false, 
    message: "Quyền truy cập bị từ chối. Vui lòng đăng nhập để tiếp tục." 
  });
};

/**
 * Middleware phân quyền người dùng (Role-based Authorization)
 *
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Kiểm tra thông tin người dùng có tồn tại (đã qua middleware protect chưa)
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: "Không tìm thấy thông tin xác thực." });
    }

    // So khớp vai trò của người dùng với danh sách các quyền được phép
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Tài khoản với vai trò '${req.user.role}' không có quyền truy cập chức năng này.` 
      });
    }

    next();
  };
};