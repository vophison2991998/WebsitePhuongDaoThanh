// fontend\components\layout\sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { decryptData } from "@/lib/encryption";
import { 
  FaHome, FaTasks, FaClipboardList, FaUserAlt, 
  FaUsersCog, FaChartBar, FaUserShield ,FaBuilding ,FaLaptopHouse , FaTint , FaFileUpload
} from "react-icons/fa";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const encryptedRole = Cookies.get("user_role");
    if (encryptedRole) {
      const decryptedRole = decryptData(encryptedRole);
      setRole(decryptedRole);
    }
  }, []);

  // Cấu hình menu cho từng loại tài khoản
  const menuConfig = {
ADMIN: [
      { name: "Tổng quan hệ thống", path: "/portal/a9f3x", icon: <FaUserShield /> },

      {
        name: "Quản lý Thiết bị",
        path: "/portal/a9f3x/devices",
        icon: <FaLaptopHouse />
      },

      {
        name: "Quản lý Nước Uống",
        path: "/portal/a9f3x/water",
        icon: <FaTint />
      },

      { name: "Quản lý nhân sự", path: "/portal/a9f3x/users", icon: <FaUsersCog /> },
      { name: "Quản lý phòng ban", path: "/portal/a9f3x/departments", icon: <FaBuilding /> },

      { name: "Phân công công việc", path: "/portal/a9f3x/tasks", icon: <FaTasks /> },

      // >>> MỤC MỚI ĐƯỢC THÊM <<<
      {
        name: "Tài liệu Công việc", // Trang upload file PDF và Hình ảnh
        path: "/portal/a9f3x/task-files", // Đường dẫn mới
        icon: <FaFileUpload /> // Icon upload file
      },

      { name: "Báo cáo thống kê", path: "/portal/a9f3x/reports", icon: <FaChartBar /> },
],
    MANAGER: [
      { name: "Bảng điều khiển", path: "/portal/m2k8q", icon: <FaChartBar /> },
      { name: "Quản lý nhóm", path: "/portal/m2k8q/team", icon: <FaUsersCog /> },
      { name: "Theo dõi tiến độ", path: "/portal/m2k8q/tracking", icon: <FaClipboardList /> },
    ],
    USER: [
      { name: "Công việc của tôi", path: "/portal/u7p1z", icon: <FaTasks /> },
      { name: "Lịch làm việc", path: "/portal/u7p1z/calendar", icon: <FaClipboardList /> },
    ],
    COMMON: [
      { name: "Thông tin cá nhân", path: "/portal/profile", icon: <FaUserAlt /> },
    ]
  };

  // Lấy danh sách menu dựa trên role
  const currentMenu = role ? [...(menuConfig[role as keyof typeof menuConfig] || []), ...menuConfig.COMMON] : [];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-16 overflow-y-auto border-r border-slate-800">
      <nav className="mt-6 px-4">
        <div className="mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Chức năng {role}
        </div>
        {currentMenu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
              pathname === item.path 
                ? "bg-blue-600 shadow-lg shadow-blue-900/20 text-white" 
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}