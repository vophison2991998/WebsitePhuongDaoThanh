import express from "express";
import { 
  fetchAllData, 
  fetchTrashData,          // Lấy danh sách thùng rác
  createNewAccount, 
  toggleStatus,
  changeUserRole,
  changeUserDepartment,
  softDeleteUserAccount,   // Xóa tạm (vào thùng rác)
  restoreUserAccount,      // Khôi phục
  permanentlyDeleteAccount // Xóa vĩnh viễn
} from "../../controllers/adminControllers/userController.js";

const router = express.Router();

// --- NHÓM LẤY DỮ LIỆU ---
router.get("/", fetchAllData);
router.get("/trash", fetchTrashData);

// --- NHÓM TẠO MỚI ---
router.post("/", createNewAccount);

// --- NHÓM CẬP NHẬT TRẠNG THÁI & THÔNG TIN ---
router.patch("/:id/status", toggleStatus);
router.patch("/:id/role", changeUserRole);
router.patch("/:id/department", changeUserDepartment);

// --- NHÓM XỬ LÝ THÙNG RÁC ---
router.patch("/:id/soft-delete", softDeleteUserAccount); // Frontend gọi khi nhấn xóa ở danh sách chính
router.patch("/:id/restore", restoreUserAccount);      // Frontend gọi khi nhấn khôi phục ở thùng rác

// --- NHÓM XÓA VĨNH VIỄN ---
router.delete("/:id", permanentlyDeleteAccount);        // Frontend gọi khi nhấn xóa ở thùng rác

export default router;