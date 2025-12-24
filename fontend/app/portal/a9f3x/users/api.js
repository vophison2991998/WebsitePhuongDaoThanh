import api from "../../../login/API.js"; // Đảm bảo đường dẫn này đúng với file axios config của bạn

export const UserAPI = {
    // Lấy danh sách cán bộ đang hoạt động
    fetchData: () => api.get("/users"),

    // Lấy danh sách cán bộ trong thùng rác (MỚI)
    fetchTrash: () => api.get("/users/trash"),

    // Tạo tài khoản mới
    create: (payload) => api.post("/users", payload),

    // Khóa/Mở khóa tài khoản
    toggleStatus: (id) => api.patch(`/users/${id}/status`),

    // Cập nhật vai trò
    updateRole: (id, roleId) => api.patch(`/users/${id}/role`, { role_id: roleId }),

    // Điều chuyển phòng ban
    updateDepartment: (id, deptId) => api.patch(`/users/${id}/department`, { department_id: deptId }),

    // Xóa tạm vào thùng rác (MỚI)
    softDelete: (id) => api.patch(`/users/${id}/soft-delete`),

    // Khôi phục từ thùng rác (MỚI)
    restore: (id) => api.patch(`/users/${id}/restore`),

    // Xóa vĩnh viễn khỏi Database
    delete: (id) => api.delete(`/users/${id}`),
};