-- Initial Migration Script for CRM / HRMS PostgreSQL Database
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    emp_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(30),
    dob DATE,
    gender VARCHAR(10) DEFAULT 'Male',
    address TEXT,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    joining_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Active',
    salary NUMERIC(12,2) DEFAULT 50000.00,
    basic_salary NUMERIC(12,2) DEFAULT 30000.00,
    allowances NUMERIC(12,2) DEFAULT 20000.00,
    reporting_manager_id VARCHAR(50),
    reporting_manager_name VARCHAR(100),
    pan_number VARCHAR(20),
    uan_number VARCHAR(30),
    bank_account VARCHAR(30),
    ifsc_code VARCHAR(20),
    pin VARCHAR(10) DEFAULT '1234'
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code),
    date DATE NOT NULL,
    check_in VARCHAR(20),
    check_out VARCHAR(20),
    work_hours NUMERIC(4,2) DEFAULT 0.0,
    status VARCHAR(30) NOT NULL,
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_events (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(20) NOT NULL,
    source VARCHAR(30) DEFAULT 'WEB_KIOSK',
    device_id VARCHAR(50) DEFAULT 'WEB-KIOSK-01'
);

-- Seed initial employees if empty
INSERT INTO employees (id, emp_code, name, email, phone, dob, gender, address, department, designation, joining_date, status, salary, basic_salary, allowances, reporting_manager_id, reporting_manager_name, pan_number, uan_number, bank_account, ifsc_code, pin)
VALUES 
('EMP-001', 'EMP-001', 'Sarah Jenkins', 'sarah.jenkins@company.com', '+91 98765 10001', '1988-03-12', 'Female', '12 MG Road, Bengaluru', 'Engineering', 'VP of Engineering', '2022-01-10', 'Confirmed', 180000, 108000, 72000, 'EMP-000', 'Board of Directors', 'ABCDE1234F', '100987654321', '98765432101', 'HDFC0001234', '1234'),
('EMP-002', 'EMP-002', 'Michael Vance', 'michael.vance@company.com', '+91 98765 10002', '1992-07-22', 'Male', '45 Park Street, Mumbai', 'Sales', 'Sales Director', '2023-04-15', 'Confirmed', 150000, 90000, 60000, 'EMP-000', 'Board of Directors', 'FGHIJ5678K', '100987654322', '98765432102', 'ICIC0005678', '1234'),
('EMP-003', 'EMP-003', 'Priya Sharma', 'priya.sharma@company.com', '+91 98765 10003', '1995-11-05', 'Female', '88 Tech Zone, Hyderabad', 'HR', 'HR Operations Lead', '2023-08-01', 'Confirmed', 95000, 57000, 38000, 'EMP-001', 'Sarah Jenkins', 'KLMNO9012P', '100987654323', '98765432103', 'SBIN0009012', '1234'),
('EMP-004', 'EMP-004', 'Rahul Verma', 'rahul.verma@company.com', '+91 98765 10004', '1997-02-18', 'Male', '104 Outer Ring Road, Bengaluru', 'Engineering', 'Senior Full Stack Engineer', '2024-02-01', 'Probation', 85000, 51000, 34000, 'EMP-001', 'Sarah Jenkins', 'PQRST3456U', '100987654324', '98765432104', 'UTIB0003456', '1234')
ON CONFLICT (id) DO NOTHING;
