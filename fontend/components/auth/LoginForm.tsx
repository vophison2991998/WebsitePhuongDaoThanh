"use client";

import { useState } from "react";
import { FaUser, FaSignInAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import PasswordInput from "./PasswordInput";
import RememberMe from "./RememberMe";
import { loginApi } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/ToastContext";
import { ROUTE_MAP } from "@/lib/routeMap";

export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Kiểm tra dữ liệu đầu vào
    if (!username || !password) {
      toast.warning("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      // 2. Gọi API đăng nhập
      const data = await loginApi({ username, password });

      // 3. Lưu token và thông tin user vào Cookie & Storage
      // Đảm bảo lib/auth.ts của bạn đã dùng js-cookie để lưu 'token' và 'user_role'
      saveAuth(data, remember);
      
      toast.success("Đăng nhập thành công! Đang chuyển hướng...");

      // 4. Lấy role từ dữ liệu trả về (Ví dụ: "ADMIN", "MANAGER", "USER")
      const userRole = data.user.role; 

      // 5. Thực hiện điều hướng
      // Sử dụng window.location.assign thay vì router.push để trình duyệt tải lại cứng (Hard Reload)
      // Việc này giúp các thư mục mã hóa nhận diện Cookie ngay lập tức.
      setTimeout(() => {
        let targetPath = "";
        
        switch (userRole) {
          case "ADMIN":
            targetPath = ROUTE_MAP.ADMIN; // Đường dẫn: /portal/a9f3x
            break;
          case "MANAGER":
            targetPath = ROUTE_MAP.MANAGER; // Đường dẫn: /portal/m2k8q
            break;
          case "USER":
            targetPath = ROUTE_MAP.USER; // Đường dẫn: /portal/u7p1z
            break;
          default:
            toast.error("Tài khoản không có quyền truy cập hệ thống");
            setLoading(false);
            return;
        }

        if (targetPath) {
          window.location.assign(targetPath);
        }
      }, 1000); 

    } catch (err) {
      toast.error("Tài khoản hoặc mật khẩu không chính xác");
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      {/* INPUT TÀI KHOẢN */}
      <div className="mb-5">
        <label className="block text-sm mb-1 text-gray-600">Tài khoản</label>
        <div className="relative group">
          <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full pl-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="Nhập tài khoản"
          />
        </div>
      </div>

      {/* INPUT MẬT KHẨU */}
      <PasswordInput 
        password={password} 
        setPassword={setPassword} 
      />
      
      {/* GHI NHỚ ĐĂNG NHẬP */}
      <RememberMe 
        value={remember} 
        onChange={setRemember} 
      />

      {/* NÚT ĐĂNG NHẬP */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <FaSignInAlt />
        {loading ? "Đang xử lý..." : "Đăng nhập"}
      </button>

      <div className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest">
        Cổng xác thực tập trung - SSO
      </div>
    </div>
  );
}