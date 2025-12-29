-- =============================================================================
-- HỆ THỐNG QUẢN LÝ TẬP TRUNG PHƯƠNG ĐÀO THÀNH - V10.3 (STRICT STATUS EDITION)
-- =============================================================================

-- 0. DỌN DẸP HỆ THỐNG (Xóa theo thứ tự để tránh lỗi ràng buộc)
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS app_receipt_lot CASCADE;
DROP TABLE IF EXISTS delivery_status CASCADE; -- Bảng mới
DROP TABLE IF EXISTS receipt_status CASCADE;  -- Bảng mới
DROP TABLE IF EXISTS app_delivery_person CASCADE;
DROP TABLE IF EXISTS app_supplier CASCADE;
DROP TABLE IF EXISTS water_product CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PHÂN QUYỀN & PHÒNG BAN
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- ADMIN, MANAGER, USER
    name VARCHAR(50) NOT NULL
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 2. DANH MỤC TRẠNG THÁI (MỚI - RÀNG BUỘC CHẶT CHẼ)
CREATE TABLE receipt_status (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- PROCESSING, COMPLETED
    name VARCHAR(50) NOT NULL
);

CREATE TABLE delivery_status (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- PROCESSING, COMPLETED
    name VARCHAR(50) NOT NULL
);

-- 3. TÀI KHOẢN (Tích hợp Soft Delete)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL 
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL
);

-- 4. DANH MỤC SẢN PHẨM
CREATE TABLE water_product (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) DEFAULT 'Bình',
    capacity_liters NUMERIC(5, 2) DEFAULT 20.00,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ĐỐI TÁC & NHÂN VIÊN GIAO HÀNG
CREATE TABLE app_supplier (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_delivery_person (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    supplier_id INT REFERENCES app_supplier(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    UNIQUE(full_name, supplier_id)
);

-- 6. QUẢN LÝ NHẬP KHO (Lô hàng - Ràng buộc với receipt_status)
CREATE TABLE app_receipt_lot (
    id SERIAL PRIMARY KEY,
    lot_code VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INT NOT NULL REFERENCES app_supplier(id),
    delivery_person_id INT NOT NULL REFERENCES app_delivery_person(id),
    water_type_id INT NOT NULL REFERENCES water_product(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    receipt_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_id INT NOT NULL REFERENCES receipt_status(id), -- Khóa ngoại mới
    received_by INT REFERENCES users(id),
    qr_code_data TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. QUẢN LÝ XUẤT KHO / GIAO HÀNG (Ràng buộc với delivery_status)
CREATE TABLE deliveries (
    delivery_id VARCHAR(50) PRIMARY KEY DEFAULT 'ORD-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 8)), 
    recipient_name VARCHAR(100) NOT NULL,
    dept_id INT REFERENCES departments(id) ON DELETE SET NULL,
    product_id INT REFERENCES water_product(product_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    delivery_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_id INT NOT NULL REFERENCES delivery_status(id), -- Khóa ngoại mới
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. QUẢN LÝ CÔNG VIỆC (TASKS)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_by INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),
    priority VARCHAR(20) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'TODO',
    due_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TRIGGER TỰ ĐỘNG CẬP NHẬT THỜI GIAN
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_product BEFORE UPDATE ON water_product FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER trg_update_delivery BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER trg_update_tasks BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- =========================================
-- 10. DỮ LIỆU MẪU (INSERT INTO)
-- =========================================

-- Trạng thái Nhập kho
INSERT INTO receipt_status (code, name) VALUES 
('PROCESSING', 'Đang xử lý'), 
('COMPLETED', 'Hoàn thành');

-- Trạng thái Xuất kho
INSERT INTO delivery_status (code, name) VALUES 
('PROCESSING', 'Đang xử lý'), 
('COMPLETED', 'Hoàn thành');

-- Vai trò & Phòng ban
INSERT INTO roles (code, name) VALUES 
('ADMIN', 'Quản trị hệ thống'), 
('MANAGER', 'Trưởng bộ phận'), 
('USER', 'Nhân viên');

INSERT INTO departments (name, description) VALUES 
('Phòng Kho vận', 'Quản lý nhập xuất và tồn kho'), 
('Phòng Kỹ thuật', 'Vận hành và sửa chữa thiết bị'), 
('Phòng Kế toán', 'Hạch toán và thanh toán đối tác'), 
('Ban Giám đốc', 'Điều hành tổng thể');

-- Người dùng (Tất cả mật khẩu mặc định: 123456)
INSERT INTO users (username, password, role_id) VALUES  
('admin', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', 1),
('manager_kho', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', 2),
('nhanvien_01', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', 3);

-- Tài khoản trong thùng rác
INSERT INTO users (username, password, role_id, is_active, deleted_at) VALUES 
('user_old_01', 'deleted', 3, false, NOW() - INTERVAL '5 days');

-- Hồ sơ chi tiết
INSERT INTO user_profiles (user_id, full_name, email, phone, department_id) VALUES  
(1, 'Trần Hoàng Admin', 'admin@phuongdao.com', '0901234567', 4),
(2, 'Lê Văn Kho', 'kho@phuongdao.com', '0907654321', 1),
(3, 'Nguyễn Thị Thủy', 'thuy@phuongdao.com', '0988112233', 1);

-- Sản phẩm
INSERT INTO water_product (name, unit, capacity_liters) VALUES  
('Nước tinh khiết Vihawa 20L', 'Bình', 20.00),
('Nước khoáng Lavie 19L', 'Bình', 19.00),
('Thùng Lavie 500ml (24 chai)', 'Thùng', 12.00);

-- Đối tác
INSERT INTO app_supplier (name, phone) VALUES  
('Công ty Nước giải khát IBC', '02839998888'),
('Nhà phân phối Aquafina miền Nam', '02837776666');

-- Nhân viên giao hàng đối tác
INSERT INTO app_delivery_person (full_name, supplier_id, phone) VALUES  
('Lý Tiểu Long', 1, '0933111222'),
('Diệp Vấn', 2, '0944333444');

-- Lô hàng mẫu (Nhập kho)
-- 1: PROCESSING, 2: COMPLETED
INSERT INTO app_receipt_lot (lot_code, supplier_id, delivery_person_id, water_type_id, quantity, status_id, received_by) VALUES  
('LOT-2023-001', 1, 1, 1, 200, 2, 2), -- Hoàn thành
('LOT-2023-002', 2, 2, 2, 150, 1, 2); -- Đang xử lý

-- Giao hàng mẫu (Xuất kho nội bộ)
-- 1: PROCESSING, 2: COMPLETED
INSERT INTO deliveries (recipient_name, dept_id, product_id, quantity, status_id, note) VALUES  
('Phạm Bình Minh', 2, 1, 5, 2, 'Cấp cho xưởng sản xuất'), -- Hoàn thành
('Hoàng Kiều', 3, 2, 3, 1, 'Giao phòng họp lầu 2'); -- Đang xử lý

-- Công việc
INSERT INTO tasks (title, description, assigned_by, assigned_to, priority, status, due_date) VALUES  
('Kiểm kê cuối tháng', 'Kiểm tra khớp số liệu thực tế và phần mềm', 1, 2, 'HIGH', 'TODO', NOW() + INTERVAL '1 day');

-- Thêm cột deleted_at cho các bảng nghiệp vụ chính
ALTER TABLE app_receipt_lot ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Tạo Index để tăng tốc độ truy vấn các bản ghi chưa xóa
CREATE INDEX idx_receipt_deleted_at ON app_receipt_lot(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_deliveries_deleted_at ON deliveries(deleted_at) WHERE deleted_at IS NULL;
CREATE OR REPLACE FUNCTION clean_expired_trash()
RETURNS void AS $$
BEGIN
    -- Xóa vĩnh viễn các bản ghi đã ở trong thùng rác hơn 30 ngày
    DELETE FROM app_receipt_lot WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM deliveries WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM tasks WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Đã dọn dẹp thùng rác thành công vào lúc %', NOW();
END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION clean_expired_trash()
RETURNS void AS $$
BEGIN
    -- Xóa vĩnh viễn dữ liệu cũ hơn 30 ngày
    DELETE FROM app_receipt_lot WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM deliveries WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM tasks WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Thùng rác đã được dọn dẹp tự động vào: %', NOW();
END;
$$ LANGUAGE plpgsql;