import DeliveryModel from '../../models/adminModels/deliveryModel.js';

/**
 * 1. Lấy danh sách đơn hàng đang hoạt động (Chưa xóa)
 */
export const getDeliveries = async (req, res) => {
    try {
        const data = await DeliveryModel.getAll();
        res.status(200).json({ 
            success: true, 
            count: data.length,
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
            count: data.length,
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
        // Validation cơ bản
        if (!req.body.recipient_name || !req.body.quantity) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập tên người nhận và số lượng" });
        }

        const data = await DeliveryModel.create(req.body);
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
 * 4. Cập nhật thông tin (Tận dụng Dynamic Update của Model)
 */
export const updateDelivery = async (req, res) => {
    try {
        const data = await DeliveryModel.update(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy đơn hàng hoặc đơn đã bị xóa tạm thời" 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: "Cập nhật đơn hàng thành công", 
            data 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Lỗi cập nhật: " + error.message 
        });
    }
};

/**
 * 5. Cập nhật trạng thái (Dùng chung hàm update của Model)
 */
export const updateStatus = async (req, res) => {
    try {
        const { status_id } = req.body;
        if (!status_id) {
            return res.status(400).json({ success: false, message: "Thiếu mã trạng thái (status_id)" });
        }

        const data = await DeliveryModel.update(req.params.id, { status_id });
        if (!data) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng để cập nhật trạng thái" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Đã cập nhật trạng thái đơn hàng", 
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
                message: "Không tìm thấy đơn hàng trong thùng rác hoặc đã quá hạn 30 ngày"
            });
        }
        res.status(200).json({
            success: true,
            message: "Đã khôi phục đơn hàng về danh sách hoạt động",
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khôi phục: " + error.message });
    }
};

/**
 * 7. Xóa tạm thời (Soft Delete)
 */
export const deleteDelivery = async (req, res) => {
    try {
        const success = await DeliveryModel.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại hoặc đã xóa" });
        }
        res.status(200).json({ 
            success: true, 
            message: "Đã chuyển vào thùng rác. Bạn có 30 ngày để khôi phục trước khi bị xóa vĩnh viễn." 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi: " + error.message });
    }
};

/**
 * 8. Xóa vĩnh viễn (Hard Delete)
 */
export const permanentlyDeleteDelivery = async (req, res) => {
    try {
        const success = await DeliveryModel.permanentlyDelete(req.params.id);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: "Đơn hàng không tồn tại trong thùng rác"
            });
        }
        res.status(200).json({ success: true, message: "Đã xóa vĩnh viễn dữ liệu khỏi hệ thống" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa vĩnh viễn: " + error.message });
    }
};

/**
 * 9. Dọn dẹp thùng rác hệ thống
 */
export const cleanTrash = async (req, res) => {
    try {
        await DeliveryModel.autoCleanExpired();
        res.status(200).json({
            success: true,
            message: "Hệ thống đã thực hiện dọn dẹp các mục quá hạn 30 ngày"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi dọn dẹp: " + error.message });
    }
};