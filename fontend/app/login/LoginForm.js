"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { encryptData } from "@/lib/encryption";
import { useToast } from "@/components/ui/ToastContext";
import { ROUTE_MAP } from "@/lib/routeMap";

export default function LoginForm() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", formData);
      
      const { token, user } = response.data;

      // Kiểm tra: Chỉ cần có token và user là đủ (Backend của bạn không gửi trường 'success')
      if (token && user) {
        // 2. Lưu Token vào Cookie
        Cookies.set("token", token, { 
          expires: 1, 
          path: '/',
          sameSite: "lax" 
        });

        // 3. Mã hóa Role và lưu (Đảm bảo role là ADMIN, MANAGER, USER)
        const roleStr = user.role ? user.role.toUpperCase() : "USER";
        const encryptedRole = encryptData(roleStr);
        Cookies.set("user_role", encryptedRole, { expires: 1, path: '/' });

        showToast(`Xác thực thành công. Chào mừng ${user.full_name || 'Cán bộ'}`, "success");

        // 4. Lấy đường dẫn đích dựa trên Role từ ROUTE_MAP
        const targetPath = ROUTE_MAP[roleStr] || "/portal/u7p1z";

        // 5. Điều hướng
        setTimeout(() => {
          router.push(targetPath);
          // Refresh để middleware proxy.ts nhận diện cookie mới
          router.refresh();
        }, 500);
      } else {
        showToast("Máy chủ không trả về thông tin định danh hợp lệ", "error");
      }
    } catch (error) {
      console.error("Chi tiết lỗi:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Sai tài khoản hoặc mật khẩu công vụ";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Tên đăng nhập
        </label>
        <input
          required
          type="text"
          placeholder="Nhập tài khoản..."
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-700 outline-none transition-all font-bold text-slate-700 shadow-sm"
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Mật khẩu công vụ
        </label>
        <input
          required
          type="password"
          placeholder="••••••••"
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-700 outline-none transition-all font-bold text-slate-700 shadow-sm"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>

      <button
        disabled={loading}
        type="submit"
        className="w-full bg-[#A80000] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang xác thực...
          </>
        ) : (
          "Xác nhận danh tính"
        )}
      </button>
    </form>
  );
}