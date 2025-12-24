// backend/routes/masterRoutes.js

import express from 'express';
const router = express.Router(); 

import { masterController } from '../../controllers/adminControllers/masterController.js'; 


router.get('/water-types', masterController.getWaterTypes); 

export default router;