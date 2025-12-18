import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRoutes.js"; 
import receiptRoutes from './routes/receiptRoutes.js';
import masterRoutes from './routes/masterRoutes.js'; 
import departmentsRouter from './routes/departmentsRouter.js';
// 1. IMPORT ROUTER GIAO NƯỚC MỚI
import deliveryRoutes from './routes/deliveryRoutes.js'; 

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

// =========================================
// CÁC TUYẾN ĐƯỜNG API (ROUTES)
// =========================================
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter); 
app.use('/api/receipts', receiptRoutes); 
app.use('/api/master', masterRoutes); 
app.use('/api/departments', departmentsRouter);


app.use('/api/deliveries', deliveryRoutes); 

// =========================================
// KHỞI CHẠY SERVER
// =========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`)
);