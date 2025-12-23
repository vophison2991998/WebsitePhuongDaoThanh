import userModel from "../../models/adminModels/userModel.js";
import bcrypt from "bcrypt";

// Đảm bảo dùng đúng tên createNewAccount
export const createNewAccount = async (req, res) => {
  try {
    const { username, password, role_id, full_name, department_id } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userId = await userModel.createUser({
      username,
      password: hashedPassword,
      role_id,
      full_name,
      department_id
    });

    res.status(201).json({ success: true, userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi tạo tài khoản" });
  }
};

// Hàm lấy dữ liệu cũng phải đúng tên fetchAllData
export const fetchAllData = async (req, res) => {
  try {
    const data = await userModel.getManagementData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải dữ liệu" });
  }
};


export const deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    await userModel.deleteUser(id);
    res.status(200).json({ message: "Xóa tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa tài khoản" });
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    await userModel.updateUserRole(id, role_id);
    res.status(200).json({ message: "Cập nhật vai trò thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật vai trò" });
  }
};


export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await userModel.toggleUserStatus(id);
    
    if (success) {
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }
  } catch (error) {
    console.error("Error toggleStatus:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật trạng thái" });
  }
}