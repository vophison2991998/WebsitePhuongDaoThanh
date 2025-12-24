import userModel from "../../models/adminModels/userModel.js";
import bcrypt from "bcrypt";

/**
 * 1. Lấy toàn bộ danh sách cán bộ đang hoạt động, vai trò và phòng ban
 */
export const fetchAllData = async (req, res) => {
  try {
    const data = await userModel.getManagementData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetchAllData:", error);
    res.status(500).json({ message: "Lỗi tải dữ liệu hệ thống" });
  }
};

/**
 * 2. Lấy danh sách cán bộ trong thùng rác
 */
export const fetchTrashData = async (req, res) => {
  try {
    const data = await userModel.getTrashData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetchTrashData:", error);
    res.status(500).json({ message: "Lỗi tải dữ liệu thùng rác" });
  }
};

/**
 * 3. Tạo tài khoản cán bộ mới
 */
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

    res.status(201).json({ success: true, userId, message: "Đã tạo tài khoản thành công" });
  } catch (error) {
    console.error("Error createNewAccount:", error);
    res.status(500).json({ message: "Lỗi tạo tài khoản hoặc tên đăng nhập đã tồn tại" });
  }
};

/**
 * 4. Xóa tạm cán bộ (Đưa vào thùng rác)
 */
export const softDeleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await userModel.softDeleteUser(id);
    
    if (success) {
      res.status(200).json({ message: "Đã chuyển cán bộ vào thùng rác" });
    } else {
      res.status(404).json({ message: "Tài khoản không tồn tại" });
    }
  } catch (error) {
    console.error("Error softDelete:", error);
    res.status(500).json({ message: "Lỗi khi thực hiện xóa tạm" });
  }
};

/**
 * 5. Khôi phục cán bộ từ thùng rác
 */
export const restoreUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await userModel.restoreUser(id);
    
    if (success) {
      res.status(200).json({ message: "Khôi phục tài khoản thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy hồ sơ để khôi phục" });
    }
  } catch (error) {
    console.error("Error restoreUserAccount:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi khôi phục" });
  }
};

/**
 * 6. Xóa vĩnh viễn tài khoản khỏi cơ sở dữ liệu
 */
export const permanentlyDeleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await userModel.deleteUserPermanently(id);
    
    if (success) {
      res.status(200).json({ message: "Đã xóa vĩnh viễn tài khoản" });
    } else {
      res.status(404).json({ message: "Tài khoản không tồn tại" });
    }
  } catch (error) {
    console.error("Error deletePermanently:", error);
    res.status(500).json({ message: "Không thể xóa do ràng buộc dữ liệu hệ thống" });
  }
};

/**
 * 7. Cập nhật phòng ban
 */
export const changeUserDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id } = req.body;
    const success = await userModel.updateUserDepartment(id, department_id);

    if (success) {
      res.status(200).json({ message: "Cập nhật đơn vị công tác thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy hồ sơ cán bộ" });
    }
  } catch (error) {
    console.error("Error changeUserDepartment:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật phòng ban" });
  }
};

/**
 * 8. Thay đổi vai trò
 */
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    const success = await userModel.updateUserRole(id, role_id);
    
    if (success) {
      res.status(200).json({ message: "Cập nhật vai trò thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }
  } catch (error) {
    console.error("Error changeUserRole:", error);
    res.status(500).json({ message: "Lỗi cập nhật vai trò" });
  }
};

/**
 * 9. Khóa/Mở khóa trạng thái (is_active)
 */
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
};