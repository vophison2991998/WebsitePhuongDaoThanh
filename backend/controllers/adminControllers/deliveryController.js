import DeliveryModel from '../../models/adminModels/deliveryModel.js';

/**
 * 1. Lấy danh sách đơn hàng đang hoạt động (Chưa xóa)
 */
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

/**
 * 2. Lấy danh sách trong thùng rác (Đã xóa < 30 ngày)
 */
export const getTrashDeliveries = async (req, res) => {
    try {
        const data = await DeliveryModel.getTrash();
        res.status(200).json({
            success: true,
            message: "Lấy danh sách thùng rác thành công",
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy thùng rác: " + error.message
        });
    }
};

/**
 * 3. Thêm mới đơn hàng
 */
export const createDelivery = async (req, res) => {
    try {
        const deliveryData = {
            ...req.body,
            status_id: req.body.status_id || 1 // Mặc định 1 (PROCESSING)
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

/**
 * 4. Cập nhật thông tin chi tiết (Chỉ đơn chưa xóa)
 */
export const updateDelivery = async (req, res) => {
    try {
        const data = await DeliveryModel.update(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy đơn hàng hoặc đơn đã nằm trong thùng rác" 
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

/**
 * 5. Cập nhật trạng thái (Dùng status_id)
 */
export const updateStatus = async (req, res) => {
    try {
        const { status_id } = req.body;
        if (!status_id) {
            return res.status(400).json({ success: false, message: "Thiếu status_id" });
        }

        const data = await DeliveryModel.updateStatus(req.params.id, status_id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Cập nhật trạng thái thành công", 
            data 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi: " + error.message });
    }
};

/**
 * 6. Khôi phục đơn hàng từ thùng rác
 */
export const restoreDelivery = async (req, res) => {
    try {
        const data = await DeliveryModel.restore(req.params.id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng trong thùng rác để khôi phục"
            });
        }
        res.status(200).json({
            success: true,
            message: "Khôi phục đơn hàng thành công",
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khôi phục: " + error.message });
    }
};

/**
 * 7. Xóa tạm thời (Soft Delete - Đưa vào thùng rác)
 */
export const deleteDelivery = async (req, res) => {
    try {
        const isDeleted = await DeliveryModel.delete(req.params.id);
        if (!isDeleted) {
            return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại" });
        }
        res.status(200).json({ success: true, message: "Đã chuyển vào thùng rác (tự động xóa sau 30 ngày)" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa tạm thời: " + error.message });
    }
};

/**
 * 8. Xóa vĩnh viễn (Hard Delete)
 */
export const permanentlyDeleteDelivery = async (req, res) => {
    try {
        const isDeleted = await DeliveryModel.permanentlyDelete(req.params.id);
        if (!isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Đơn hàng không tồn tại trong thùng rác để xóa vĩnh viễn"
            });
        }
        res.status(200).json({ success: true, message: "Đã xóa vĩnh viễn đơn hàng khỏi hệ thống" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa vĩnh viễn: " + error.message });
    }
};