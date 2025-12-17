// frontend/components/ui/ToastContext.tsx
'use client'; 

import React, { useState, useCallback, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Toast from './Toast'; // Import component hiển thị

// --- Định nghĩa Kiểu dữ liệu ---
export type ToastType = "success" | "error" | "info" | "warning" | "delete";

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

// ✅ CẬP NHẬT: Định nghĩa đầy đủ các phương thức tắt
export interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void; // Phương thức đã thêm
    delete: (message: string) => void;
}

// --- Khởi tạo Context ---
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- 1. HOOK useToast ---
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider.');
    }
    return context;
};

// --- 2. COMPONENT PROVIDER ---
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const pathname = usePathname(); 

    // Hàm đóng Toast
    const dismissToast = useCallback((id: number) => {
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 150); 
    }, []);

    // Hàm hiển thị Toast (API chính)
    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        
        // LOGIC TẮT TOAST TRÊN TRANG GỐC (/)
        if (pathname === '/') {
            return; 
        }

        const id = Date.now();
        const newToast = { id, message, type };
        setToasts(prev => [newToast, ...prev]); 
    }, [pathname]);

    // ✅ CẬP NHẬT: Triển khai các phương thức tắt
    const contextValue: ToastContextType = {
        showToast,
        success: (message: string) => showToast(message, 'success'),
        error: (message: string) => showToast(message, 'error'),
        info: (message: string) => showToast(message, 'info'),
        warning: (message: string) => showToast(message, 'warning'),
        delete: (message: string) => showToast(message, 'delete'),
    };

    return (
        // ✅ CẬP NHẬT: Truyền object contextValue đã triển khai đầy đủ
        <ToastContext.Provider value={contextValue}>
            {children}
            
            {/* CONTAINER HIỂN THỊ CÁC TOAST */}
            <div className="fixed top-5 right-5 z-[1000] space-y-3 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast 
                            message={toast.message} 
                            type={toast.type} 
                            onClose={() => dismissToast(toast.id)} 
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};