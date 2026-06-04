USE smartbank_ai;

-- Core roles used by Spring Security.
INSERT INTO roles (name) VALUES ('ROLE_ADMIN'), ('ROLE_CUSTOMER')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- The application automatically seeds this admin on startup with BCrypt password:
-- Email: dwivediprabhanshu17@gmail.com
-- Password: Prabhanshu@9981
-- Mobile: 9981258482
-- Account: SBADMIN001
-- QR: SBQR-SBADMIN001

-- Optional customer demo data.
-- Use only if you want a ready approved customer for database inspection.
-- Replace password with a BCrypt hash before using for real login.

INSERT INTO users (name, email, password, phone, enabled, created_at)
VALUES
  ('Demo Customer', 'demo.customer@smartbank.local', '$2a$10$replace_with_bcrypt_hash', '9981258482', 1, NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'demo.customer@smartbank.local'
  AND r.name = 'ROLE_CUSTOMER'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO kyc_applications (
  user_id, full_name, mobile_number, address, pan_number, aadhaar_number,
  status, remarks, submitted_at, reviewed_at
)
SELECT u.id, 'Demo Customer', '9981258482', 'SmartBank Demo Address',
       'ABCDE1234F', '123456789012', 'APPROVED', 'Approved demo KYC', NOW(), NOW()
FROM users u
WHERE u.email = 'demo.customer@smartbank.local'
ON DUPLICATE KEY UPDATE status = 'APPROVED', reviewed_at = NOW();

INSERT INTO accounts (
  account_number, qr_code, balance, frozen_balance, account_type, status, user_id
)
SELECT 'SBDEMO001', 'SBQR-SBDEMO001', 9180.00, 0.00, 'SAVINGS', 'ACTIVE', u.id
FROM users u
WHERE u.email = 'demo.customer@smartbank.local'
ON DUPLICATE KEY UPDATE balance = VALUES(balance), status = VALUES(status);

INSERT INTO transactions (user_id, type, category, amount, description, receiver_account, created_at)
SELECT u.id, 'DEPOSIT', 'SALARY', 80312.00, 'Cash deposit', NULL, NOW()
FROM users u WHERE u.email = 'demo.customer@smartbank.local'
UNION ALL
SELECT u.id, 'WITHDRAW', 'OTHER', 4000.00, 'Cash withdrawal', NULL, NOW()
FROM users u WHERE u.email = 'demo.customer@smartbank.local'
UNION ALL
SELECT u.id, 'TRANSFER', 'TRANSFER', 999.00, 'QR payment', 'SBQR-SBADMIN001', NOW()
FROM users u WHERE u.email = 'demo.customer@smartbank.local';

INSERT INTO fraud_alerts (user_id, transaction_id, risk_level, reason, resolved, created_at)
SELECT u.id, NULL, 'LOW', 'Multiple transactions in short time', 0, NOW()
FROM users u
WHERE u.email = 'demo.customer@smartbank.local';

INSERT INTO investment_profiles (
  user_id, monthly_income, monthly_expenses, investment_goal,
  risk_appetite, investment_duration_years, risk_type
)
SELECT u.id, 200000.00, 18000.00, 'Child education', 'High', 4, 'AGGRESSIVE'
FROM users u
WHERE u.email = 'demo.customer@smartbank.local'
ON DUPLICATE KEY UPDATE risk_type = 'AGGRESSIVE';

INSERT INTO portfolio (user_id, asset_name, asset_type, invested_amount, current_value)
SELECT u.id, 'Equity mutual funds', 'Mutual Fund', 36400.00, 36400.00
FROM users u
WHERE u.email = 'demo.customer@smartbank.local';

INSERT INTO loan_applications (
  user_id, credit_score, monthly_income, existing_emi, loan_amount,
  employment_type, status, approval_score, created_at
)
SELECT u.id, 760, 90000.00, 12000.00, 700000.00, 'Salaried', 'APPROVED', 80, NOW()
FROM users u
WHERE u.email = 'demo.customer@smartbank.local';

INSERT INTO audit_logs (actor_user_id, actor_role, module, action, description, ip_address, created_at)
VALUES
  (1, 'ADMIN', 'KYC', 'KYC Approval', 'Approved demo KYC request', '127.0.0.1', NOW()),
  (1, 'ADMIN', 'ACCOUNT', 'Account Creation', 'Created savings account for approved KYC', '127.0.0.1', NOW()),
  (1, 'ADMIN', 'FRAUD', 'Fraud Review', 'Reviewed demo fraud alert', '127.0.0.1', NOW());
