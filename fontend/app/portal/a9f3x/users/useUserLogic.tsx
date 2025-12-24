"use client";

import { useState, useEffect, useCallback } from "react";
import { UserAPI } from "./api.js"; 

// Định nghĩa kiểu dữ liệu cho hộp thoại confirm
interface ConfirmConfig {
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void;
}

export function useUserLogic(showToast: (msg: string, type?: any) => void) {
    const [data, setData] = useState<any>({ users: [], roles: [], departments: [] });
    const [trashData, setTrashData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State quản lý hộp thoại thông báo xác nhận (Yes/No)
    const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ role: "", dept: "" });
    const [form, setForm] = useState({ 
        username: "", password: "", full_name: "", 
        role_id: "", department_id: "" 
    });

    // Hàm đóng hộp thoại confirm
    const closeConfirm = () => setConfirmConfig(null);

    const loadData = useCallback(async () => {
        try {
            const [resActive, resTrash] = await Promise.all([
                UserAPI.fetchData(),
                UserAPI.fetchTrash()
            ]);
            const rawData = resActive.data;
            setData({
                users: rawData.users || (Array.isArray(rawData) ? rawData : []),
                roles: rawData.roles || [],
                departments: rawData.departments || []
            });
            setTrashData(resTrash.data || []);
        } catch (error: any) {
            showToast("Không thể kết nối đến máy chủ", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    // 1. Xử lý Tạo tài khoản
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await UserAPI.create(form);
            showToast("Đã kích hoạt hồ sơ cán bộ thành công");
            setIsModalOpen(false);
            setForm({ username: "", password: "", full_name: "", role_id: "", department_id: "" });
            loadData();
        } catch (error: any) { 
            showToast(error.response?.data?.message || "Lỗi tạo tài khoản", "error"); 
        }
    };

    // 2. Xóa tạm (Sử dụng Confirm Custom)
    const handleSoftDelete = (id: number, name: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "Lưu trữ hồ sơ",
            message: `Đưa cán bộ [${name}] vào thùng rác? Dữ liệu sẽ tự động xóa sau 30 ngày.`,
            type: "warning",
            onConfirm: async () => {
                try {
                    await UserAPI.softDelete(id);
                    showToast(`Đã chuyển ${name} vào thùng rác`, "warning");
                    loadData();
                } catch { showToast("Lỗi khi xóa tạm", "error"); }
            }
        });
    };

    // 3. Xóa vĩnh viễn (Sử dụng Confirm Custom)
    const handlePermanentDelete = (id: number, name: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "CẢNH BÁO NGUY HIỂM",
            message: `Xác nhận xóa vĩnh viễn hồ sơ của [${name}]? Hành động này không thể hoàn tác.`,
            type: "danger",
            onConfirm: async () => {
                try {
                    await UserAPI.delete(id);
                    showToast(`Đã xóa vĩnh viễn dữ liệu của ${name}`, "error");
                    loadData();
                } catch { showToast("Lỗi khi xóa dữ liệu", "error"); }
            }
        });
    };

    // 4. Khôi phục từ thùng rác
    const handleRestore = async (id: number) => {
        try {
            await UserAPI.restore(id);
            showToast("Đã khôi phục tài khoản thành công");
            loadData();
        } catch { showToast("Lỗi khi khôi phục", "error"); }
    };

    // Các hàm phụ trợ khác
    const handleToggleStatus = async (id: number) => {
        try {
            await UserAPI.toggleStatus(id);
            showToast("Đã cập nhật trạng thái");
            loadData();
        } catch { showToast("Lỗi cập nhật", "error"); }
    };

    const handleRoleChange = async (userId: number, roleId: number) => {
        try {
            await UserAPI.updateRole(userId, roleId);
            showToast("Đã thay đổi phân quyền");
            loadData();
        } catch { showToast("Lỗi thay đổi quyền", "error"); }
    };

    const filteredUsers = (data.users || []).filter((u: any) => {
        const searchStr = search.toLowerCase();
        const matchText = (u.full_name?.toLowerCase() || "").includes(searchStr) || 
                          (u.username?.toLowerCase() || "").includes(searchStr);
        const matchRole = !filters.role || u.role === filters.role;
        const matchDept = !filters.dept || u.dept === filters.dept;
        return matchText && matchRole && matchDept;
    });

    return {
        data, trashData, loading, isModalOpen, setIsModalOpen, search, setSearch,
        filters, setFilters, form, setForm, filteredUsers,
        confirmConfig, closeConfirm, // Xuất trạng thái confirm ra ngoài
        handleCreate, handleToggleStatus, handleRoleChange, 
        handleSoftDelete, handleRestore, handlePermanentDelete, 
        loadData
    };
}