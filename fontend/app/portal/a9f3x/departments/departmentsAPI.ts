import api from '@/lib/api';

// Lấy danh sách phòng ban
export const fetchDepartments = async () => {
  try {
    const response = await api.get("/departments");
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Lỗi kết nối" };
  }
};

// Lọc tài khoản theo ID phòng ban
export const fetchUsersByDepartment = async (departmentId: string) => {
  try {
    const response = await api.get(`/departments/${departmentId}/users`);
    return response.data;
  } catch (error: any) {
    return { success: false, data: [], message: "Không thể tải danh sách thành viên" };
  }
};

// Các hàm CRUD khác
export const createDepartment = async (data: { name: string; description?: string }) => {
  const response = await api.post("/departments", data);
  return response.data;
};

export const updateDepartment = async (id: number, data: { name: string; description?: string }) => {
  const response = await api.put(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id: number) => {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
};

export const moveUserToDepartment = async (userId: number, departmentId: number) => {
  const response = await api.patch(`/users/${userId}/department`, { departmentId });
  return response.data;
};

export const softDeleteUser = async (userId: number) => {
  const response = await api.patch(`/users/${userId}/soft-delete`);
  return response.data;
};