import React from 'react';
import { FaUserShield, FaUsers, FaExchangeAlt, FaExclamationTriangle, FaCheckCircle, FaChartLine } from 'react-icons/fa';
// Giả định bạn có các component tùy chỉnh cho Biểu đồ và Card
// import { KpiCard } from './components/KpiCard'; 
// import { LineChart } from './components/LineChart'; 
// import { ActivityLog } from './components/ActivityLog'; 

// Dữ liệu giả định
const kpiData = [
  { 
    title: "Tổng số Người dùng", 
    value: "12,450", 
    change: "+12.5%", 
    color: "text-green-500", 
    icon: <FaUsers className="text-3xl" /> 
  },
  { 
    title: "Trạng thái Hệ thống", 
    value: "99.9% Uptime", 
    change: "Ổn định", 
    color: "text-blue-500", 
    icon: <FaCheckCircle className="text-3xl" /> 
  },
  { 
    title: "Giao dịch Phát sinh", 
    value: "5,892", 
    change: "-3.2%", 
    color: "text-red-500", 
    icon: <FaExchangeAlt className="text-3xl" /> 
  },
  { 
    title: "Lỗi cần xử lý", 
    value: "14", 
    change: "Cao", 
    color: "text-red-600", 
    icon: <FaExclamationTriangle className="text-3xl" /> 
  },
];

const mockActivityLog = [
    { time: "12:50 PM", user: "Admin A", action: "Đăng nhập thành công", status: "Thành công" },
    { time: "12:45 PM", user: "Hệ thống", action: "Cập nhật dữ liệu", status: "Thành công" },
    { time: "12:40 PM", user: "User X", action: "Thực hiện giao dịch", status: "Thất bại" },
    { time: "12:35 PM", user: "Admin B", action: "Thay đổi cấu hình", status: "Cảnh báo" },
];

const SystemDashboard = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* 1. Header & Bộ lọc thời gian */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaUserShield className="mr-3 text-indigo-600" />
          Tổng quan Hệ thống
        </h1>
        <div className="flex space-x-2 text-sm">
          <button className="px-3 py-1 border rounded-md bg-indigo-600 text-white">Tháng này</button>
          <button className="px-3 py-1 border rounded-md bg-white hover:bg-gray-100">Tuần này</button>
          <button className="px-3 py-1 border rounded-md bg-white hover:bg-gray-100">Tùy chỉnh</button>
        </div>
      </div>
      
      {/* 2. Khu vực Chỉ số Hiệu suất Chính (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <div 
            key={index} 
            className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition duration-300 cursor-pointer border-l-4 border-indigo-500"
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-500 uppercase">{kpi.title}</p>
              <div className={kpi.color}>{kpi.icon}</div>
            </div>
            <div className="mt-1">
              <p className="text-4xl font-extrabold text-gray-900">{kpi.value}</p>
              <p className={`text-sm mt-1 font-semibold ${kpi.color}`}>{kpi.change} (so với kỳ trước)</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Khu vực Biểu đồ & Phân tích chuyên sâu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Biểu đồ Xu hướng (Chiếm 2/3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaChartLine className="mr-2 text-indigo-500" />
            Xu hướng Lưu lượng truy cập (30 Ngày)
          </h2>
          {/* Thay thế bằng component biểu đồ thực tế của bạn (ví dụ: Chart.js, Recharts) */}
          <div className="h-64 flex items-center justify-center bg-gray-50 border border-dashed rounded-md text-gray-400">
            [ Placeholder: Biểu đồ đường (Line Chart) Lưu lượng ]
          </div>
        </div>
        
        {/* Phân phối Dữ liệu (Chiếm 1/3) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Phân phối Loại Người dùng</h2>
          {/* Thay thế bằng component biểu đồ tròn */}
          <div className="h-64 flex items-center justify-center bg-gray-50 border border-dashed rounded-md text-gray-400">
            [ Placeholder: Biểu đồ tròn (Donut Chart) ]
          </div>
        </div>
      </div>

      {/* 4. Khu vực Bảng & Nhật ký (Activity Log) */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📜 Nhật ký Hoạt động Gần đây</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-2">Thời gian</th>
              <th className="px-4 py-2">Người dùng/Hệ thống</th>
              <th className="px-4 py-2">Hành động</th>
              <th className="px-4 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockActivityLog.map((log, index) => (
              <tr key={index} className="hover:bg-gray-50 text-sm">
                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{log.time}</td>
                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{log.user}</td>
                <td className="px-4 py-2 whitespace-nowrap">{log.action}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span 
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.status === 'Thành công' ? 'bg-green-100 text-green-800' :
                        log.status === 'Thất bại' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right mt-4">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Xem tất cả nhật ký &rarr;</button>
        </div>
      </div>
      
    </div>
  );
};

export default SystemDashboard;