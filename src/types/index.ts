export type UserRole = 'ADMIN' | 'WORKER';

export type ProductType = 
  | 'INSECTICIDE' 
  | 'HERBICIDE' 
  | 'FUNGICIDE' 
  | 'HYBRID_SEED' 
  | 'BIO_STIMULANT' 
  | 'FERTILIZER';

export type ToxicityClass = 
  | 'RED'    // Extremely Toxic
  | 'YELLOW' // Highly Toxic
  | 'BLUE'   // Moderately Toxic
  | 'GREEN'  // Slightly Toxic
  | 'NONE';  // E.g. Seeds, Organic

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string;        // YYYY-MM-DD
  initialQuantity: number;
  currentQuantity: number;
  unit: 'KG' | 'LITRE' | 'PACKET' | 'BOTTLE' | 'BAG';
  costPrice: number;         // Hidden from Worker role
  retailPrice: number;       // MRP
  supplierId: string;
  supplierInvoiceNo: string;
  seedGerminationRate?: number; // % for seeds
  seedPurityRate?: number;      // % for seeds
  qrCodeDataUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  activeIngredient: string; // e.g. "Chlorpyrifos 50% + Cypermethrin 5% EC"
  toxicityClass: ToxicityClass;
  governmentLicenseNo: string; // CIB&RC or Seed Dealer Lic
  minStockThreshold: number;
  gstRate: number; // e.g. 5, 12, 18
  hsnCode: string;
  description: string;
  batches: Batch[];
}

export interface CartItem {
  product: Product;
  batch: Batch;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxAmount: number;
  total: number;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'KHATA_CREDIT' | 'SPLIT';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  cashierId: string;
  cashierName: string;
  customerName: string;
  customerPhone: string;
  customerVillage?: string;
  farmerId?: string; // If registered in Khata
  items: {
    productId: string;
    productName: string;
    batchId: string;
    batchNumber: string;
    activeIngredient: string;
    expiryDate: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    gstRate: number;
    taxAmount: number;
    total: number;
  }[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  creditDue: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  gstin: string;
  licenseNumber: string;
  address: string;
  outstandingBalance: number;
  paymentDueDays: number;
  invoicesCount: number;
  lastPaymentDate?: string;
}

export interface SupplierBill {
  id: string;
  supplierId: string;
  supplierName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
  itemsReceived: {
    productName: string;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface FarmerCustomer {
  id: string;
  name: string;
  fatherName?: string;
  village: string;
  phone: string;
  totalPurchases: number;
  outstandingDebt: number;
  creditLimit: number;
  promisedPayDate?: string;
  status: 'CLEAR' | 'CURRENT' | 'WARNING' | 'DEFAULTED';
  transactions: {
    id: string;
    date: string;
    type: 'PURCHASE_CREDIT' | 'PAYMENT_RECEIVED';
    amount: number;
    balanceAfter: number;
    invoiceNumber?: string;
    note: string;
  }[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  pin: string; // 4-digit PIN or password for shop login
  joinedDate: string;
  shift: 'MORNING' | 'EVENING' | 'FULL_DAY';
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  lastLoginAt?: string;
  metrics: {
    salesCount: number;
    totalRevenue: number;
    avgTransactionTimeSeconds: number;
  };
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  clockInTime: string;
  clockOutTime?: string;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'HOLIDAY';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
}

export interface QRPayload {
  v: number;              // Version 1
  bId: string;            // Batch ID
  pId: string;            // Product ID
  pName: string;          // Product Name
  bNo: string;            // Batch Number
  exp: string;            // Expiry Date YYYY-MM
  mrp: number;            // Retail Price
  ai: string;             // Active Ingredient
  lic: string;            // Lic No
  tox: ToxicityClass;     // Toxicity Category
}
