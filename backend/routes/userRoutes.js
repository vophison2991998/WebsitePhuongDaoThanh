import express from "express";
import { 
  fetchAllData, 
  createNewAccount, 
  deleteUserAccount, 
  changeUserRole,
  toggleStatus // Import hàm mới
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", fetchAllData);
router.post("/", createNewAccount);
router.delete("/:id", deleteUserAccount);
router.patch("/:id/role", changeUserRole);

// Route cho chức năng khóa/mở
router.patch("/:id/status", toggleStatus);

export default router;