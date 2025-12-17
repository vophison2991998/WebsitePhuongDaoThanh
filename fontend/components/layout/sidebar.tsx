// fontend\components\layout\sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { decryptData } from "@/lib/encryption";
import {
  FaHome, FaTasks, FaClipboardList, FaUserAlt,
  FaUsersCog, FaChartBar, FaUserShield, FaBuilding, FaLaptopHouse, FaTint, FaFileUpload, FaTruckLoading, FaTruckMoving,
  FaAngleDown, FaAngleUp // Thêm icon cho trạng thái mở/đóng menu con
} from "react-icons/fa";

// Định nghĩa kiểu dữ liệu cho mục menu
interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
  children?: MenuItem[]; // Thêm thuộc tính children
}

// =================================================================
// Component phụ: Xử lý hiển thị từng mục menu (có hoặc không có con)
// =================================================================
const SidebarItem = ({ item }: { item: MenuItem }) => {
  const pathname = usePathname();
  // Kiểm tra xem đường dẫn hiện tại có thuộc về bất kỳ mục con nào không
  const isParentActive = item.children 
    ? item.children.some(child => pathname.startsWith(child.path)) || pathname === item.path
    : pathname === item.path;

  // Sử dụng state để quản lý trạng thái mở/đóng của menu con
  const [isOpen, setIsOpen] = useState(isParentActive);

  useEffect(() => {
      // Đảm bảo menu con được mở nếu đang ở trong đường dẫn con
      if (item.children) {
          if (isParentActive) {
              setIsOpen(true);
          }
      }
  }, [isParentActive, item.children]);

  // CSS chung cho tất cả các mục menu
  const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 text-sm font-medium";
  
  // 1. Nếu là mục cha có con (Quản lý Nước Uống)
  if (item.children && item.children.length > 0) {
    return (
      <>
        {/* Mục cha (có chức năng toggle) */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`${baseClasses} cursor-pointer ${
            isParentActive
              ? "bg-slate-700 text-white" // Nền khác nếu là mục cha đang active
              : "text-gray-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="flex-1">{item.name}</span>
          {isOpen ? <FaAngleUp className="w-4 h-4" /> : <FaAngleDown className="w-4 h-4" />}
        </div>

        {/* Danh sách mục con (Dropdown) */}
        {isOpen && (
          <div className="ml-4 border-l border-slate-700 pl-4 py-1">
            {item.children.map((child) => (
              <Link
                key={child.path}
                href={child.path}
                className={`${baseClasses} !py-2 !px-3 !mb-1 ${
                  pathname === child.path
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-base">{child.icon}</span>
                <span className="text-sm">{child.name}</span>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // 2. Nếu là mục đơn lẻ (Không có con)
  return (
    <Link
      href={item.path}
      className={`${baseClasses} ${
        isParentActive
          ? "bg-blue-600 shadow-lg shadow-blue-900/20 text-white"
          : "text-gray-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="text-lg">{item.icon}</span>
      <span className="text-sm font-medium">{item.name}</span>
    </Link>
  );
};


// =================================================================
// Component chính: Sidebar
// =================================================================
export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const encryptedRole = Cookies.get("user_role");
    if (encryptedRole) {
      const decryptedRole = decryptData(encryptedRole);
      setRole(decryptedRole);
    }
  }, []);

  // Cấu hình menu cho từng loại tài khoản (Đã thêm type cho children)
  const menuConfig: { [key: string]: MenuItem[] } = {
    ADMIN: [
      { name: "Tổng quan hệ thống", path: "/portal/a9f3x", icon: <FaUserShield /> },

      // --- Quản lý Tài sản & Kho ---
      {
          name: "Quản lý Thiết bị",
          path: "/portal/a9f3x/devices",
          icon: <FaLaptopHouse />
      },
      {
        name: "Quản lý Nước Uống",
        path: "/portal/a9f3x/water", // Đường dẫn trang tổng quan Water Dashboard
        icon: <FaTint />,
        // Định nghĩa các mục con (Sub-items)
        children: [
          {
            name: "Tổng quan (Nước)",
            path: "/portal/a9f3x/water",
            icon: <FaChartBar />
          },
          {
            name: "Nhận Nước Vào Kho",
            path: "/portal/a9f3x/water/receipt",
            icon: <FaTruckLoading /> 
          },
          {
            name: "Trả Nước Ra Kho",
            path: "/portal/a9f3x/water/delivery",
            icon: <FaTruckMoving /> 
          },
        ]
      },

      // --- Quản lý Tổ chức & Nhân sự ---
      { name: "Quản lý nhân sự", path: "/portal/a9f3x/users", icon: <FaUsersCog /> },
      { name: "Quản lý phòng ban", path: "/portal/a9f3x/departments", icon: <FaBuilding /> },

      // --- Quản lý Công việc & Tài liệu ---
      { name: "Phân công công việc", path: "/portal/a9f3x/tasks", icon: <FaTasks /> },
      {
          name: "Tài liệu Công việc",
          path: "/portal/a9f3x/task-files",
          icon: <FaFileUpload />
      },

      // --- Báo cáo ---
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
  const currentMenu = role ? [...(menuConfig[role] || []), ...menuConfig.COMMON] : [];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-16 overflow-y-auto border-r border-slate-800">
      <nav className="mt-6 px-4">
        <div className="mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Chức năng {role}
        </div>
        {currentMenu.map((item) => (
          <SidebarItem key={item.path} item={item} />
        ))}
      </nav>
    </aside>
  );
}