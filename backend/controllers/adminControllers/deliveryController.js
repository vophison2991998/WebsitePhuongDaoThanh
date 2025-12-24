import DeliveryModel from '../../models/adminModels/deliveryModel.js';

// Lấy danh sách (Bao gồm tên trạng thái từ Join Table)
export const getDeliveries = async (req, res) => {
    try {
        const data = await DeliveryModel.getAll();
        res.status(200).json({ 
            success: true, 
            data 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Lỗi lấy danh sách giao hàng: " + error.message 
        });
    }
};

// Thêm mới (Mặc định status_id = 1 nếu không truyền)
export const createDelivery = async (req, res) => {
    try {
        // Đảm bảo status_id được gửi lên là số (ID từ bảng delivery_status)
        const deliveryData = {
            ...req.body,
            status_id: req.body.status_id || 1 // Mặc định 1 (PROCESSING) theo DB V10.3
        };
        
        const data = await DeliveryModel.create(deliveryData);
        res.status(201).json({ 
            success: true, 
            message: "Tạo đơn hàng thành công", 
            data 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Lỗi tạo đơn hàng: " + error.message 
        });
    }
};

// Cập nhật thông tin chi tiết
export const updateDelivery = async (req, res) => {
    try {
        const data = await DeliveryModel.update(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy đơn hàng hoặc đơn đã bị xóa" 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: "Cập nhật thành công", 
            data 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Lỗi cập nhật đơn hàng: " + error.message 
        });
    }
};

// Cập nhật trạng thái (Dùng status_id thay vì status string)
export const updateStatus = async (req, res) => {
    try {
        // Nhận status_id từ body (Ví dụ: { "status_id": 2 })
        const { status_id } = req.body;
        
        if (!status_id) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu mã trạng thái (status_id)" 
            });
        }

        const data = await DeliveryModel.updateStatus(req.params.id, status_id);
        
        if (!data) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy đơn hàng để cập nhật trạng thái" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Cập nhật trạng thái thành công", 
            data 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Lỗi cập nhật trạng thái: " + error.message 
        });
    }
};

// Xóa (Thực hiện Soft Delete - chuyển vào thùng rác)
export const deleteDelivery = async (req, res) => {
    try {
        const isDeleted = await DeliveryModel.delete(req.params.id);
        
        if (!isDeleted) {
            return res.status(404).json({ 
                success: false, 
                message: "Đơn hàng không tồn tại hoặc đã xóa trước đó" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Đã chuyển đơn hàng vào thùng rác thành công" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Lỗi khi xóa đơn hàng: " + error.message 
        });
    }
};