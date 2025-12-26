import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cron from "node-cron";

// IMPORT ROUTES
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/adminRoutes/userRoutes.js"; 
import receiptRoutes from './routes/adminRoutes/receiptRoutes.js';
import masterRoutes from './routes/adminRoutes/masterRoutes.js'; 
import departmentsRouter from './routes/adminRoutes/departmentsRouter.js';
import deliveryRoutes from './routes/adminRoutes/deliveryRoutes.js'; 

// IMPORT MODELS
import DeliveryModel from './models/adminModels/deliveryModel.js';

// IMPORT MIDDLEWARE
import { protect, authorize } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express(); // Initialize APP first!

// --- 1. MIDDLEWARE HỆ THỐNG ---
app.use(helmet()); 
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// --- 2. TỰ ĐỘNG DỌN DẸP THÙNG RÁC ---
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('--- 🕒 Bắt đầu tiến trình dọn dẹp thùng rác định kỳ ---');
    await DeliveryModel.autoCleanExpired();
    console.log('--- ✅ Đã dọn dẹp thành công dữ liệu quá hạn 30 ngày ---');
  } catch (error) {
    console.error('--- ❌ Lỗi khi tự động dọn dẹp thùng rác:', error.message);
  }
});

// --- 3. PUBLIC ROUTES ---
app.use("/api/auth", authRouter);

// --- 4. KÍCH HOẠT BẢO VỆ (Authentication Layer) ---
// Note: Requests to routes below this line MUST have a valid JWT token
app.use(protect); 

// --- 5. PRIVATE ROUTES ---
app.use("/api/users", authorize("ADMIN"), userRouter);
app.use('/api/departments', authorize("ADMIN"), departmentsRouter);
app.use('/api/receipts', authorize("ADMIN", "MANAGER"), receiptRoutes);
app.use('/api/master', authorize("ADMIN", "MANAGER"), masterRoutes);
app.use('/api/deliveries', authorize("ADMIN", "MANAGER", "USER"), deliveryRoutes);

// --- 6. XỬ LÝ LỖI TẬP TRUNG ---
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// --- 7. KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});