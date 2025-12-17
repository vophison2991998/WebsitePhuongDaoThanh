import * as departmentsModel from '../models/departmentsModel.js';

export const getDepartments = async (req, res) => {
    try {
        const departments = await departmentsModel.getAllDepartments();
        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Error in getDepartments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy danh sách phòng ban' 
        });
    }
};