import axios from 'axios';
import Cookies from 'js-cookie';

// Cấu hình URL cơ sở của Backend
const API_URL = 'http://localhost:5000/api';

/**
 * Khởi tạo một instance axios dùng chung
 * Giúp quản lý Header và Base URL tập trung
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor cho Request: 
 * Chạy trước khi yêu cầu được gửi lên Server.
 * Nó sẽ lấy Token mới nhất từ Cookie để đính vào Header.
 */
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      // Đính kèm Token theo định dạng Bearer (phổ biến cho JWT)
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor cho Response:
 * Xử lý các lỗi hệ thống như Token hết hạn (401)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Phiên đăng nhập hết hạn hoặc không hợp lệ.");
      // Tùy chọn: Xóa cookie và đẩy người dùng về trang login nếu cần
      // Cookies.remove('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * HÀM API: Lấy danh sách toàn bộ cán bộ (Dành cho ADMIN)
 * Sử dụng tại các trang Quản trị Portal
 */
export const fetchAllUsers = async () => {
  try {
    const response = await api.get('/users');
    // Trả về dữ liệu thô từ backend
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * HÀM API: Lấy thông tin cá nhân của người đang đăng nhập
 */
export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;