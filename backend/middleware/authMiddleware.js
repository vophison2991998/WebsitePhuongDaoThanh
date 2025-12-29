import jwt from "jsonwebtoken";

/**
 * Middleware bảo vệ route (Xác thực JWT)
 * Kiểm tra xem người dùng đã gửi token hợp lệ trong Header chưa.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Kiểm tra Token trong Header Authorization (Bearer Token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Nếu không có token, trả về lỗi 401 (Unauthorized)
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập để thực hiện hành động này.",
    });
  }

  try {
    // 3. Xác minh tính hợp lệ của Token với JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Gắn thông tin User đã giải mã vào object Request (req.user)
    // Để các controller phía sau có thể sử dụng (VD: req.user.id)
    req.user = {
      id: decoded.id,
      role: decoded.role ? decoded.role.toUpperCase() : "USER",
      username: decoded.username,
    };

    next(); // Cho phép đi tiếp vào controller
  } catch (error) {
    console.error(`[Auth Error]: ${error.message}`);

    // Xử lý lỗi Token hết hạn hoặc không hợp lệ
    let errorMessage = "Mã xác thực không hợp lệ.";
    if (error.name === "TokenExpiredError") {
      errorMessage = "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
    }

    return res.status(401).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Middleware phân quyền (Authorization)
 * @param  {...string} allowedRoles - Danh sách các quyền được phép (VD: "ADMIN", "MANAGER")
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Luôn cho phép ADMIN đi qua mọi rào cản (Hierarchy logic)
    if (req.user && req.user.role === "ADMIN") {
      return next();
    }

    // Kiểm tra xem Role của người dùng hiện tại có nằm trong danh sách cho phép không
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Tài khoản (${req.user?.role || "GUEST"}) không có quyền truy cập chức năng này.`,
      });
    }

    next();
  };
};

/**
 * Middleware tiện ích: Kiểm tra cấp bậc (Role Hierarchy)
 * Cấp bậc: USER (0) < MANAGER (1) < ADMIN (2)
 * @param {string} minRole - Quyền tối thiểu cần có
 */
export const authorizeHierarchy = (minRole) => {
  const roles = ["USER", "MANAGER", "ADMIN"];
  return (req, res, next) => {
    const userLevel = roles.indexOf(req.user.role);
    const requiredLevel = roles.indexOf(minRole.toUpperCase());

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: "Cấp bậc tài khoản của bạn không đủ quyền hạn.",
      });
    }
    next();
  };
};