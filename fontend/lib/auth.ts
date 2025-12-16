import Cookies from 'js-cookie';
import { encryptData } from './encryption';

export interface AuthData {
  token: string;
  user: {
    id: number;
    username: string;
    role: "ADMIN" | "MANAGER" | "USER";
  };
}

/**
 * Lưu thông tin đăng nhập vào Cookies (đã mã hóa) và Storage
 */
export function saveAuth(data: AuthData, remember: boolean) {
  const expires = remember ? 7 : 1;

  Cookies.set('token', data.token, { expires, path: '/' });

  const encryptedRole = encryptData(data.user.role);
  Cookies.set('user_role', encryptedRole, { expires, path: '/' });

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("auth", JSON.stringify(data));
}

/**
 * HÀM MỚI: Kiểm tra Cookies còn tồn tại không. 
 * Nếu thiếu, xóa sạch dữ liệu và reload về trang login.
 */
export function validateAuthOrLogout() {
  if (typeof window === "undefined") return;

  const token = Cookies.get('token');
  const role = Cookies.get('user_role');

  // Nếu mất 1 trong 2 cookie quan trọng
  if (!token || !role) {
    console.warn("Cookies expired or missing. Logging out...");
    
    // Xóa sạch dấu vết
    Cookies.remove('token', { path: '/' });
    Cookies.remove('user_role', { path: '/' });
    localStorage.clear();
    sessionStorage.clear();

    // Reload lại trang để đưa về Login (Middleware sẽ chặn nếu cố vào Portal)
    window.location.href = "/login";
    return false;
  }
  return true;
}

export function logout() {
  Cookies.remove('token', { path: '/' });
  Cookies.remove('user_role', { path: '/' });
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/login";
}