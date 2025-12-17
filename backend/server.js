import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRoutes.js"; // Import router mới
import receiptRoutes from './routes/receiptRoutes.js';
import masterRoutes from './routes/masterRoutes.js'; // <<< ĐÃ THÊM
import departmentsRouter from './routes/departmentsRouter.js';
dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter); // Sử dụng userRouter đã import
app.use('/api/receipts', receiptRoutes); // Tuyến đường cho Receipt
app.use('/api/master', masterRoutes); // <<< ĐÃ THÊM
app.use('/api/departments', departmentsRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`)
);