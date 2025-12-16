// frontend/app/portal/a9f3x/task-files/page.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
    FaFileUpload, FaFilePdf, FaImage, FaTrash, FaDownload,
    FaFileAlt, FaEdit, FaSave, FaSearch, FaClock, FaCheckCircle,
    FaFileSignature
} from 'react-icons/fa';

import { useToast } from "@/components/ui/Toast"; 

// Định nghĩa kiểu dữ liệu cho File đã sẵn sàng để Lưu (Hàng đợi)
interface PendingFile {
    tempId: number; 
    file: File;
    fileSizeDisplay: string;
    fileType: string;
    departmentCode: string; 
    textContent: string; 
    department: string; 
}

// Định nghĩa kiểu dữ liệu cho File đã được Lưu chính thức
interface TaskFile {
    id: number;
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
    description: string;
    departmentCode: string; 
    textContent: string; 
    department: string;
}

// Giả định danh sách Phòng ban
const DEPARTMENTS = ["Tất cả", "Phòng Kỹ thuật", "Phòng Hành chính", "Phòng Kế toán", "Phòng Kinh doanh"];
const DEFAULT_DEPT = DEPARTMENTS[1];

// DỮ LIỆU GIẢ ĐỊNH
const MOCK_FILES: TaskFile[] = [
    { id: 1, name: "BaoCao_Q4_2025.pdf", size: 5242880, type: "application/pdf", uploadedAt: "09:00:00", description: "Báo cáo tài chính quý 4.", departmentCode: "BC-KT-001", textContent: "Lợi nhuận ròng tăng 15%, chi phí vận hành giảm mạnh trong quý.", department: "Phòng Kế toán" },
    { id: 2, name: "SơDoToChuc.png", size: 1048576, type: "image/png", uploadedAt: "10:15:30", description: "Sơ đồ tổ chức công ty mới nhất.", departmentCode: "SD-HC-002", textContent: "Cập nhật vị trí Giám đốc Kinh doanh mới và Phó phòng Kỹ thuật.", department: "Phòng Hành chính" },
    { id: 3, name: "HuongDan_AnToanLaoDong.pdf", size: 1500000, type: "application/pdf", uploadedAt: "14:30:00", description: "Tài liệu bắt buộc về an toàn và PCCC.", departmentCode: "HD-HC-003", textContent: "Quy tắc an toàn PCCC, 5S và thoát hiểm. Khuyến nghị đọc kỹ.", department: "Phòng Hành chính" },
    { id: 4, name: "ChinhSach_NghiPhep.pdf", size: 900000, type: "application/pdf", uploadedAt: "16:05:00", description: "Chính sách nghỉ phép và các loại hình nghỉ.", departmentCode: "CS-HC-004", textContent: "Quy định về nghỉ phép năm, nghỉ ốm, nghỉ thai sản mới nhất.", department: "Phòng Hành chính" },
    { id: 5, name: "HuongDan_LapTrinh.pdf", size: 7000000, type: "application/pdf", uploadedAt: "11:00:00", description: "Tài liệu hướng dẫn lập trình Backend.", departmentCode: "HD-KT-005", textContent: "Sử dụng framework Node.js và Cấu trúc Microservice. Các Best Practice.", department: "Phòng Kỹ thuật" },
    { id: 6, name: "KeHoach_Marketing_Q1.docx", size: 900000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "13:45:00", description: "Kế hoạch marketing quý 1.", departmentCode: "KH-KD-006", textContent: "Chiến dịch quảng cáo trên mạng xã hội và Google Ads, mục tiêu 10% thị phần.", department: "Phòng Kinh doanh" },
];

// Hàm tiện ích (Giữ nguyên)
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FaFilePdf className="text-red-600" size={20} />;
    if (fileType.includes('image')) return <FaImage className="text-green-600" size={20} />;
    return <FaFileAlt className="text-gray-500" size={20} />;
};


// --- Component Modal Chỉnh Sửa (Giữ nguyên) ---
interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileData: TaskFile | null;
    onSave: (data: TaskFile) => void;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, fileData, onSave }) => {
    const toast = useToast(); 
    
    const [currentName, setCurrentName] = useState(fileData?.name || '');
    const [currentDescription, setCurrentDescription] = useState(fileData?.description || '');
    const [currentDepartment, setCurrentDepartment] = useState(fileData?.department || DEPARTMENTS[1]);
    const [currentCode, setCurrentCode] = useState(fileData?.departmentCode || '');
    const [currentContent, setCurrentContent] = useState(fileData?.textContent || '');

    React.useEffect(() => {
        if (fileData) {
            setCurrentName(fileData.name);
            setCurrentDescription(fileData.description);
            setCurrentDepartment(fileData.department);
            setCurrentCode(fileData.departmentCode);
            setCurrentContent(fileData.textContent);
        }
    }, [fileData]);

    if (!isOpen || !fileData) return null;

    const handleSave = () => {
        if (currentName.trim() === '' || currentCode.trim() === '') {
            toast.showToast('Tên file và Mã số không được để trống.', 'error');
            return;
        }
        const updatedData: TaskFile = {
            ...fileData,
            name: currentName.trim(),
            description: currentDescription,
            department: currentDepartment,
            departmentCode: currentCode.trim(),
            textContent: currentContent,
        };
        onSave(updatedData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-[450px] max-w-[90%] transform scale-100 transition-transform duration-300">
                <h3 className="text-xl font-semibold mb-5 pb-2 border-b border-gray-200 text-blue-600 flex items-center gap-2">
                    <FaEdit /> Chỉnh Sửa Thông Tin Tài Liệu
                </h3>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-1">Tên File:</label>
                    <input type="text" value={currentName} onChange={(e) => setCurrentName(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-1">Mã số:</label>
                    <input type="text" value={currentCode} onChange={(e) => setCurrentCode(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-1 flex items-center gap-1"><FaFileSignature className="text-gray-500" /> Nội dung Văn bản/Tóm tắt:</label>
                    <textarea
                        value={currentContent}
                        onChange={(e) => setCurrentContent(e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-1">Phòng ban:</label>
                    <select value={currentDepartment} onChange={(e) => setCurrentDepartment(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white">
                        {DEPARTMENTS.slice(1).map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                    </select>
                </div>

                <div className="mb-5">
                    <label className="block text-gray-700 font-bold mb-1">Mô tả File:</label>
                    <textarea
                        value={currentDescription}
                        onChange={(e) => setCurrentDescription(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                </div>

                <p className="text-xs text-yellow-700 border-l-4 border-yellow-500 pl-3 py-1 mb-5 bg-yellow-50">
                    *Chỉ chỉnh sửa metadata. Nội dung file không thay đổi.
                </p>

                <div className="flex justify-end space-x-3">
                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-150 flex items-center gap-1">
                        <FaSave /> Cập Nhật
                    </button>
                    <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-150">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Component Trang Chính TaskFilesPage ---
const TaskFilesPage: React.FC = () => {
    const toast = useToast(); 
    
    const [files, setFiles] = useState<TaskFile[]>(MOCK_FILES);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<TaskFile | null>(null);

    // States cho Tìm kiếm/Lọc
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('Tất cả');

    // --- LOGIC HÀNG ĐỢI & LƯU/THÊM MỚI ---
    const handleFilesDropped = useCallback((newFiles: File[]) => {
        const acceptedFiles = newFiles.filter(file => file.type.includes('pdf') || file.type.includes('image'));
        if (acceptedFiles.length < newFiles.length) {
            toast.showToast('Chỉ chấp nhận file PDF và Hình ảnh. Một số file đã bị bỏ qua.', 'warning');
        }

        const newPending: PendingFile[] = acceptedFiles.map(file => ({
            tempId: Date.now() + Math.random(),
            file: file,
            fileSizeDisplay: formatFileSize(file.size),
            fileType: file.type,
            departmentCode: '',
            textContent: '',
            department: DEFAULT_DEPT,
        }));

        setPendingFiles(prev => [...prev, ...newPending]);
        if (newPending.length > 0) {
            toast.showToast(`Đã thêm ${newPending.length} file vào hàng đợi. Vui lòng nhập Mã số.`, 'info');
        }
    }, [toast]);

    const handlePendingChange = (tempId: number, field: keyof PendingFile, value: string) => {
        setPendingFiles(prev => prev.map(p =>
            p.tempId === tempId ? { ...p, [field]: value } : p
        ));
    };

    const handleRemovePending = (tempId: number) => {
        setPendingFiles(prev => prev.filter(p => p.tempId !== tempId));
        toast.showToast('Đã xóa file khỏi hàng đợi.', 'warning');
    };

    const handleSavePending = () => {
        if (pendingFiles.length === 0) return;

        // 1. Kiểm tra điều kiện (Mã số không được trống)
        const hasEmptyCode = pendingFiles.some(p => p.departmentCode.trim() === '');
        if (hasEmptyCode) {
            toast.showToast('Vui lòng nhập Mã số (Bắt buộc) cho tất cả các tài liệu trong hàng đợi.', 'error');
            return;
        }

        // 2. Xử lý lưu từng file (Mô phỏng API call)
        const newSavedFiles: TaskFile[] = pendingFiles.map(p => {
            return {
                id: Date.now() + Math.random(),
                name: p.file.name,
                size: p.file.size,
                type: p.fileType,
                uploadedAt: new Date().toLocaleTimeString('vi-VN'),
                description: `Tài liệu công việc với Mã số: ${p.departmentCode}`,
                departmentCode: p.departmentCode,
                textContent: p.textContent,
                department: p.department,
            };
        });

        // 3. Cập nhật Danh sách chính thức và làm sạch Hàng đợi
        setFiles(prev => [...newSavedFiles, ...prev]);
        setPendingFiles([]);
        toast.showToast(`Đã Lưu thành công ${newSavedFiles.length} tài liệu vào danh sách chính thức.`, 'success');
    };

    // --- LOGIC CRUD ---
    const handleUpdateFile = (updatedData: TaskFile) => {
        setFiles((prevFiles) => prevFiles.map(file => {
            if (file.id === updatedData.id) {
                toast.showToast(`Đã cập nhật thông tin file "${updatedData.name}".`, 'success');
                return updatedData;
            }
            return file;
        }));
        setIsModalOpen(false);
        setEditingFile(null);
    };

    // CẬP NHẬT: Xóa bỏ window.confirm
    const handleDeleteFile = (fileId: number, fileName: string) => {
        // Loại bỏ window.confirm để dùng Toast tùy chỉnh
        setFiles((prevFiles) => prevFiles.filter(file => file.id !== fileId));
        
        // HIỂN THỊ TOAST THÔNG BÁO XÓA THÀNH CÔNG
        toast.showToast(`Đã xóa file "${fileName}" thành công.`, 'delete');
    };

    const handleEditClick = (file: TaskFile) => {
        setEditingFile(file);
        setIsModalOpen(true);
    };

    // --- LOGIC TÌM KIẾM VÀ LỌC (Giữ nguyên) ---
    const filteredFiles = useMemo(() => {
        let currentFiles = files;
        if (selectedDepartment !== 'Tất cả') {
            currentFiles = currentFiles.filter(file => file.department === selectedDepartment);
        }

        if (searchTerm.trim() !== '') {
            const lowerCaseSearch = searchTerm.toLowerCase().trim();
            currentFiles = currentFiles.filter(file =>
                file.name.toLowerCase().includes(lowerCaseSearch) ||
                file.description.toLowerCase().includes(lowerCaseSearch) ||
                file.departmentCode.toLowerCase().includes(lowerCaseSearch) ||
                file.textContent.toLowerCase().includes(lowerCaseSearch)
            );
        }
        return currentFiles;
    }, [files, searchTerm, selectedDepartment]);


    // Drag and Drop Handlers (Giữ nguyên)
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesDropped(Array.from(e.dataTransfer.files));
        }
    };


    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <EditModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingFile(null); }}
                fileData={editingFile}
                onSave={handleUpdateFile}
            />

            <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3 border-b pb-3">
                <FaFileAlt className="text-blue-600" /> Quản lý Tài liệu Công việc
            </h1>

            {/* 1. KHU VỰC UPLOAD (HÀNG ĐỢI) */}
            <div
                className={`p-10 mb-6 text-center border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-100'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
            >
                <FaFileUpload size={40} className="text-blue-600 mx-auto mb-3" />
                <p className="text-xl text-gray-700 font-medium">Kéo thả file **PDF/Hình ảnh** vào đây để đưa vào **Hàng đợi**</p>
                <input
                    type="file"
                    id="fileInput"
                    multiple
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files) {
                            handleFilesDropped(Array.from(e.target.files));
                        }
                    }}
                />
            </div>

            {/* 2. HIỂN THỊ HÀNG ĐỢI UPLOAD */}
            {pendingFiles.length > 0 && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg p-0 mb-6 shadow-md">
                    <div className="p-3 bg-yellow-500 text-white font-semibold rounded-t-lg flex justify-between items-center">
                        <span><FaClock className="inline mr-2" /> **Hàng đợi Upload** ({pendingFiles.length} tài liệu)</span>
                        <button
                            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition duration-150 flex items-center gap-1 disabled:opacity-50"
                            onClick={handleSavePending}
                            disabled={pendingFiles.some(p => p.departmentCode.trim() === '')}
                        >
                            <FaSave /> Lưu ({pendingFiles.length}) Tài liệu
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-yellow-200 text-sm">
                            <thead className="bg-yellow-200">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-yellow-800 w-1/6">File</th><th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-yellow-800 w-1/6">Mã số (Bắt buộc)</th><th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-yellow-800 w-1/4">Nội dung Văn bản/Tóm tắt</th><th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-yellow-800 w-1/6">Phòng ban</th><th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-yellow-800 w-1/12">Size</th><th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-yellow-800 w-1/12">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-yellow-200">
                                {pendingFiles.map(p => (
                                    <tr key={p.tempId}>
                                        <td className="px-4 py-2 flex items-center gap-2">{getFileIcon(p.fileType)} {p.file.name}</td>

                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    className={`form-input w-full p-1 border rounded text-xs ${p.departmentCode.trim() === '' ? 'border-red-400' : 'border-gray-300'}`}
                                                    placeholder="VD: BC-KT-001"
                                                    value={p.departmentCode}
                                                    onChange={(e) => handlePendingChange(p.tempId, 'departmentCode', e.target.value)}
                                                />
                                                {p.departmentCode.trim() === '' && (
                                                    <span className="text-red-500 ml-2 text-xs">!</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                className="form-input w-full p-1 border border-gray-300 rounded text-xs"
                                                placeholder="Tóm tắt nội dung chính..."
                                                value={p.textContent}
                                                onChange={(e) => handlePendingChange(p.tempId, 'textContent', e.target.value)}
                                            />
                                        </td>

                                        <td className="px-4 py-2">
                                            <select
                                                className="form-select w-full p-1 border border-gray-300 rounded text-xs bg-white"
                                                value={p.department}
                                                onChange={(e) => handlePendingChange(p.tempId, 'department', e.target.value)}
                                            >
                                                {DEPARTMENTS.slice(1).map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 text-xs">{p.fileSizeDisplay}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"
                                                onClick={() => handleRemovePending(p.tempId)}
                                                title="Xóa khỏi hàng đợi"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* 3. KHU VỰC TÌM KIẾM VÀ LỌC */}
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700 flex items-center gap-2 border-b pb-2">
                <FaCheckCircle className="text-green-600" /> Danh sách Tài liệu Cập nhật ({filteredFiles.length})
            </h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Lọc theo Phòng ban */}
                <div className="w-full md:w-1/4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Lọc theo Phòng ban:</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                {/* Ô Tìm kiếm chung (Bao gồm cả Nội dung Văn bản) */}
                <div className="w-full md:w-3/4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Tìm kiếm (Tên file, Mã số, Mô tả, Nội dung):</label>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nhập từ khóa tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 4. DANH SÁCH CHÍNH THỨC */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">File</th><th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Mã số</th><th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 max-w-[200px]">Nội dung Văn bản</th><th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Phòng ban</th><th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Upload lúc</th><th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredFiles.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-500 bg-red-50">
                                    {files.length === 0 ? "Chưa có tài liệu nào được lưu chính thức." : "Không tìm thấy kết quả khớp với tìm kiếm/lọc."}
                                </td>
                            </tr>
                        ) : (
                            filteredFiles.map((file) => (
                                <tr key={file.id} className="hover:bg-gray-50 transition duration-100">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-3">
                                        {getFileIcon(file.type)}
                                        <div>
                                            <strong className="block">{file.name}</strong>
                                            <span className="text-xs text-gray-500">{file.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{file.departmentCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate" title={file.textContent}>
                                        <FaFileSignature className="inline text-gray-400 mr-2" />
                                        {file.textContent || <span className="text-gray-400 italic">(Chưa có tóm tắt)</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{file.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.uploadedAt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition" title="Tải xuống"><FaDownload /></button>
                                        <button
                                            className="text-yellow-600 hover:text-yellow-900 p-2 rounded-full hover:bg-yellow-100 transition mx-1"
                                            title="Chỉnh sửa"
                                            onClick={() => handleEditClick(file)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition"
                                            title="Xóa"
                                            onClick={() => handleDeleteFile(file.id, file.name)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskFilesPage;