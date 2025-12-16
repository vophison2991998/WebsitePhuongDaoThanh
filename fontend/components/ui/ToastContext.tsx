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

export interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
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
    const pathname = usePathname(); // Dùng để kiểm tra đường dẫn

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
            // Toast bị vô hiệu hóa khi ở trang http://localhost:3000/
            return; 
        }

        const id = Date.now();
        const newToast = { id, message, type };
        setToasts(prev => [newToast, ...prev]); 
    }, [pathname]);


    return (
        <ToastContext.Provider value={{ showToast }}>
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