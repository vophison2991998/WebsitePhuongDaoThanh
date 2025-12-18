-- =============================================================================
-- HỆ THỐNG QUẢN LÝ TẬP TRUNG PHƯƠNG ĐÀO THÀNH - V9 (CLEANED)
-- =============================================================================

-- 0. DỌN DẸP HỆ THỐNG
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS app_receipt_lot CASCADE;
DROP TABLE IF EXISTS app_delivery_person CASCADE;
DROP TABLE IF EXISTS app_supplier CASCADE;
DROP TABLE IF EXISTS water_product CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORE: PHÂN QUYỀN & PHÒNG BAN
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL
);

-- 2. MASTER DATA: SẢN PHẨM
CREATE TABLE water_product (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) DEFAULT 'Bình',
    capacity_liters NUMERIC(5, 2) DEFAULT 20.00,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ĐỐI TÁC
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

-- 4. NHẬP LÔ HÀNG (SỬ DỤNG receipt_date ĐỂ KHỚP VỚI MODEL CỦA BẠN)
CREATE TABLE app_receipt_lot (
    id SERIAL PRIMARY KEY,
    lot_code VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INT NOT NULL REFERENCES app_supplier(id),
    delivery_person_id INT NOT NULL REFERENCES app_delivery_person(id),
    water_type_id INT NOT NULL REFERENCES water_product(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    receipt_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'CHỜ XÁC NHẬN',
    received_by INT REFERENCES users(id),
    qr_code_data TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. GIAO HÀNG (TỰ ĐỘNG TẠO ID)
CREATE TABLE deliveries (
    delivery_id VARCHAR(50) PRIMARY KEY DEFAULT 'ORD-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 8)), 
    recipient_name VARCHAR(100) NOT NULL,
    dept_id INT REFERENCES departments(id) ON DELETE SET NULL,
    product_id INT REFERENCES water_product(product_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    delivery_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    note TEXT,
    qr_code_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TASKS
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

-- 7. TRIGGER
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_product BEFORE UPDATE ON water_product FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER trg_update_delivery BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- =========================================
-- 8. DỮ LIỆU MẪU (AN TOÀN)
-- =========================================

INSERT INTO roles (code, name) VALUES ('ADMIN', 'Quản trị'), ('MANAGER', 'Quản lý'), ('USER', 'Nhân viên');

INSERT INTO departments (name) VALUES ('Phòng Kho vận'), ('Phòng Kỹ thuật'), ('Phòng Kế toán');

-- Tài khoản Admin
INSERT INTO users (username, password, role_id) 
VALUES ('admin', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', (SELECT id FROM roles WHERE code = 'ADMIN'));

INSERT INTO user_profiles (user_id, full_name, department_id) 
VALUES ((SELECT id FROM users WHERE username = 'admin'), 'Quản Trị Viên', (SELECT id FROM departments WHERE name = 'Phòng Kỹ thuật'));

-- Tài khoản Manager
INSERT INTO users (username, password, role_id) 
VALUES ('manager', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', (SELECT id FROM roles WHERE code = 'MANAGER'));

INSERT INTO user_profiles (user_id, full_name, department_id) 
VALUES ((SELECT id FROM users WHERE username = 'manager'), 'Quản Lý Kho', (SELECT id FROM departments WHERE name = 'Phòng Kho vận'));

-- Sản phẩm
INSERT INTO water_product (name, unit) VALUES ('Nước tinh khiết 20L', 'Bình'), ('Nước khoáng Lavie 1.5L', 'Chai');

-- Nhà cung cấp & Đơn hàng mẫu
INSERT INTO app_supplier (name) VALUES ('Tổng công ty Nước Sạch SG');
INSERT INTO app_delivery_person (full_name, supplier_id) VALUES ('Nguyễn Văn Tài', (SELECT id FROM app_supplier LIMIT 1));

INSERT INTO app_receipt_lot (lot_code, supplier_id, delivery_person_id, water_type_id, quantity, received_by)
VALUES ('LOT-DEMO-01', (SELECT id FROM app_supplier LIMIT 1), (SELECT id FROM app_delivery_person LIMIT 1), (SELECT product_id FROM water_product LIMIT 1), 100, (SELECT id FROM users LIMIT 1));