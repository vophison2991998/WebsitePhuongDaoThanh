// backend/controllers/masterController.js

import { MasterModel } from '../models/masterModel.js';

export const masterController = {
    /**
     * [GET] /api/master/water-types -> Lấy danh sách loại nước
     */
    getWaterTypes: async (req, res) => {
        try {
            const waterTypes = await MasterModel.getWaterTypes();
            
            res.status(200).json({
                message: "Lấy danh sách loại nước thành công.",
                data: waterTypes
            });
        } catch (error) {
            console.error('Error fetching water types:', error);
            res.status(500).json({ 
                message: "Lỗi Server khi lấy Master Data loại nước.", 
                error: error.message 
            });
        }
    }
};