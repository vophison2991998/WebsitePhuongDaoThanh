
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;

DROP TABLE IF EXISTS transaction_detail CASCADE;
DROP TABLE IF EXISTS lot CASCADE;
DROP TABLE IF EXISTS "transaction" CASCADE;
DROP TABLE IF EXISTS inventory_location CASCADE;
DROP TABLE IF EXISTS party CASCADE;
DROP TABLE IF EXISTS water_product CASCADE;

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

DROP TABLE IF EXISTS deliveries CASCADE;

-- Xóa các Types Enum
DROP TYPE IF EXISTS party_type_enum CASCADE;
DROP TYPE IF EXISTS transaction_type_enum CASCADE;
DROP TYPE IF EXISTS transaction_status_enum CASCADE;

-- Xóa các Trigger/Function
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
DROP TRIGGER IF EXISTS update_task_modtime ON tasks;
DROP TRIGGER IF EXISTS update_product_modtime ON water_product;
DROP TRIGGER IF EXISTS update_lot_modtime ON lot;
DROP TRIGGER IF EXISTS update_transaction_modtime ON "transaction";


CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 



CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    avatar_url TEXT,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    position VARCHAR(50)
);


-- 2.1. Bảng Sản phẩm (WATER_PRODUCT)
CREATE TABLE water_product (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL DEFAULT 'Bình', 
    capacity_liters NUMERIC(5, 2) DEFAULT 20.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.2. Bảng Đối tác (PARTY)
CREATE TYPE party_type_enum AS ENUM ('SUPPLIER', 'CUSTOMER', 'INTERNAL');

CREATE TABLE party (
    party_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type party_type_enum NOT NULL, 
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.3. Bảng Vị trí Kho (INVENTORY_LOCATION)
CREATE TABLE inventory_location (
    location_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL, 
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    
    priority VARCHAR(20) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'TODO' CHECK (status IN ('TODO', 'DOING', 'REVIEW', 'DONE', 'BLOCKED')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_logs (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 3.2. Bảng Giao dịch (TRANSACTION)
CREATE TYPE transaction_type_enum AS ENUM ('RECEIPT', 'ISSUE');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

CREATE TABLE "transaction" (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    type transaction_type_enum NOT NULL, 
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    party_id INTEGER REFERENCES party(party_id), 
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0), 
    notes TEXT,
    status transaction_status_enum NOT NULL DEFAULT 'COMPLETED', 
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.3. Bảng Lô hàng (LOT)
CREATE TABLE lot (
    lot_id SERIAL PRIMARY KEY,
    
    receipt_transaction_id UUID NOT NULL REFERENCES "transaction"(transaction_id),
    product_id INTEGER NOT NULL REFERENCES water_product(product_id),
    
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    received_quantity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL,
    
    location_id INTEGER REFERENCES inventory_location(location_id),
    qr_code_data TEXT, 
    
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_lot_quantity CHECK (current_quantity >= 0 AND current_quantity <= received_quantity)
);


-- 3.4. Bảng Chi tiết Giao dịch (TRANSACTION_DETAIL)
CREATE TABLE transaction_detail (
    detail_id SERIAL PRIMARY KEY,
    
    issue_transaction_id UUID NOT NULL REFERENCES "transaction"(transaction_id),
    
    lot_id INTEGER REFERENCES lot(lot_id),
    product_id INTEGER NOT NULL REFERENCES water_product(product_id),
    
    quantity INTEGER NOT NULL, 
    
    CONSTRAINT check_detail_quantity CHECK (quantity > 0)
);


-- =========================================
-- 4. AUTOMATION (TRIGGER)
-- =========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger cho Task
CREATE TRIGGER update_task_modtime
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger cho Product
CREATE TRIGGER update_product_modtime
    BEFORE UPDATE ON water_product
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger cho Transaction
CREATE TRIGGER update_transaction_modtime
    BEFORE UPDATE ON "transaction"
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger cho Lot
CREATE TRIGGER update_lot_modtime
    BEFORE UPDATE ON lot
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();


CREATE TYPE delivery_status_enum AS ENUM (
    'Chờ giao',
    'Đang giao',
    'Đã giao',
    'Đã hủy'
);

CREATE TABLE deliveries (
    delivery_id VARCHAR(20) PRIMARY KEY,
    recipient_name VARCHAR(100) NOT NULL,
    dept_id INT REFERENCES departments(id),
    product_id INT REFERENCES water_product(product_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    delivery_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status delivery_status_enum DEFAULT 'Chờ giao',
    qr_code_data TEXT,
    note TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);





-- 5.1. Core Data (Roles, Permissions, Users, Depts)
INSERT INTO roles (code, name) VALUES
    ('ADMIN', 'Quản trị hệ thống'),
    ('MANAGER', 'Quản lý kho'), 
    ('USER', 'Người dùng nội bộ');

INSERT INTO permissions (code, description) VALUES
    ('USER_VIEW', 'Xem người dùng'),
    ('TASK_CREATE', 'Tạo công việc'),
    ('INVENTORY_VIEW', 'Xem tồn kho và lịch sử GD'),
    ('RECEIPT_CREATE', 'Tạo GD Nhận (Nhập kho)'), 
    ('ISSUE_CREATE', 'Tạo GD Trả (Xuất kho)'),
    ('ISSUE_PROCESS', 'Xử lý và hoàn tất GD Trả'); 

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('INVENTORY_VIEW', 'RECEIPT_CREATE', 'ISSUE_CREATE', 'ISSUE_PROCESS', 'TASK_CREATE') WHERE r.code = 'MANAGER';

INSERT INTO departments (name, description) VALUES
    ('Phòng Kho vận', 'Quản lý nhập xuất và tồn kho'), 
    ('Phòng Kỹ thuật', 'Quản lý hạ tầng và phát triển phần mềm'),
    ('Phòng Nhân sự', 'Quản lý nhân sự và đào tạo');

INSERT INTO users (username, password, role_id) VALUES
('admin', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', (SELECT id FROM roles WHERE code = 'ADMIN')),
('manager', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', (SELECT id FROM roles WHERE code = 'MANAGER')),
('user', '$2b$10$ZWk4ScceT5Ox63Kn7jm9jOzXWT6HAYuZqb3mBdcKkJheNIew3spQy', (SELECT id FROM roles WHERE code = 'USER'));

INSERT INTO user_profiles (user_id, full_name, email, department_id, position) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'Quản Trị Viên Hệ Thống', 'admin@congty.com', 2, 'Giám đốc IT'),
((SELECT id FROM users WHERE username = 'manager'), 'Nguyễn Văn Quản Lý Kho', 'manager@congty.com', 1, 'Trưởng phòng Kho vận'),
((SELECT id FROM users WHERE username = 'user'), 'Trần Thị Nhân Viên', 'user@congty.com', 3, 'Nhân viên HR');


-- 5.2. Master Data Kho
INSERT INTO water_product (name, unit, capacity_liters) VALUES
('Nước suối 330ml (Thùng 24)', 'Thùng', 7.92), -- product_id = 1
('Nước khoáng 1.5L', 'Chai', 1.5), -- product_id = 2
('Nước tinh khiết 20L', 'Bình', 20.0); -- product_id = 3

INSERT INTO party (name, type, phone) VALUES
('Công ty Nước ABC', 'SUPPLIER', '0901234567'), -- party_id = 1 (NCC)
('Phòng Kỹ thuật', 'INTERNAL', '028xxxx'), -- party_id = 2 (Cho ISSUE)
('Phòng Nhân sự', 'INTERNAL', '028yyyy'); -- party_id = 3 (Cho ISSUE)

INSERT INTO inventory_location (name) VALUES
('Khu Vực A'), -- location_id = 1
('Khu Vực B'); -- location_id = 2

-- 5.3. Giao dịch Nhập (RECEIPT)
-- GD Nhận #1 (100 Bình Nước 20L)
INSERT INTO "transaction" (transaction_code, type, party_id, total_quantity, status, created_by) VALUES
('RCV-001', 'RECEIPT', 1, 100, 'COMPLETED', 2);
-- Lô hàng
INSERT INTO lot (receipt_transaction_id, product_id, batch_code, received_quantity, current_quantity, location_id) VALUES
((SELECT transaction_id FROM "transaction" WHERE transaction_code = 'RCV-001'), 3, 'LOT-005', 100, 100, 1); -- lot_id = 1

-- GD Nhận #2 (80 Thùng 330ml)
INSERT INTO "transaction" (transaction_code, type, party_id, total_quantity, status, created_by) VALUES
('RCV-002', 'RECEIPT', 1, 80, 'COMPLETED', 2);
-- Lô hàng
INSERT INTO lot (receipt_transaction_id, product_id, batch_code, received_quantity, current_quantity, location_id) VALUES
((SELECT transaction_id FROM "transaction" WHERE transaction_code = 'RCV-002'), 1, 'LOT-004', 80, 80, 2); -- lot_id = 2


-- 5.4. Giao dịch Xuất (ISSUE)
-- GD Xuất #1: Phòng Nhân sự cần 1 Bình Nước 20L
INSERT INTO "transaction" (transaction_code, type, party_id, total_quantity, status, created_by) VALUES
('ISS-001', 'ISSUE', 3, 1, 'COMPLETED', 2);

-- Chi tiết Xuất (Trừ 1 Bình từ LOT-005)
INSERT INTO transaction_detail (issue_transaction_id, lot_id, product_id, quantity) VALUES
((SELECT transaction_id FROM "transaction" WHERE transaction_code = 'ISS-001'), 1, 3, 1);

-- Cập nhật tồn kho (Thực hiện thủ công cho dữ liệu thử nghiệm)
UPDATE lot SET current_quantity = current_quantity - 1 WHERE lot_id = 1;


-- 5.5. Task Data
INSERT INTO tasks (title, description, department_id, assigned_by, assigned_to, priority, status, due_date) VALUES
('Kiểm kê Khu Vực A', 'Kiểm tra và đối chiếu tồn kho thực tế với hệ thống cho khu vực A', 1, 2, 2, 'HIGH', 'TODO', NOW() + INTERVAL '5 day'),
('Cập nhật giá nhà cung cấp mới', 'Liên hệ NCC mới để đàm phán giá', 3, 1, 3, 'MEDIUM', 'TODO', NOW() + INTERVAL '10 day');


INSERT INTO deliveries (
    delivery_id,
    recipient_name,
    dept_id,
    product_id,
    quantity,
    delivery_time,
    status,
    qr_code_data,
    note
) VALUES (
    'DLV-001',
    'Trần Thị Nhân Viên',
    (SELECT id FROM departments WHERE name = 'Phòng Nhân sự'),
    (SELECT product_id FROM water_product WHERE name = 'Nước tinh khiết 20L'),
    1,
    NOW() + INTERVAL '2 hour',
    'Chờ giao',
    '{"delivery":"DLV-001","product":"20L","qty":1}',
    'chu thi'
);



SELECT 
    d.delivery_id,
    d.recipient_name,
    dept.name AS department_name,      
    p.name AS product_name,           
    p.unit,                           
    d.quantity,
    d.delivery_time,
    d.status,
    d.qr_code_data,                  
    d.updated_at,
    d.note
FROM deliveries d
LEFT JOIN departments dept ON d.dept_id = dept.id
LEFT JOIN water_product p ON d.product_id = p.product_id
ORDER BY d.delivery_time DESC;
