import * as departmentsModel from '../../models/adminModels/departmentsModel.js';

// 1. Lấy danh sách tất cả phòng ban
export const getDepartments = async (req, res) => {
    try {
        const data = await departmentsModel.getAllDepartments();
        res.status(200).json({ 
            success: true, 
            data,
            message: "Tải danh sách phòng ban thành công" 
        });
    } catch (error) {
        console.error("Error in getDepartments:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy phòng ban' });
    }
};

// 2. Lấy danh sách nhân sự trong phòng ban (Phân loại chi tiết)
export const getDeptUsers = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await departmentsModel.getUsersByDepartment(id);

        // Thống kê nhanh để Frontend hiển thị tổng số ở từng Section
        const stats = {
            total: data.length,
            admins: data.filter(u => u.role_name?.toLowerCase().includes('admin')).length,
            managers: data.filter(u => u.role_name?.toLowerCase().includes('manager')).length,
            users: data.filter(u => 
                !u.role_name?.toLowerCase().includes('admin') && 
                !u.role_name?.toLowerCase().includes('manager')
            ).length
        };

        res.status(200).json({ 
            success: true, 
            data, 
            stats, // Gửi thêm stats để UI hiển thị số lượng ở header các section
            message: "Tải danh sách nhân sự thành công"
        });
    } catch (error) {
        console.error("Error in getDeptUsers:", error);
        res.status(500).json({ success: false, message: 'Lỗi truy xuất nhân sự phòng ban' });
    }
};

// 3. Tạo phòng ban mới
export const createDept = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên phòng ban không được để trống' });
        }

        const data = await departmentsModel.createDepartment(name, description);
        res.status(201).json({ 
            success: true, 
            data,
            message: "Đã tạo phòng ban mới thành công" 
        });
    } catch (error) {
        // Lỗi trùng tên (Unique constraint trong Postgres)
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Tên phòng ban này đã tồn tại' });
        }
        res.status(500).json({ success: false, message: 'Lỗi khi tạo mới phòng ban' });
    }
};

// 4. Cập nhật thông tin phòng ban
export const updateDept = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        const data = await departmentsModel.updateDepartment(id, name, description);
        
        if (!data) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng ban để cập nhật' });
        }

        res.status(200).json({ 
            success: true, 
            data,
            message: "Cập nhật thông tin thành công" 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi trong quá trình cập nhật' });
    }
};

// 5. Xóa phòng ban
export const deleteDept = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await departmentsModel.deleteDepartment(id);
        
        if (!data) {
            return res.status(404).json({ success: false, message: 'Phòng ban không tồn tại' });
        }

        res.status(200).json({ success: true, message: 'Đã xóa phòng ban thành công' });
    } catch (error) {
        // Lỗi vi phạm khóa ngoại (Foreign key constraint - còn nhân sự)
        if (error.code === '23503') {
            return res.status(400).json({ 
                success: false, 
                message: 'Không thể xóa: Vẫn còn nhân sự đang trực thuộc phòng ban này.' 
            });
        }
        res.status(500).json({ success: false, message: 'Lỗi server khi thực hiện lệnh xóa' });
    }
};