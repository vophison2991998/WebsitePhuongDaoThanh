"use client";

import React from 'react';
import Link from 'next/link';
// Import icons
import { 
    FaTruckLoading,  // Nhận Hàng (Receipt)
    FaSignOutAlt,    // Trả Nước (Issue/Dispense)
    FaBoxes,         // Tồn kho
    FaChartPie,      // Tổng quan
    FaCalendarCheck, // Lịch sử
    FaClipboardList, // KPI: Tổng giao dịch
    FaDollarSign     // KPI: Giá trị (giả định)
} from 'react-icons/fa';

// Định nghĩa URL cho các trang con (Dựa trên thiết kế trước)
const RECEIPT_PAGE_URL = '/portal/a9f3x/water/receipt'; 
const ISSUE_PAGE_URL = '/portal/a9f3x/water/issue';     
const DASHBOARD_URL = '/portal/a9f3x/water/dashboard';  
const HISTORY_URL = '/portal/a9f3x/water/history';      // Lịch sử Giao dịch

// --- Component 1: Card Thống kê Nhanh (KPI Summary) ---
interface KpiCardProps {
    title: string;
    value: number | string;
    unit: string;
    icon: React.ReactNode;
    color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, icon, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-md border-b-4" style={{ borderColor: color }}>
        <div className="flex items-center justify-between">
            <div className={`p-3 rounded-full text-white`} style={{ backgroundColor: color }}>
                {icon}
            </div>
            <div className="text-right">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-extrabold text-gray-900">
                    {value} 
                    <span className="text-lg font-semibold text-gray-600 ml-1">{unit}</span>
                </p>
            </div>
        </div>
    </div>
);

// --- Component 2: Card Chức năng Chính (Feature Card) ---
interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    bgColor: string; // Sử dụng mã màu Tailwind
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, href, bgColor }) => {
    // Lấy màu tương ứng cho hiệu ứng hover và nút
    const hoverColor = bgColor.replace('600', '700'); 
    const ringColor = bgColor.replace('600', '500').replace('bg-', 'focus:ring-');

    return (
        <Link href={href} passHref>
            <div className={`p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 bg-white hover:shadow-xl`}>
                <div className={`flex items-center justify-center w-14 h-14 rounded-full mb-4 text-white ${bgColor}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{description}</p>
                <button 
                    className={`w-full py-2 px-4 text-sm font-medium rounded-lg text-white ${bgColor} transition-colors hover:${hoverColor} focus:outline-none ${ringColor} focus:ring-2 focus:ring-offset-2`}
                >
                    Truy cập ngay
                </button>
            </div>
        </Link>
    );
};

// --- Trang Chính ---
const WaterLandingPage: React.FC = () => {
    
    // Dữ liệu giả định cho KPI
    const summaryKpis = [
        { title: "Tồn Kho Hiện Tại", value: 12500, unit: "Bình", icon: <FaBoxes size={20} />, color: "#3b82f6" }, // Blue
        { title: "Tổng Nhận (Tháng)", value: 3500, unit: "Bình", icon: <FaTruckLoading size={20} />, color: "#10b981" }, // Green
        { title: "Tổng Xuất (Tháng)", value: 2100, unit: "Bình", icon: <FaSignOutAlt size={20} />, color: "#f59e0b" }, // Orange
        { title: "Tổng GD (Tháng)", value: 56, unit: "Lần", icon: <FaClipboardList size={20} />, color: "#6366f1" }, // Indigo
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            
            {/* Header và Tiêu đề */}
            <header className="mb-8 p-4 bg-white rounded-xl shadow-md">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                    <FaBoxes className="mr-3 text-indigo-600" />
                    Quản Lý Kho Nước (WMS Portal)
                </h1>
                <p className="mt-2 text-lg text-gray-500">
                    Trang tổng quan và điều hướng nhanh đến các chức năng chính.
                </p>
            </header>

            {/* Khu vực 1: Thống kê Nhanh (KPI) */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 Thống kê Hoạt động (Tháng này)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {summaryKpis.map((kpi, index) => (
                    <KpiCard
                        key={index}
                        title={kpi.title}
                        value={kpi.value.toLocaleString('vi-VN')}
                        unit={kpi.unit}
                        icon={kpi.icon}
                        color={kpi.color}
                    />
                ))}
            </div>

            {/* Khu vực 2: Điều hướng Chức năng */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">🚀 Chức năng Chính</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Nhận Nước (Nhập kho) */}
                <FeatureCard
                    title="Nhận Nước (Nhập Kho)"
                    description="Ghi nhận số lượng bình nước mới nhận từ nhà cung cấp vào kho. Bắt đầu quy trình kiểm kê."
                    icon={<FaTruckLoading size={24} />}
                    href={RECEIPT_PAGE_URL}
                    bgColor="bg-green-600"
                />

                {/* 2. Trả Nước (Xuất kho/Sử dụng) */}
                <FeatureCard
                    title="Trả Nước (Xuất Kho)"
                    description="Quản lý việc xuất kho bình nước để giao cho khách hàng hoặc chuyển đến các bộ phận sử dụng."
                    icon={<FaSignOutAlt size={24} />}
                    href={ISSUE_PAGE_URL}
                    bgColor="bg-blue-600"
                />

                {/* 3. Tổng quan Tồn kho (Dashboard) */}
                <FeatureCard
                    title="Tổng Quan Tồn Kho"
                    description="Xem báo cáo và biểu đồ chi tiết về số lượng tồn kho, tỷ lệ luân chuyển và xu hướng nhập/xuất."
                    icon={<FaChartPie size={24} />}
                    href={DASHBOARD_URL}
                    bgColor="bg-indigo-600"
                />

                {/* 4. Lịch sử Giao dịch */}
                <FeatureCard
                    title="Lịch Sử Giao Dịch"
                    description="Tìm kiếm, lọc và xem lại tất cả các giao dịch Nhận và Trả nước đã được ghi nhận trong hệ thống."
                    icon={<FaCalendarCheck size={24} />}
                    href={HISTORY_URL}
                    bgColor="bg-yellow-600"
                />
            </div>
            
            <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                Hệ thống WMS | Powered by A9F3X
            </footer>
        </div>
    );
};

export default WaterLandingPage;