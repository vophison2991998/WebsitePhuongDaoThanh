// backend/routes/masterRoutes.js

import express from 'express';
const router = express.Router(); 

import { masterController } from '../controllers/masterController.js'; 

/**
 * Định tuyến cho nghiệp vụ Master Data
 */

// [GET] /api/master/water-types -> Lấy danh sách Loại Nước
router.get('/water-types', masterController.getWaterTypes); 

export default router;