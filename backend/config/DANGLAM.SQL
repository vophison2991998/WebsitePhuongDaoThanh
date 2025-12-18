-- =============================================================================
-- HỆ THỐNG QUẢN LÝ TẬP TRUNG PHƯƠNG ĐÀO THÀNH - V10 (FIXED)
-- =============================================================================

-- 0. DỌN DẸP HỆ THỐNG
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS app_receipt_lot CASCADE;
DROP TABLE IF EXISTS receipt_status CASCADE;
DROP TABLE IF EXISTS delivery_status CASCADE;
DROP TABLE IF EXISTS app_delivery_person CASCADE;
DROP TABLE IF EXISTS app_supplier CASCADE;
DROP TABLE IF EXISTS water_product CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DANH MỤC TRẠNG THÁI
CREATE TABLE receipt_status (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL,
    color_class VARCHAR(100)
);

CREATE TABLE delivery_status (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL,
    color_class VARCHAR(100)
);

-- 2. CORE: PHÂN QUYỀN & PHÒNG BAN
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL
);

-- 3. MASTER DATA
CREATE TABLE water_product (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) DEFAULT 'Bình',
    capacity_liters NUMERIC(5, 2) DEFAULT 20.00,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- 4. NHẬP LÔ HÀNG
CREATE TABLE app_receipt_lot (
    id SERIAL PRIMARY KEY,
    lot_code VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INT NOT NULL REFERENCES app_supplier(id),
    delivery_person_id INT NOT NULL REFERENCES app_delivery_person(id),
    water_type_id INT NOT NULL REFERENCES water_product(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    receipt_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_id INT REFERENCES receipt_status(id) DEFAULT 1, 
    received_by INT REFERENCES users(id),
    qr_code_data TEXT, 
	note  TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. GIAO HÀNG
CREATE TABLE deliveries (
    delivery_id VARCHAR(50) PRIMARY KEY DEFAULT 'ORD-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 8)), 
    recipient_name VARCHAR(100) NOT NULL,
    dept_id INT REFERENCES departments(id) ON DELETE SET NULL,
    product_id INT REFERENCES water_product(product_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    delivery_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_id INT REFERENCES delivery_status(id) DEFAULT 1,
    note TEXT,
    qr_code_data TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TASKS (PHẦN BỔ SUNG BỊ THIẾU)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id INT REFERENCES departments(id),
    assigned_by INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),
    priority VARCHAR(20) CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    status VARCHAR(20) DEFAULT 'TODO',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. DỮ LIỆU CẤU HÌNH & MẪU
INSERT INTO receipt_status (status_name, color_class) VALUES 
('Đợi xử lý', 'bg-yellow-100 text-yellow-800 border-yellow-300'),
('Đã nhập kho', 'bg-green-100 text-green-800 border-green-300'),
('Hủy/Xóa', 'bg-red-100 text-red-800 border-red-300');

INSERT INTO delivery_status (status_name, color_class) VALUES 
('Đợi xử lý', 'bg-yellow-100 text-yellow-800 border-yellow-300'),
('Đang giao', 'bg-blue-100 text-blue-800 border-blue-300'),
('Đã xuất kho', 'bg-green-100 text-green-800 border-green-300'),
('Hủy/Xóa', 'bg-red-100 text-red-800 border-red-300');

INSERT INTO roles (code, name) VALUES ('ADMIN', 'Quản trị'), ('MANAGER', 'Quản lý'), ('USER', 'Nhân viên');
INSERT INTO departments (name) VALUES ('Phòng Kho vận'), ('Phòng Kỹ thuật'), ('Phòng Kế toán');

INSERT INTO users (username, password, role_id) 
VALUES ('admin', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', 1);

INSERT INTO user_profiles (user_id, full_name, department_id) 
VALUES (1, 'Quản Trị Viên', 2);

-- INSERT DỮ LIỆU CÒN LẠI (SẢN PHẨM, NHÀ CUNG CẤP...)
INSERT INTO water_product (name, unit) VALUES ('Nước khoáng Lavie 20L', 'Bình'), ('Nước tinh khiết 20L', 'Bình');
INSERT INTO app_supplier (name) VALUES ('Tổng công ty Nước Sạch SG');
INSERT INTO app_delivery_person (full_name, supplier_id) VALUES ('Nguyễn Văn Tài', 1);

-- THỰC HIỆN LỆNH INSERT TASK (GIỜ ĐÃ CHẠY ĐƯỢC)
INSERT INTO tasks (title, description, assigned_by, assigned_to, priority, status, due_date)
VALUES 
('Kiểm kê kho cuối tuần', 'Kiểm tra lại số lượng bình rỗng tại kho A', 1, 1, 'HIGH', 'TODO', NOW() + INTERVAL '2 days'),
('Vệ sinh máy lọc nước', 'Bảo trì định kỳ máy lọc nước tầng 3', 1, 1, 'MEDIUM', 'TODO', NOW() + INTERVAL '1 day');