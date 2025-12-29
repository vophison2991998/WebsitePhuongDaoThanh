import express from 'express';
import { 
    getDepartments, 
    getDeptUsers, // Hàm mới để lấy nhân sự theo phòng
    createDept, 
    updateDept, 
    deleteDept 
} from '../../controllers/adminControllers/departmentsController.js';
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * TẤT CẢ ROUTE Ở ĐÂY ĐỀU ĐI QUA /api/departments
 * Yêu cầu: Đã đăng nhập (protect)
 */
router.use(protect);

// 1. Lấy danh sách tổng quát các phòng ban
// [GET] /api/departments
router.get('/', getDepartments);

// 2. Lấy danh sách nhân sự CHI TIẾT của 1 phòng ban (Yêu cầu của bạn)
// [GET] /api/departments/:id/users
router.get('/:id/users', getDeptUsers);

// 3. Các chức năng quản trị (Chỉ dành cho ADMIN)
// [POST] /api/departments
router.post('/', authorize('ADMIN'), createDept);

// [PUT] /api/departments/:id
router.put('/:id', authorize('ADMIN'), updateDept);

// [DELETE] /api/departments/:id
router.delete('/:id', authorize('ADMIN'), deleteDept);

export default router;