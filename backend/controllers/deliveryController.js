import DeliveryModel from '../models/deliveryModel.js';

// Lấy danh sách
export const getDeliveries = async (req, res) => {
    try {
        const data = await DeliveryModel.getAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm mới
export const createDelivery = async (req, res) => {
    try {
        const data = await DeliveryModel.create(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật thông tin (Sửa)
export const updateDelivery = async (req, res) => {
    try {
        const data = await DeliveryModel.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật trạng thái (Chỉ sửa status)
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const data = await DeliveryModel.updateStatus(req.params.id, status);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa
export const deleteDelivery = async (req, res) => {
    try {
        await DeliveryModel.delete(req.params.id);
        res.status(200).json({ success: true, message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};