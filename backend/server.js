import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet"; // Thêm bảo mật header

// IMPORT ROUTES
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/adminRoutes/userRoutes.js"; 
import receiptRoutes from './routes/adminRoutes/receiptRoutes.js';
import masterRoutes from './routes/adminRoutes/masterRoutes.js'; 
import departmentsRouter from './routes/adminRoutes/departmentsRouter.js';
import deliveryRoutes from './routes/adminRoutes/deliveryRoutes.js'; 

// IMPORT MIDDLEWARE
import { protect, authorize } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express();

// --- MIDDLEWARE HỆ THỐNG ---
app.use(helmet()); // Bảo mật các HTTP headers
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// --- 1. PUBLIC ROUTES ---
// Đăng nhập, đăng ký, quên mật khẩu không cần token
app.use("/api/auth", authRouter);

// --- 2. KÍCH HOẠT BẢO VỆ (Authentication Layer) ---
// Tất cả các route phía dưới dòng này bắt buộc phải có Bearer Token hợp lệ
app.use(protect); 

// --- 3. PRIVATE ROUTES (Authorization Layer) ---

/** * NHÓM 1: CHỈ ADMIN (Hệ thống & Nhân sự)
 * Quản lý người dùng, phân quyền phòng ban.
 */
app.use("/api/users", authorize("ADMIN"), userRouter);
app.use('/api/departments', authorize("ADMIN"), departmentsRouter);

/** * NHÓM 2: ADMIN & MANAGER (Quản lý kho bãi)
 * Manager có quyền nhập kho, quản lý master data nhưng không có quyền xóa user.
 */
app.use('/api/receipts', authorize("ADMIN", "MANAGER"), receiptRoutes);
app.use('/api/master', authorize("ADMIN", "MANAGER"), masterRoutes);

/** * NHÓM 3: TẤT CẢ (ADMIN, MANAGER, USER)
 * User (ví dụ: Nhân viên giao nhận) có quyền xem và cập nhật trạng thái đơn giao hàng.
 */
app.use('/api/deliveries', authorize("ADMIN", "MANAGER", "USER"), deliveryRoutes);

// --- 4. XỬ LÝ LỖI TẬP TRUNG ---
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log lỗi cho Developer (có thể dùng Winston hoặc Morgan)
  console.error(`[Error] ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
    // Chỉ hiện stack trace khi ở môi trường phát triển
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔐 Chế độ phân quyền: ADMIN > MANAGER > USER`);
});