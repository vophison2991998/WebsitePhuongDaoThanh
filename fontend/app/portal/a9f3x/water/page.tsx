// app/portal/a9f3x/water/page.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { FaTint, FaDownload, FaUpload, FaFilter, FaEdit, FaTrashAlt } from 'react-icons/fa';
// Import TransactionModal (đã thiết kế code mẫu ở phản hồi trước)

// Dữ liệu và kiểu mẫu
type WaterType = 'Binh_20L' | 'Thung_5L' | 'Chai_1L';
type TransactionType = 'IN' | 'OUT';

interface WaterTransaction {
    id: string; type: TransactionType; transactionDate: string;
    waterType: WaterType; quantity: number; actorName: string;
    relatedEntity: string; notes: string;
}

const DUMMY_TRANSACTIONS: WaterTransaction[] = [
    { id: 'W001', type: 'IN', transactionDate: '2025-12-15T09:00:00', waterType: 'Binh_20L', quantity: 50, actorName: 'Lê Văn B', relatedEntity: 'Công ty Lavie', notes: 'Nhập hàng định kỳ tháng 12' },
    { id: 'W002', type: 'OUT', transactionDate: '2025-12-15T10:30:00', waterType: 'Binh_20L', quantity: 5, actorName: 'Nguyễn Thị D', relatedEntity: 'Phòng Kế toán', notes: 'Phân phát cho tầng 3' },
    { id: 'W003', type: 'OUT', transactionDate: '2025-12-14T15:00:00', waterType: 'Thung_5L', quantity: 20, actorName: 'Trần Văn E', relatedEntity: 'Phòng IT', notes: 'Dự trữ cho khu vực máy chủ' },
    { id: 'W004', type: 'OUT', transactionDate: '2025-12-14T15:00:00', waterType: 'Binh_20L', quantity: 1, actorName: 'Trần Văn E', relatedEntity: 'Phòng IT', notes: 'Gấp' },
];

const WaterTransactionPage: React.FC = () => {
    const [transactions, setTransactions] = useState(DUMMY_TRANSACTIONS);
    const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<WaterTransaction | null>(null);

    // Tính toán Tồn Kho (Logic StockCards)
    const currentStock = useMemo(() => {
        const stock: Record<WaterType, number> = { 'Binh_20L': 0, 'Thung_5L': 0, 'Chai_1L': 0 };
        transactions.forEach(t => {
            if (t.type === 'IN') {
                stock[t.waterType] += t.quantity;
            } else if (t.type === 'OUT') {
                stock[t.waterType] -= t.quantity;
            }
        });
        return stock;
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (filterType === 'ALL') return transactions;
        return transactions.filter(t => t.type === filterType);
    }, [transactions, filterType]);

    // Xử lý tạo mới và sửa giao dịch
    const handleOpenModal = (type: TransactionType | null = null, transaction: WaterTransaction | null = null) => {
        if (transaction) {
            setEditingTransaction(transaction);
        } else {
            setEditingTransaction(type ? { ...DUMMY_TRANSACTIONS[0], type, id: '' } : null); // Dùng type để mặc định
        }
        setIsModalOpen(true);
    };

    // Hàm giả định lưu giao dịch (Tạo/Sửa)
    const handleSaveTransaction = (data: Omit<WaterTransaction, 'id'>) => {
        // Logic save/update ở đây
        setIsModalOpen(false);
    };

    const getTransactionTypeLabel = (type: TransactionType) => type === 'IN' ? 'Nhận (Nhập Kho)' : 'Trả (Phân Phát)';
    const getTransactionTypeColor = (type: TransactionType) => type === 'IN' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaTint /> Quản lý Giao dịch Nước Uống
            </h1>

            {/* 1. THỐNG KÊ TỒN KHO (STOCK CARDS LOGIC) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(currentStock).map(([key, value]) => (
                    <StockCard key={key} waterType={key as WaterType} stock={value} />
                ))}
            </div>

            {/* 2. THANH CÔNG CỤ VÀ BỘ LỌC */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
                
                {/* NÚT HÀNH ĐỘNG */}
                <div className="flex gap-4">
                    <button 
                        onClick={() => handleOpenModal('IN')} 
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 flex items-center gap-2"
                    >
                        <FaDownload /> Nhập Kho (Nhận)
                    </button>
                    <button 
                        onClick={() => handleOpenModal('OUT')}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 flex items-center gap-2"
                    >
                        <FaUpload /> Phân Phát (Trả)
                    </button>
                </div>

                {/* BỘ LỌC */}
                <div className="flex gap-4 items-center">
                    <span className="text-gray-600"><FaFilter className="inline mr-1" /> Lọc theo:</span>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as TransactionType | 'ALL')}
                        className="p-2 border border-gray-300 rounded-md"
                    >
                        <option value="ALL">Tất cả Giao dịch</option>
                        <option value="IN">Nhận (Nhập Kho)</option>
                        <option value="OUT">Trả (Phân Phát)</option>
                    </select>
                </div>
            </div>

            {/* 3. BẢNG DANH SÁCH GIAO DỊCH */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại GD</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại Nước</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng ban/Nguồn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người lấy</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(t.type)}`}>
                                        {getTransactionTypeLabel(t.type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.transactionDate).toLocaleString('vi-VN')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.waterType.replace('_', ' ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{t.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.relatedEntity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.actorName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button title="Sửa" onClick={() => handleOpenModal(t.type, t)} className="text-blue-600 hover:text-blue-900 mx-2"><FaEdit size={16} /></button>
                                    <button title="Xóa" className="text-red-600 hover:text-red-900 mx-2"><FaTrashAlt size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* MODAL TẠO/SỬA GIAO DỊCH */}
            {/* <TransactionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTransaction}
                initialData={editingTransaction}
            /> */}
        </div>
    );
};

// --- Sub-Component: StockCards.tsx (Tích hợp logic) ---
const StockCard: React.FC<{ waterType: WaterType; stock: number }> = ({ waterType, stock }) => {
    const isLow = stock < 10 && waterType !== 'Chai_1L'; // Giả định tồn kho thấp
    return (
        <div className={`p-5 rounded-lg shadow-md bg-white border-l-4 ${isLow ? 'border-red-500' : 'border-blue-500'}`}>
            <p className="text-sm font-medium text-gray-500">Tồn kho {waterType.replace('_', ' ')}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stock} đơn vị</h3>
            {isLow && <p className="text-xs text-red-500 mt-1">Cần nhập thêm!</p>}
        </div>
    );
};

export default WaterTransactionPage;