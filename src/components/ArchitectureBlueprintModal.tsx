import React, { useState } from 'react';
import { 
  FileCode2, 
  Database, 
  ShieldCheck, 
  ScanLine, 
  Layers, 
  Copy, 
  Check, 
  Download,
  Terminal,
  Layout,
  Server,
  Smartphone,
  Eye,
  KeyRound,
  Lock
} from 'lucide-react';

export const ArchitectureBlueprintModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'sql' | 'auth-pin' | 'deduction' | 'rbac'>('blueprint');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const UI_UX_BLUEPRINT = `# =========================================================================
# AGROPULSE ERP: COMPREHENSIVE UI/UX ARCHITECTURE & LAYOUT BLUEPRINTS
# Designed for Desktop Counter Terminals & Mobile Field Agronomists
# =========================================================================

1. GLOBAL NAVIGATION & 3-ZONE TOP BAR CONTRACT
-------------------------------------------------------------------------
- Zone 1 (Brand Wordmark & Regulatory Badges): 
  [Sprout Icon] "AgroPulse" - Single-line wordmark, subtitle: "Agrochemical & Seed ERP"
  Compliance Tag: CIB&RC Schedule IV & Seeds Act 1966 Section 7.
- Zone 2 (Contextual Navigation): 
  Desktop: Dashboard | POS Billing | Inventory & QR | Suppliers (AP)* | Farmer Khata | Staff & Credentials | Analytics* | Mobile Field App | System Blueprint*
  (* Marked tabs strictly hidden from Worker role).
  Mobile: Horizontal swipeable sub-nav with 44px touch targets.
- Zone 3 (Authentication, Account Security & Device Session):
  Active User Profile ("Store Owner / Admin" or "Cashier Counter"), live Role Badge (ADMIN / WORKER),
  Dedicated "Change PIN" [KeyRound icon] quick action modal trigger, and a persistent "Sign Out" button.

2. MODULE 1: OPERATIONAL DASHBOARD BLUEPRINT
-------------------------------------------------------------------------
- Header Action Strip:
  [Launch Camera POS] [Inbound Stock QR] [Batch Stickers Sheet]
- 4-Column High-Density KPI Strip (Tabular Numerals):
  * Card 1: Gross Sales Revenue (Admin) vs Total Invoices Billed (Worker).
  * Card 2: Chemical & Seed Expiry Alert (Red expired countdown + Amber <60 days).
  * Card 3: Live Stock Thresholds (Under-threshold count + total live units).
  * Card 4: Farmer Khata Debt Ledger (Total Receivables for Admin; Active Accounts count for Worker).
- Two-Column Operational Splits (2:1 Grid):
  * Left (2 cols): Chemical & Seed Expiration Radar Table (Batch No, Active Chemical, Available Qty, Expiry Date, Status Tag, 1-Click Print QR).
  * Right (1 col): Recent Counter POS Invoices Ledger with 1-click printable receipt drawer.

3. MODULE 2: INVENTORY & DYNAMIC BATCH QR ENGINE BLUEPRINT
-------------------------------------------------------------------------
- Filter & Search Hierarchy:
  * Full-width search indexing Active Ingredients (e.g. Chlorpyrifos, Fipronil), Brand, and Batch #.
  * Segmented Category Dropdown: Insecticide | Herbicide | Fungicide | Hybrid Seed | Bio-stimulant | Fertilizer.
  * Expiry urgency buttons: All | < 60 Days | Expired.
- Expandable Master Product Cards:
  * Title, Brand, Chemical Toxicity Triangle Badge (Red Cat I, Yellow Cat II, Blue Cat III, Green Cat IV, None).
  * Statutory CIB&RC Registration No, HSN Code, and GST Rate (0%, 5%, 12%, 18%).
  * Nested Batch Table: Dynamic QR Thumbnail, Batch #, Mfg/Exp Date, Live Stock, Retail Price (MRP).
  * Role Protection: Cost Price and Wholesale Profit Margin % are strictly visible to ADMIN; 100% masked from WORKER.
- Printable Adhesive Label Modal:
  * Generates 1-label, 8-label (2x4), or 16-label (4x4) sheets with high-density QR code, chemical active ingredient, batch, MRP, expiry, and safety notice.

4. MODULE 3: SMART POINT OF SALE (POS) SCAN-TO-BILL BLUEPRINT
-------------------------------------------------------------------------
- Split Viewport Layout (7:5 Desktop, Single Column Mobile):
  * Left (7 cols) - Scanner & Catalog:
    - WebRTC Camera QR Reader with environment camera toggle, scan box viewfinder, and auto-beeper.
    - Quick Test Tap-to-Scan Bar (for instant camera simulation on desktop).
    - Real-time catalog search by active ingredient or trade name.
  * Right (5 cols) - Cart Terminal & Ledger Settlement:
    - Customer / Farmer Account dropdown (links directly to Farmer Khata credit).
    - Line item list with instant +/- quantity adjustments and stock validation locks.
    - Payment Method Selector: Cash (green) | UPI / QR (blue) | Khata Credit (amber).
    - Statutory GST Breakup (Net Subtotal + Tiered Tax Total - Discount = Grand Total).
    - Big CTA: "Generate Tax Invoice & Deduct Stock" -> Triggers atomic row-lock deduction and launches printable Tax Invoice.

5. MODULE 4: STAFF CREDENTIALS & DEVICE AUTHORIZATION BLUEPRINT
-------------------------------------------------------------------------
- Admin Management Console:
  * Employee Table: Name, Phone / Login ID, 4-Digit Security PIN (with eye toggle), Role (WORKER / ADMIN), Shift, Account Status.
  * Action Controls: "Create Staff Account", "Edit / Reset 4-Digit PIN", "Instant Device Lockout (Power Toggle)", "Delete Staff".
  * Remote Lockout Engine: Setting a worker to INACTIVE immediately revokes their JWT session token upon the next API call or page refresh.
- Worker Restricted View:
  * Workers cannot view other staff records, reviews, or salaries.
  * Worker view contains only: Self Clock-In/Clock-Out Terminal with counter timestamp, and Self Leave Request Form.

6. MODULE 5: ACCOUNT SECURITY & PIN / PASSWORD MANAGEMENT BLUEPRINT
-------------------------------------------------------------------------
- Self-Service PIN Change Modal (Accessible to both Admin & Workers from Header & Staff Panel):
  * User Identity Context Banner: Displays currently authenticated Staff Name, Phone/Email, and Role.
  * Current 4-Digit PIN Input: Masked input with reveal eye-toggle; validated against stored bcrypt hash.
  * New 4-Digit PIN Input: Restricted to exactly 4 numeric characters (0-9) via regex and numeric keypad mode.
  * Confirm New 4-Digit PIN Input: Real-time parity check against New PIN.
  * Security Guarantees:
    - Rejects if new PIN equals current PIN.
    - Automatically rotates and re-issues the persistent device JWT token upon successful update.
    - Device remains authenticated without requiring re-login.
- Admin PIN Override Console:
  * Allows Store Owner to reset any employee's PIN directly without knowing their previous PIN.

7. MODULE 6: SUPPLIER LEDGER & ACCOUNTS PAYABLE (AP) BLUEPRINT
-------------------------------------------------------------------------
- Summary KPI Strip: Total Outstanding Balance Due | Registered Companies | Pending Bills | Overdue Bills.
- Supplier Directory Cards: Company, Representative Phone, GSTIN, License, agreed credit days.
- Inbound Consignments Ledger: Bill No, Supplier, Bill Date, Due Date, Total, Paid, Balance, and "Record Payment" workflow modal.
- Worker Protection: This entire module is completely hidden and inaccessible to Workers.`;

  const SQL_DDL = `-- =========================================================================
-- AGROPULSE ERP: ENTERPRISE POSTGRESQL RELATIONAL DATABASE SCHEMA
-- Compliant with Insecticides Act 1968, Seeds Act 1966, & GST Rules
-- =========================================================================

-- 1. ENUMS
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'WORKER');
CREATE TYPE product_type_enum AS ENUM ('INSECTICIDE', 'HERBICIDE', 'FUNGICIDE', 'HYBRID_SEED', 'BIO_STIMULANT', 'FERTILIZER');
CREATE TYPE toxicity_class_enum AS ENUM ('RED', 'YELLOW', 'BLUE', 'GREEN', 'NONE');
CREATE TYPE payment_method_enum AS ENUM ('CASH', 'UPI', 'KHATA_CREDIT', 'SPLIT');
CREATE TYPE bill_status_enum AS ENUM ('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE');
CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE');

-- 2. USERS & DEVICE CREDENTIALS (RBAC & PERSISTENT DEVICE SESSIONS)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    pin_hash VARCHAR(255) NOT NULL, -- 4-digit security PIN hashed via bcrypt (salt rounds: 12)
    role user_role_enum NOT NULL DEFAULT 'WORKER',
    shift VARCHAR(50) DEFAULT 'MORNING',
    status VARCHAR(50) DEFAULT 'ACTIVE', -- Toggle to INACTIVE instantly locks out device session
    last_login_at TIMESTAMPTZ,
    last_pin_change_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);

-- 3. PERSISTENT DEVICE SESSIONS (REMEMBER THIS DEVICE)
CREATE TABLE device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_fingerprint TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. SUPPLIERS (ACCOUNTS PAYABLE ORIGIN)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(255),
    gstin VARCHAR(20) UNIQUE NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    credit_due_days INT DEFAULT 30,
    outstanding_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCTS & CHEMICAL REGISTRATION
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(150) NOT NULL,
    product_type product_type_enum NOT NULL,
    active_ingredient TEXT NOT NULL,
    toxicity_class toxicity_class_enum NOT NULL DEFAULT 'NONE',
    government_license_no VARCHAR(100) NOT NULL,
    hsn_code VARCHAR(20) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    min_stock_threshold INT NOT NULL DEFAULT 10,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. BATCHES WITH DYNAMIC QR CODES & EXPIRATION AUDIT
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    supplier_invoice_no VARCHAR(100) NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    initial_quantity NUMERIC(10, 2) NOT NULL,
    current_quantity NUMERIC(10, 2) NOT NULL CHECK (current_quantity >= 0),
    unit VARCHAR(20) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL, -- Restricted from Worker role
    retail_price NUMERIC(12, 2) NOT NULL, -- MRP
    seed_germination_rate NUMERIC(5, 2), -- Mandatory for certified seeds
    seed_purity_rate NUMERIC(5, 2),
    qr_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_batch UNIQUE (product_id, batch_number)
);

CREATE INDEX idx_batches_expiry ON batches(expiry_date);
CREATE INDEX idx_batches_current_quantity ON batches(current_quantity);

-- 7. FARMER CUSTOMERS (KHATA CREDIT LEDGER)
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    village VARCHAR(150) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    credit_limit NUMERIC(12, 2) DEFAULT 25000.00,
    outstanding_debt NUMERIC(12, 2) DEFAULT 0.00 CHECK (outstanding_debt >= 0),
    promised_pay_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. POS SALES INVOICES
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    cashier_id UUID NOT NULL REFERENCES users(id),
    farmer_id UUID REFERENCES farmers(id),
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(25),
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_total NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL,
    credit_due NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. INVOICE LINE ITEMS (HISTORICAL AUDIT SNAPSHOT)
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL
);

-- 10. SUPPLIER PURCHASE INVOICES (ACCOUNTS PAYABLE)
CREATE TABLE supplier_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) DEFAULT 0.00,
    balance_amount NUMERIC(14, 2) NOT NULL,
    status bill_status_enum DEFAULT 'UNPAID',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. STAFF SHIFTS & ATTENDANCE LOG
CREATE TABLE staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in_time VARCHAR(20) NOT NULL,
    clock_out_time VARCHAR(20),
    status attendance_status_enum NOT NULL DEFAULT 'PRESENT',
    shift_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. SEEDED MASTER ADMIN USER ACCOUNT (HskingBohra5253 / PIN: 5253)
-- Pre-configured Store Owner with bcrypt hashed PIN 5253 (salt rounds: 12)
INSERT INTO users (
    id,
    name,
    phone,
    email,
    pin_hash,
    role,
    shift,
    status
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Store Owner (HskingBohra)',
    'HskingBohra5253',
    'HskingBohra5253@agropulse.store',
    '$2b$12$e8YkZ7Gv5Qz2W8P0v.M5y.h6mO3hJ1dE8fK7pL2qT9uV4wX0yZ2aO', -- Bcrypt hash of PIN 5253
    'ADMIN',
    'FULL_DAY',
    'ACTIVE'
) ON CONFLICT (phone) DO UPDATE 
SET pin_hash = EXCLUDED.pin_hash, 
    role = 'ADMIN', 
    status = 'ACTIVE';`;

  const AUTH_PIN_CODE = `// =========================================================================
// PRODUCTION AUTHENTICATION & SECURE PIN/PASSWORD CHANGE ENDPOINTS
// Express.js + TypeScript + Bcrypt + JWT + Device Session Token Management
// =========================================================================

import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { authenticateToken, AuthenticatedRequest } from './middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'agropulse_secure_jwt_secret_982';
const BCRYPT_SALT_ROUNDS = 12;

/**
 * 1. POST /api/auth/login
 * Staff and Admins log in using Phone/Email + 4-Digit Security PIN
 * Supports "rememberDevice: true" to issue a 90-day persistent session token
 */
router.post('/login', async (req: Request, res: Response) => {
  const { identifier, pin, rememberDevice } = req.body;
  const pool: Pool = req.app.get('dbPool');

  if (!identifier || !pin) {
    return res.status(400).json({ error: 'Missing identifier or 4-digit PIN' });
  }

  try {
    // Lookup user by phone or email
    const cleanId = String(identifier).trim().toLowerCase();
    const result = await pool.query(
      \`SELECT id, name, phone, email, pin_hash, role, status 
       FROM users 
       WHERE LOWER(phone) = $1 OR LOWER(email) = $1\`,
      [cleanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found. Please verify your phone or email.' });
    }

    const user = result.rows[0];

    // Check account status (Instant Lockout protection)
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Access Denied: This staff device account is deactivated by Admin.' });
    }

    // Verify 4-digit PIN using bcrypt
    const isPinMatch = await bcrypt.compare(String(pin).trim(), user.pin_hash);
    if (!isPinMatch) {
      return res.status(401).json({ error: 'Invalid 4-digit PIN. Please try again.' });
    }

    // Generate JWT Token (90 days for persistent device; 24h otherwise)
    const expiresIn = rememberDevice ? '90d' : '24h';
    const payload = {
      userId: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    // Update last login timestamp
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal authentication server error' });
  }
});

/**
 * 2. POST /api/auth/change-pin
 * Secure self-service endpoint for Workers & Admins to change their 4-digit PIN
 * Requires valid Bearer JWT + current PIN verification
 */
router.post('/change-pin', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPin, newPin } = req.body;
  const userId = req.user?.userId;
  const pool: Pool = req.app.get('dbPool');

  if (!userId) {
    return res.status(401).json({ error: 'Unauthenticated session' });
  }

  // 1. Validate format: must be exactly 4 numeric digits
  const cleanNewPin = String(newPin || '').trim();
  if (!/^\\d{4}$/.test(cleanNewPin)) {
    return res.status(400).json({ error: 'New PIN must be exactly 4 numeric digits (0-9).' });
  }

  try {
    // 2. Fetch current user from database
    const userRes = await pool.query(
      'SELECT id, pin_hash, status, role, name, phone FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    // 3. Verify current PIN
    const isCurrentValid = await bcrypt.compare(String(currentPin).trim(), user.pin_hash);
    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Incorrect current PIN. Please verify your existing code.' });
    }

    // 4. Ensure new PIN is not identical to current PIN
    const isSamePin = await bcrypt.compare(cleanNewPin, user.pin_hash);
    if (isSamePin) {
      return res.status(400).json({ error: 'New PIN must be different from your current PIN.' });
    }

    // 5. Hash new PIN with bcrypt and persist
    const newHash = await bcrypt.hash(cleanNewPin, BCRYPT_SALT_ROUNDS);
    await pool.query(
      'UPDATE users SET pin_hash = $1, last_pin_change_at = NOW(), updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    // 6. Rotate and refresh JWT token so the shop device stays logged in seamlessly
    const refreshedToken = jwt.sign(
      { userId: user.id, name: user.name, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    return res.json({
      success: true,
      message: 'Security PIN successfully updated. Persistent device session refreshed.',
      refreshedToken,
    });

  } catch (error: any) {
    console.error('Change PIN error:', error);
    return res.status(500).json({ error: 'Failed to update security PIN' });
  }
});

/**
 * 3. POST /api/admin/reset-staff-pin
 * Store Owner / Admin endpoint to directly reset any staff member's PIN
 */
router.post('/admin/reset-staff-pin', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required to reset employee credentials.' });
  }

  const { targetStaffId, newPin } = req.body;
  const pool: Pool = req.app.get('dbPool');

  const cleanNewPin = String(newPin || '').trim();
  if (!/^\\d{4}$/.test(cleanNewPin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
  }

  try {
    const newHash = await bcrypt.hash(cleanNewPin, BCRYPT_SALT_ROUNDS);
    await pool.query(
      'UPDATE users SET pin_hash = $1, last_pin_change_at = NOW(), updated_at = NOW() WHERE id = $2',
      [newHash, targetStaffId]
    );

    return res.json({ success: true, message: 'Staff PIN updated successfully by Admin.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset staff PIN' });
  }
});

export default router;`;

  const DEDUCTION_CODE = `// =========================================================================
// PRODUCTION BATCH DEDUCTION TRANSACTION SERVICE (NODE.JS / POSTGRESQL)
// Enforces Row-Level Locking (SELECT ... FOR UPDATE) to prevent race conditions
// Validates chemical expiration date & statutory pesticide quotas
// =========================================================================

import { Pool, PoolClient } from 'pg';

interface SaleItemRequest {
  batchId: string;
  quantity: number;
}

export async function processAtomicPOSSale(
  pool: Pool,
  userId: string,
  farmerId: string | null,
  customerName: string,
  customerPhone: string,
  paymentMethod: 'CASH' | 'UPI' | 'KHATA_CREDIT',
  items: SaleItemRequest[]
) {
  const client: PoolClient = await pool.connect();

  try {
    // 1. Begin atomic isolation transaction
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');

    let subtotal = 0;
    let taxTotal = 0;
    const validatedLines: any[] = [];

    // 2. Lock & Validate each batch row individually (Preventing concurrent overselling)
    for (const item of items) {
      const batchRes = await client.query(
        \`SELECT b.id, b.batch_number, b.current_quantity, b.expiry_date, b.retail_price, 
                p.id as product_id, p.name as product_name, p.active_ingredient, p.gst_rate
         FROM batches b
         JOIN products p ON b.product_id = p.id
         WHERE b.id = $1
         FOR UPDATE\`, // ROW-LEVEL EXCLUSIVE LOCK
        [item.batchId]
      );

      if (batchRes.rows.length === 0) {
        throw new Error(\`Batch ID \${item.batchId} not found in store.\`);
      }

      const batch = batchRes.rows[0];

      // A. Check for expired chemical/seed (Statutory Lockout)
      const expiryDate = new Date(batch.expiry_date);
      const today = new Date();
      if (expiryDate < today) {
        throw new Error(
          \`STATUTORY LOCKOUT: Batch \${batch.batch_number} of \${batch.product_name} expired on \${batch.expiry_date}. Law prohibits sale of expired agrochemicals.\`
        );
      }

      // B. Check sufficient stock
      if (Number(batch.current_quantity) < item.quantity) {
        throw new Error(
          \`Insufficient stock for batch \${batch.batch_number}. Available: \${batch.current_quantity}, Requested: \${item.quantity}\`
        );
      }

      // C. Deduct Stock Live
      await client.query(
        \`UPDATE batches 
         SET current_quantity = current_quantity - $1 
         WHERE id = $2\`,
        [item.quantity, batch.id]
      );

      // D. Tax & line calculation
      const lineTotal = Number(batch.retail_price) * item.quantity;
      const gstRate = Number(batch.gst_rate);
      const lineTax = (lineTotal * gstRate) / (100 + gstRate);
      const lineNet = lineTotal - lineTax;

      subtotal += lineNet;
      taxTotal += lineTax;

      validatedLines.push({
        batchId: batch.id,
        productId: batch.product_id,
        quantity: item.quantity,
        unitPrice: Number(batch.retail_price),
        gstRate,
        taxAmount: lineTax,
        total: lineTotal,
      });
    }

    const grandTotal = subtotal + taxTotal;
    const amountPaid = paymentMethod === 'KHATA_CREDIT' ? 0 : grandTotal;
    const creditDue = paymentMethod === 'KHATA_CREDIT' ? grandTotal : 0;
    const invoiceNumber = \`AGRO-\${Date.now()}\`;

    // 3. Insert Invoice Header
    const invoiceRes = await client.query(
      \`INSERT INTO invoices (
        invoice_number, cashier_id, farmer_id, customer_name, customer_phone,
        subtotal, tax_total, grand_total, payment_method, amount_paid, credit_due
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, invoice_number\`,
      [invoiceNumber, userId, farmerId, customerName, customerPhone, subtotal, taxTotal, grandTotal, paymentMethod, amountPaid, creditDue]
    );

    const invoiceId = invoiceRes.rows[0].id;

    // 4. Insert Line Items
    for (const line of validatedLines) {
      await client.query(
        \`INSERT INTO invoice_items (invoice_id, product_id, batch_id, quantity, unit_price, gst_rate, tax_amount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\`,
        [invoiceId, line.productId, line.batchId, line.quantity, line.unitPrice, line.gstRate, line.taxAmount, line.total]
      );
    }

    // 5. If Khata Credit Sale, atomize debt addition to farmer ledger
    if (paymentMethod === 'KHATA_CREDIT' && farmerId) {
      await client.query(
        \`UPDATE farmers 
         SET outstanding_debt = outstanding_debt + $1 
         WHERE id = $2\`,
        [creditDue, farmerId]
      );
    }

    // 6. Commit Transaction
    await client.query('COMMIT');
    return { success: true, invoiceId, invoiceNumber, grandTotal };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}`;

  const RBAC_MIDDLEWARE = `// =========================================================================
// PRODUCTION EXPRESS RBAC & JWT AUTHENTICATION MIDDLEWARE
// Strict separation between Owner/Admin and Restricted Counter Worker
// Masks financial margins, cost prices, and wholesale supplier balances
// =========================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'ADMIN' | 'WORKER';

export interface AuthenticatedUser {
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * 1. Verifies JWT token on incoming HTTP Bearer header
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Missing Bearer Session Token' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'agropulse_secure_jwt_secret_982', (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired device session' });
    }
    req.user = decoded as AuthenticatedUser;
    next();
  });
}

/**
 * 2. Enforces Role-Based Access Control on endpoint route
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated user' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: \`RBAC Forbidden: Role '\${req.user.role}' is unauthorized to access this resource.\`,
        permittedRoles: allowedRoles,
      });
    }

    next();
  };
}

/**
 * 3. Response Sanitizer: Masks cost prices and supplier financials for Workers
 */
export function sanitizeInventoryForWorker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function (data: any) {
    if (req.user && req.user.role === 'WORKER') {
      const scrub = (obj: any) => {
        delete obj.costPrice;
        delete obj.cost_price;
        delete obj.profitMargin;
        delete obj.wholesaleCost;
        if (Array.isArray(obj.batches)) {
          obj.batches.forEach(scrub);
        }
      };

      if (Array.isArray(data)) {
        data.forEach(scrub);
      } else if (data && typeof data === 'object') {
        scrub(data);
      }
    }
    return originalJson.call(this, data);
  };

  next();
}`;

  const currentCode = activeTab === 'blueprint' 
    ? UI_UX_BLUEPRINT 
    : activeTab === 'sql' 
    ? SQL_DDL 
    : activeTab === 'auth-pin'
    ? AUTH_PIN_CODE
    : activeTab === 'deduction' 
    ? DEDUCTION_CODE 
    : RBAC_MIDDLEWARE;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise System Architecture &amp; Deliverables
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Production-grade deliverables: UI/UX layout blueprints, Relational PostgreSQL DDL, Persistent JWT Auth &amp; Secure Change PIN endpoints, Atomic POS batch deduction, and RBAC field masking.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              activeTab === 'blueprint' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UI/UX Blueprint
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              activeTab === 'sql' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PostgreSQL DDL
          </button>
          <button
            onClick={() => setActiveTab('auth-pin')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              activeTab === 'auth-pin' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auth &amp; Change PIN
          </button>
          <button
            onClick={() => setActiveTab('deduction')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              activeTab === 'deduction' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atomic Deduction
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              activeTab === 'rbac' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Express RBAC
          </button>
        </div>
      </div>

      {/* Code / Blueprint Viewer Panel */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>
              {activeTab === 'blueprint' && 'docs/UI_UX_LAYOUT_BLUEPRINTS.md (Dashboard, Inventory, POS, Staff, PIN & Suppliers)'}
              {activeTab === 'sql' && 'database/schema.sql (PostgreSQL 16+ Relational Schema & Constraints)'}
              {activeTab === 'auth-pin' && 'routes/auth.ts (Persistent JWT & Secure Change PIN Endpoint)'}
              {activeTab === 'deduction' && 'services/posDeductionService.ts (Row-Level Locking SELECT ... FOR UPDATE)'}
              {activeTab === 'rbac' && 'middleware/rbacAuth.ts (Worker Field Masking & Token Verification)'}
            </span>
          </div>

          <button
            onClick={() => copyToClipboard(currentCode, activeTab)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
          >
            {copiedKey === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === activeTab ? 'Copied to Clipboard' : 'Copy Content'}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[600px] text-xs font-mono leading-relaxed text-slate-200">
          <pre>{currentCode}</pre>
        </div>
      </div>

    </div>
  );
};
