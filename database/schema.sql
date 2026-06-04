CREATE DATABASE IF NOT EXISTS smartbank_ai;
USE smartbank_ai;

-- SmartBank AI MySQL schema.
-- Spring Boot JPA also creates/updates these tables automatically.

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  enabled BIT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_email (email)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_number VARCHAR(40) NOT NULL UNIQUE,
  qr_code VARCHAR(80) UNIQUE,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  frozen_balance DECIMAL(15,2) DEFAULT 0.00,
  account_type VARCHAR(40) DEFAULT 'SAVINGS',
  status VARCHAR(40) DEFAULT 'ACTIVE',
  user_id BIGINT NOT NULL UNIQUE,
  INDEX idx_account_number (account_number),
  INDEX idx_qr_code (qr_code),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(40),
  category VARCHAR(40),
  amount DECIMAL(15,2) NOT NULL,
  description VARCHAR(255),
  receiver_account VARCHAR(40),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tx_user_date (user_id, created_at),
  INDEX idx_tx_receiver (receiver_account),
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  transaction_id BIGINT,
  risk_level VARCHAR(20),
  reason VARCHAR(255),
  resolved BIT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fraud_user (user_id),
  CONSTRAINT fk_fraud_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_fraud_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE TABLE IF NOT EXISTS investment_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  monthly_income DECIMAL(15,2),
  monthly_expenses DECIMAL(15,2),
  investment_goal VARCHAR(255),
  risk_appetite VARCHAR(40),
  investment_duration_years INT,
  risk_type VARCHAR(30),
  CONSTRAINT fk_investment_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS portfolio (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  asset_name VARCHAR(160),
  asset_type VARCHAR(80),
  invested_amount DECIMAL(15,2),
  current_value DECIMAL(15,2),
  CONSTRAINT fk_portfolio_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS loan_applications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  credit_score INT,
  monthly_income DECIMAL(15,2),
  existing_emi DECIMAL(15,2),
  loan_amount DECIMAL(15,2),
  employment_type VARCHAR(80),
  status VARCHAR(40),
  approval_score INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(160),
  otp VARCHAR(20),
  expires_at DATETIME,
  verified BIT DEFAULT 0,
  INDEX idx_otp_email (email)
);

CREATE TABLE IF NOT EXISTS kyc_applications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  full_name VARCHAR(160),
  mobile_number VARCHAR(30),
  address VARCHAR(255),
  pan_number VARCHAR(40),
  aadhaar_number VARCHAR(40),
  status VARCHAR(30) DEFAULT 'PENDING',
  remarks VARCHAR(255),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  INDEX idx_kyc_user (user_id),
  CONSTRAINT fk_kyc_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT,
  actor_role VARCHAR(80),
  action VARCHAR(120),
  module VARCHAR(120),
  description VARCHAR(500),
  ip_address VARCHAR(80),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_module (module),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
);
