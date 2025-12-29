"use client";
import { useState, useEffect, useCallback } from "react";
import * as api from "./departmentsAPI";

export const useDepartmentsLogic = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.fetchDepartments();
      if (result.success) setDepartments(result.data);
      else setError(result.message);
    } catch (err) {
      setError("Lỗi kết nối API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDepartments(); }, [loadDepartments]);

  return {
    departments,
    loading,
    error,
    actions: {
      refresh: loadDepartments,
      create: (name: string, description?: string) => api.createDepartment({ name, description }),
      update: (id: number, name: string, description: string) => api.updateDepartment(id, { name, description }),
      delete: (id: number) => api.deleteDepartment(id),
      getUsers: (deptId: string | number) => api.fetchUsersByDepartment(deptId.toString()),
      moveUser: (userId: number, deptId: number) => api.moveUserToDepartment(userId, deptId),
      removeUser: (userId: number) => api.softDeleteUser(userId), // ĐÃ THÊM ĐỂ HẾT LỖI PROPERTY
    },
  };
};