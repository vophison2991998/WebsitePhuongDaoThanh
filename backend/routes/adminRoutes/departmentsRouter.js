import express from 'express';
import { getDepartments } from '../../controllers/adminControllers/departmentsController.js';

const router = express.Router();

// Đường dẫn: GET /api/departments
router.get('/', getDepartments);

export default router;