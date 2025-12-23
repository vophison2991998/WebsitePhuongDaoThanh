import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

// 1. PUBLIC ROUTES (Không cần đăng nhập)
app.use("/api/auth", authRouter);

// 2. KÍCH HOẠT BẢO VỆ (Tất cả phía dưới đều cần Token)
app.use(protect); 

// 3. PRIVATE ROUTES (Đã đăng nhập + Kiểm tra quyền cụ thể)
app.use("/api/users", authorize("ADMIN"), userRouter);
app.use('/api/departments', authorize("ADMIN"), departmentsRouter);

app.use('/api/receipts', authorize("ADMIN", "WAREHOUSE"), receiptRoutes);
app.use('/api/master', authorize("ADMIN", "WAREHOUSE"), masterRoutes);

app.use('/api/deliveries', authorize("ADMIN", "WAREHOUSE", "DELIVERY"), deliveryRoutes);

// KHỞI CHẠY
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`)
);