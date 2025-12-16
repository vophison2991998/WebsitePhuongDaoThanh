'use client'; 
// Dùng 'use client' vì đây là component tương tác (sử dụng useState, useMemo)

import React, { useState, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrashAlt, FaExchangeAlt, FaSearch } from 'react-icons/fa';

// --- MÔ HÌNH DỮ LIỆU GIẢ ĐỊNH (THƯỜNG ĐẶT Ở /src/models HOẶC /src/types) ---

/** Định nghĩa các loại trạng thái thiết bị */
const DEVICE_STATUS = {
    ACTIVE: 'Hoạt động',
    MAINTENANCE: 'Bảo trì',
    BROKEN: 'Hỏng',
    STORED: 'Đang lưu kho'
} as const;

type DeviceStatus = keyof typeof DEVICE_STATUS;

/** Định nghĩa cấu trúc dữ liệu thiết bị */
interface Device {
    id: string;
    assetId: string;
    name: string;
    serialNumber: string;
    type: string;
    status: DeviceStatus;
    currentUserName?: string;
    currentDepartment?: string;
    purchaseDate: string;
    warrantyEndDate?: string;
}

/** Dữ liệu mẫu (thường sẽ được Fetch từ API) */
const DUMMY_DEVICES: Device[] = [
    { 
        id: 'dev1', assetId: 'LP-001', name: 'Laptop Dell Latitude 5420', serialNumber: 'SN4535T5', type: 'Laptop', 
        status: 'ACTIVE', currentUserName: 'Nguyễn Văn A', currentDepartment: 'Kỹ thuật', 
        purchaseDate: '2023-01-15', warrantyEndDate: '2025-01-15' 
    },
    { 
        id: 'dev2', assetId: 'MN-005', name: 'Màn hình Samsung 27"', serialNumber: 'SN9988G', type: 'Màn hình', 
        status: 'STORED', purchaseDate: '2023-05-20' 
    },
    { 
        id: 'dev3', assetId: 'LP-010', name: 'Laptop HP ProBook G7', serialNumber: 'SN1122Q', type: 'Laptop', 
        status: 'MAINTENANCE', currentUserName: 'Trần Thị C', currentDepartment: 'Kinh doanh', 
        purchaseDate: '2024-03-01' 
    },
    { 
        id: 'dev4', assetId: 'PC-002', name: 'Máy tính để bàn Gaming', serialNumber: 'SNX2000', type: 'PC', 
        status: 'BROKEN', purchaseDate: '2022-10-10' 
    },
];

// --- COMPONENTS PHỤ TRỢ ---

/** * Component hiển thị trạng thái thiết bị dưới dạng Badge màu 
 */
const StatusBadge: React.FC<{ status: DeviceStatus }> = ({ status }) => {
  let color = 'bg-gray-500';
  let label = DEVICE_STATUS[status];
  
  switch (status) {
    case 'ACTIVE':
      color = 'bg-green-500';
      break;
    case 'MAINTENANCE':
      color = 'bg-yellow-500';
      break;
    case 'BROKEN':
      color = 'bg-red-500';
      break;
    case 'STORED':
        color = 'bg-blue-500';
        break;
    default:
        color = 'bg-gray-500';
  }

  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded-full ${color}`}>
      {label}
    </span>
  );
};

/** * Component hiển thị tổng quan thống kê nhanh 
 */
const SummaryCards: React.FC<{ devices: Device[] }> = ({ devices }) => {
    const total = devices.length;
    const active = devices.filter(d => d.status === 'ACTIVE').length;
    const maintenance = devices.filter(d => d.status === 'MAINTENANCE').length;
    const broken = devices.filter(d => d.status === 'BROKEN').length;
    
    const summaryData = [
        { title: "Tổng số Thiết bị", value: total, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { title: "Đang Hoạt động", value: active, color: 'text-green-600', bgColor: 'bg-green-50' },
        { title: "Cần Bảo trì", value: maintenance, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
        { title: "Hỏng/Thanh lý", value: broken, color: 'text-red-600', bgColor: 'bg-red-50' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {summaryData.map((item) => (
                <div key={item.title} className={`p-5 rounded-lg shadow-md ${item.bgColor}`}>
                    <p className="text-sm font-medium text-gray-500">{item.title}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</h3>
                </div>
            ))}
        </div>
    );
};


// --- COMPONENT CHÍNH: DEVICE LIST PAGE ---

const DeviceListPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<DeviceStatus | 'ALL'>('ALL');
    
    // Giả định dữ liệu được lấy từ API hoặc Context
    const devices = DUMMY_DEVICES; 

    // Logic lọc và tìm kiếm
    const filteredDevices = useMemo(() => {
        return devices.filter(device => {
            const matchSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                device.assetId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = filterStatus === 'ALL' || device.status === filterStatus;
            
            return matchSearch && matchStatus;
        });
    }, [devices, searchTerm, filterStatus]);

    // --- Các hàm xử lý hành động (chỉ là giả định) ---
    const handleCreate = () => { console.log('Action: Chuyển hướng đến form tạo mới...'); /* router.push('/portal/a9f3x/devices/add') */ };
    const handleEdit = (id: string) => { console.log(`Action: Chuyển hướng đến form sửa thiết bị ID: ${id}`); /* router.push(`/portal/a9f3x/devices/${id}/edit`) */ };
    const handleDelete = (id: string) => { console.log(`Action: Xóa thiết bị ID: ${id}`); /* Mở Modal xác nhận xóa */ };
    const handleTransfer = (id: string) => { console.log(`Action: Mở form Bàn Giao (Nhận/Trả) cho ID: ${id}`); /* Mở Modal Bàn Giao */ };
    const handleDetail = (id: string) => { console.log(`Action: Xem chi tiết thiết bị ID: ${id}`); /* router.push(`/portal/a9f3x/devices/${id}`) */ };


    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">🛠️ Quản lý Thiết bị & Tài sản</h1>
            
            {/* 1. KHU VỰC THỐNG KÊ NHANH */}
            <SummaryCards devices={devices} />

            {/* 2. THANH CÔNG CỤ VÀ BỘ LỌC */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center border-b border-gray-200">
                
                {/* LỌC VÀ TÌM KIẾM */}
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm theo Tên, Mã tài sản..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    </div>
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as DeviceStatus | 'ALL')}
                        className="p-2 border border-gray-300 rounded-md"
                    >
                        <option value="ALL">Tất cả Trạng thái</option>
                        {Object.keys(DEVICE_STATUS).map((statusKey) => (
                            <option key={statusKey} value={statusKey}>
                                {DEVICE_STATUS[statusKey as DeviceStatus]}
                            </option>
                        ))}
                    </select>
                    {/* Thêm dropdown lọc Loại thiết bị, Phòng ban nếu cần */}
                </div>

                {/* NÚT THAO TÁC */}
                <button 
                  onClick={handleCreate} 
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 transition duration-150 flex items-center gap-2"
                >
                  <FaPlus /> Tạo Thiết bị Mới
                </button>
            </div>

            {/* 3. BẢNG DANH SÁCH */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Tài sản</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Thiết bị</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người đang giữ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng ban</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDevices.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 cursor-pointer" onClick={() => handleDetail(device.id)}>
                                    {device.assetId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={device.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{device.currentUserName || 'Kho/Chưa giao'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{device.currentDepartment || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button title="Chỉnh sửa" onClick={() => handleEdit(device.id)} className="text-blue-600 hover:text-blue-900 mx-2">
                                        <FaEdit size={16} />
                                    </button>
                                    <button title="Bàn giao/Thu hồi" onClick={() => handleTransfer(device.id)} className="text-yellow-600 hover:text-yellow-900 mx-2">
                                        <FaExchangeAlt size={16} />
                                    </button>
                                    <button title="Xóa" onClick={() => handleDelete(device.id)} className="text-red-600 hover:text-red-900 mx-2">
                                        <FaTrashAlt size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredDevices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Không tìm thấy thiết bị nào phù hợp với bộ lọc.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* LƯU Ý: Modal Bàn Giao/Thu Hồi sẽ được gọi ra từ component này */}
            {/* <DeviceTransferModal /> */}
        </div>
    );
};

export default DeviceListPage;