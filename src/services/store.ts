import { 
  Product, 
  Batch, 
  Supplier, 
  SupplierBill, 
  FarmerCustomer, 
  StaffMember, 
  AttendanceRecord, 
  LeaveRequest, 
  Invoice, 
  UserRole,
  CartItem,
  PaymentMethod,
  ProductType,
  ProductMatchResult,
  DetectedCodeInfo,
  ShopSettings
} from '../types';
import { createQRPayload, generateBatchQRCodeDataUrl, getDaysUntilExpiration } from './qrHelper';
import { analyzeScannedCode, matchDetectedCodeWithInventory, logScanToHistory } from './barcodeIntelligence';

const STORAGE_KEYS = {
  PRODUCTS: 'agropulse_live_prod_v4',
  SUPPLIERS: 'agropulse_live_sup_v4',
  SUPPLIER_BILLS: 'agropulse_live_bills_v4',
  FARMERS: 'agropulse_live_farmers_v4',
  STAFF: 'agropulse_live_staff_v4',
  ATTENDANCE: 'agropulse_live_att_v4',
  LEAVES: 'agropulse_live_leaves_v4',
  INVOICES: 'agropulse_live_inv_v4',
  AUTH_SESSION: 'agropulse_auth_jwt_session_v4',
  SHOP_SETTINGS: 'agropulse_shop_settings_v2',
};

export interface AuthSession {
  token: string;
  userId: string;
  role: UserRole;
  name: string;
  loginTimestamp: number;
}

// Master Admin Seed Account: Store Owner with Username: HskingBohra5253 and PIN: 5253
const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-owner-001',
    name: 'Store Owner (HskingBohra)',
    role: 'ADMIN',
    phone: 'HskingBohra5253',
    email: 'HskingBohra5253@agropulse.store',
    pin: '5253',
    joinedDate: new Date().toISOString().split('T')[0],
    shift: 'FULL_DAY',
    status: 'ACTIVE',
    metrics: {
      salesCount: 0,
      totalRevenue: 0,
      avgTransactionTimeSeconds: 0,
    }
  }
];

class StoreService {
  private products: Product[] = [];
  private suppliers: Supplier[] = [];
  private supplierBills: SupplierBill[] = [];
  private farmers: FarmerCustomer[] = [];
  private staff: StaffMember[] = [];
  private attendance: AttendanceRecord[] = [];
  private leaves: LeaveRequest[] = [];
  private invoices: Invoice[] = [];
  private currentSession: AuthSession | null = null;
  private shopSettings: ShopSettings = {
    shopName: 'AgroPulse Agro Chemicals & Seeds',
    shopAddress: '',
    shopPhone: '',
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      this.products = storedProds ? JSON.parse(storedProds) : [];

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SHOP_SETTINGS);
      if (storedSettings) {
        try {
          this.shopSettings = JSON.parse(storedSettings);
        } catch {
          // keep defaults
        }
      }

      const storedSups = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      this.suppliers = storedSups ? JSON.parse(storedSups) : [];

      const storedBills = localStorage.getItem(STORAGE_KEYS.SUPPLIER_BILLS);
      this.supplierBills = storedBills ? JSON.parse(storedBills) : [];

      const storedFar = localStorage.getItem(STORAGE_KEYS.FARMERS);
      this.farmers = storedFar ? JSON.parse(storedFar) : [];

      const storedStaff = localStorage.getItem(STORAGE_KEYS.STAFF);
      this.staff = storedStaff ? JSON.parse(storedStaff) : INITIAL_STAFF;

      // Ensure Master Admin account HskingBohra5253 exists with PIN 5253
      const masterAdmin = this.staff.find(s => s.role === 'ADMIN');
      if (!masterAdmin) {
        this.staff.unshift(INITIAL_STAFF[0]);
        this.saveStaff();
      } else {
        if (masterAdmin.pin === '1234' || !masterAdmin.phone || masterAdmin.phone.includes('9820090001')) {
          masterAdmin.name = 'Store Owner (HskingBohra)';
          masterAdmin.phone = 'HskingBohra5253';
          masterAdmin.email = 'HskingBohra5253@agropulse.store';
          masterAdmin.pin = '5253';
          this.saveStaff();
        }
      }

      const storedAtt = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      this.attendance = storedAtt ? JSON.parse(storedAtt) : [];

      const storedLev = localStorage.getItem(STORAGE_KEYS.LEAVES);
      this.leaves = storedLev ? JSON.parse(storedLev) : [];

      const storedInv = localStorage.getItem(STORAGE_KEYS.INVOICES);
      this.invoices = storedInv ? JSON.parse(storedInv) : [];

      // Load persistent session token
      const storedSession = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession) as AuthSession;
          const user = this.staff.find(s => s.id === session.userId);
          // Revoke immediately if user is deleted or deactivated
          if (user && user.status === 'ACTIVE') {
            this.currentSession = {
              ...session,
              role: user.role, // Always synchronize role live from DB
              name: user.name,
            };
          } else {
            this.currentSession = null;
            localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
          }
        } catch {
          this.currentSession = null;
          localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        }
      }

      this.ensureBatchQRCodes();
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      this.products = [];
      this.suppliers = [];
      this.supplierBills = [];
      this.farmers = [];
      this.staff = INITIAL_STAFF;
      this.attendance = [];
      this.leaves = [];
      this.invoices = [];
      this.currentSession = null;
    }
  }

  private async ensureBatchQRCodes() {
    let updated = false;
    for (const prod of this.products) {
      for (const batch of prod.batches) {
        if (!batch.qrCodeDataUrl) {
          const payload = createQRPayload(prod, batch);
          batch.qrCodeDataUrl = await generateBatchQRCodeDataUrl(payload);
          updated = true;
        }
      }
    }
    if (updated) {
      this.saveProducts();
    }
  }

  private saveProducts() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
  }

  private saveSuppliers() {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(this.suppliers));
  }

  private saveBills() {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER_BILLS, JSON.stringify(this.supplierBills));
  }

  private saveFarmers() {
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(this.farmers));
  }

  private saveStaff() {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(this.staff));
  }

  private saveAttendance() {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(this.attendance));
  }

  private saveLeaves() {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(this.leaves));
  }

  private saveInvoices() {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
  }

  // --- Authentication & Session Engine ---
  public login(identifier: string, pin: string): { success: boolean; error?: string; user?: StaffMember } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Match by phone, email, username 'HskingBohra5253', or 'admin'
    const found = this.staff.find(s => {
      const matchPhone = s.phone && s.phone.toLowerCase() === cleanId;
      const matchEmail = s.email && s.email.toLowerCase() === cleanId;
      const matchUsername = (cleanId === 'hskingbohra5253' || cleanId === 'admin' || cleanId === 'owner') && s.role === 'ADMIN';
      const matchPhoneNumeric = s.phone && cleanId.length >= 4 && s.phone.replace(/[^0-9]/g, '').includes(cleanId.replace(/[^0-9]/g, ''));
      return matchPhone || matchEmail || matchUsername || matchPhoneNumeric;
    });

    if (!found || found.pin !== cleanPin) {
      return { success: false, error: 'Invalid username or PIN.' };
    }

    if (found.status === 'INACTIVE') {
      return { success: false, error: 'Access Denied: This account is inactive.' };
    }

    // Generate secure persistent session token
    const token = `jwt_agro_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session: AuthSession = {
      token,
      userId: found.id,
      role: found.role,
      name: found.name,
      loginTimestamp: Date.now(),
    };

    found.lastLoginAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    this.currentSession = session;
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    this.saveStaff();

    return { success: true, user: found };
  }

  public logout() {
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  public getSession(): { isAuthenticated: boolean; user: StaffMember | null; role: UserRole } {
    if (!this.currentSession) {
      return { isAuthenticated: false, user: null, role: 'WORKER' };
    }
    const user = this.staff.find(s => s.id === this.currentSession?.userId);
    if (!user || user.status === 'INACTIVE') {
      this.logout();
      return { isAuthenticated: false, user: null, role: 'WORKER' };
    }
    return {
      isAuthenticated: true,
      user,
      role: user.role,
    };
  }

  public getCurrentUser(): { role: UserRole; id: string; name: string } {
    const session = this.getSession();
    if (session.user) {
      return {
        role: session.user.role,
        id: session.user.id,
        name: session.user.name,
      };
    }
    return {
      role: 'WORKER',
      id: 'unauthenticated',
      name: 'Unauthenticated Session',
    };
  }

  public resetAllToSampleData() {
    this.products = [];
    this.suppliers = [];
    this.supplierBills = [];
    this.farmers = [];
    this.staff = INITIAL_STAFF;
    this.attendance = [];
    this.leaves = [];
    this.invoices = [];
    this.saveProducts();
    this.saveSuppliers();
    this.saveBills();
    this.saveFarmers();
    this.saveStaff();
    this.saveAttendance();
    this.saveLeaves();
    this.saveInvoices();
  }

  // --- Staff Account Management (Admin Panel) ---
  public getStaff(): StaffMember[] {
    return [...this.staff];
  }

  public addStaffMember(data: Omit<StaffMember, 'id' | 'joinedDate' | 'metrics'>): StaffMember {
    const newMember: StaffMember = {
      ...data,
      id: `staff-${Date.now().toString().slice(-5)}`,
      joinedDate: new Date().toISOString().split('T')[0],
      metrics: {
        salesCount: 0,
        totalRevenue: 0,
        avgTransactionTimeSeconds: 0,
      }
    };
    this.staff.push(newMember);
    this.saveStaff();
    return newMember;
  }

  public updateStaffCredentials(staffId: string, updates: Partial<Pick<StaffMember, 'name' | 'pin' | 'role' | 'shift' | 'status' | 'phone' | 'email'>>): boolean {
    const member = this.staff.find(s => s.id === staffId);
    if (!member) return false;

    // Disallow deactivating the sole admin
    if (updates.status === 'INACTIVE' && member.role === 'ADMIN') {
      const activeAdmins = this.staff.filter(s => s.role === 'ADMIN' && s.status === 'ACTIVE' && s.id !== staffId);
      if (activeAdmins.length === 0) {
        throw new Error('Cannot deactivate the sole primary Administrator account.');
      }
    }

    Object.assign(member, updates);
    this.saveStaff();

    // If current session user is affected, refresh live role or logout if deactivated
    if (this.currentSession?.userId === staffId) {
      if (member.status === 'INACTIVE') {
        this.logout();
      } else {
        this.currentSession.role = member.role;
        this.currentSession.name = member.name;
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(this.currentSession));
      }
    }

    return true;
  }

  public deleteStaffMember(staffId: string): boolean {
    const member = this.staff.find(s => s.id === staffId);
    if (!member) return false;

    if (member.role === 'ADMIN') {
      const activeAdmins = this.staff.filter(s => s.role === 'ADMIN' && s.id !== staffId);
      if (activeAdmins.length === 0) {
        throw new Error('Cannot delete the sole Administrator account.');
      }
    }

    this.staff = this.staff.filter(s => s.id !== staffId);
    this.saveStaff();

    if (this.currentSession?.userId === staffId) {
      this.logout();
    }
    return true;
  }

  public changeMyPin(userId: string, currentPin: string, newPin: string): { success: boolean; error?: string } {
    const member = this.staff.find(s => s.id === userId);
    if (!member) {
      return { success: false, error: 'Staff member account not found in system.' };
    }
    if (member.status === 'INACTIVE') {
      return { success: false, error: 'Account is deactivated. Please contact store owner.' };
    }
    if (member.pin !== currentPin.trim()) {
      return { success: false, error: 'Incorrect current PIN. Please verify and try again.' };
    }
    const cleanNewPin = newPin.trim();
    if (!/^\d{4}$/.test(cleanNewPin)) {
      return { success: false, error: 'New PIN must be exactly 4 numeric digits (e.g. 5678).' };
    }
    if (cleanNewPin === currentPin.trim()) {
      return { success: false, error: 'New PIN must be different from your current PIN.' };
    }

    member.pin = cleanNewPin;
    this.saveStaff();

    // Refresh persistent session token timestamp
    if (this.currentSession && this.currentSession.userId === userId) {
      this.currentSession.loginTimestamp = Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(this.currentSession));
    }

    return { success: true };
  }

  // --- Inventory & Batches ---
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public getBatchById(batchId: string): { product: Product; batch: Batch } | null {
    for (const prod of this.products) {
      const batch = prod.batches.find(b => b.id === batchId);
      if (batch) return { product: prod, batch };
    }
    return null;
  }

  public async addProduct(productData: Omit<Product, 'id' | 'batches'>): Promise<Product> {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now().toString().slice(-6)}`,
      batches: [],
    };
    this.products.unshift(newProduct);
    this.saveProducts();
    return newProduct;
  }

  public async addBatchToProduct(productId: string, batchData: Omit<Batch, 'id' | 'productId' | 'qrCodeDataUrl' | 'createdAt'>): Promise<Batch> {
    const product = this.products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const newBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now().toString().slice(-6)}`,
      productId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const qrSource = batchData.customBarcode || createQRPayload(product, newBatch);
    newBatch.qrCodeDataUrl = await generateBatchQRCodeDataUrl(qrSource);

    product.batches.unshift(newBatch);
    this.saveProducts();

    if (batchData.supplierId) {
      const sup = this.suppliers.find(s => s.id === batchData.supplierId);
      if (sup) {
        const totalCost = batchData.costPrice * batchData.initialQuantity;
        sup.outstandingBalance += totalCost;
        sup.invoicesCount += 1;
        this.saveSuppliers();

        const newBill: SupplierBill = {
          id: `sbill-${Date.now().toString().slice(-6)}`,
          supplierId: sup.id,
          supplierName: sup.company || sup.name,
          billNumber: batchData.supplierInvoiceNo || `INV-${Date.now().toString().slice(-4)}`,
          billDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + (sup.paymentDueDays || 30) * 86400000).toISOString().split('T')[0],
          totalAmount: totalCost,
          paidAmount: 0,
          balanceAmount: totalCost,
          status: 'UNPAID',
          itemsReceived: [
            {
              productName: product.name,
              batchNumber: batchData.batchNumber,
              quantity: batchData.initialQuantity,
              unitPrice: batchData.costPrice,
            }
          ]
        };
        this.supplierBills.unshift(newBill);
        this.saveBills();
      }
    }

    return newBatch;
  }

  // --- Smart Code Matching Engine with Multi-Format Support ---
  public smartMatchCode(scannedCode: string): ProductMatchResult {
    const detected = analyzeScannedCode(scannedCode);
    const result = matchDetectedCodeWithInventory(detected, this.products);

    // Automatically log scan to persistent history
    logScanToHistory({
      rawCode: scannedCode,
      codeFormat: detected.codeFormat,
      detectedSummary: detected.detectedFields.join(', ') || 'Unclassified code',
      status: result.status,
      matchedProductName: result.matches[0]?.product.name,
      actionTaken: result.status === 'EXACT_MATCH' ? 'ADDED_TO_CART' : undefined,
    });

    return result;
  }

  // --- Find Product or Batch by any external scanned Barcode or QR Code ---
  public findProductOrBatchByCode(scannedCode: string): { product: Product; batch: Batch } | null {
    if (!scannedCode) return null;
    const matchResult = this.smartMatchCode(scannedCode);
    if (matchResult.matches.length > 0) {
      const top = matchResult.matches[0];
      const batch = top.batch || top.product.batches.find(b => b.currentQuantity > 0) || top.product.batches[0];
      if (batch) {
        return { product: top.product, batch };
      }
    }
    return null;
  }

  // --- Prevent Duplicate Code Registration ---
  public checkDuplicateCode(
    code: string, 
    excludeProductId?: string, 
    excludeBatchId?: string
  ): { isDuplicate: boolean; matchedProductName?: string; matchedBatchNo?: string } {
    if (!code || !code.trim()) return { isDuplicate: false };
    const clean = code.trim().toLowerCase();

    for (const p of this.products) {
      if (excludeProductId && p.id === excludeProductId) continue;
      if (
        (p.originalBarcode && p.originalBarcode.toLowerCase() === clean) ||
        (p.originalQrCode && p.originalQrCode.toLowerCase() === clean) ||
        (p.customBarcode && p.customBarcode.toLowerCase() === clean)
      ) {
        return { isDuplicate: true, matchedProductName: `${p.name} (${p.brand})` };
      }
      for (const b of p.batches) {
        if (excludeBatchId && b.id === excludeBatchId) continue;
        if (
          (b.originalBarcode && b.originalBarcode.toLowerCase() === clean) ||
          (b.originalQrCode && b.originalQrCode.toLowerCase() === clean) ||
          (b.customBarcode && b.customBarcode.toLowerCase() === clean)
        ) {
          return { 
            isDuplicate: true, 
            matchedProductName: `${p.name} (${p.brand})`, 
            matchedBatchNo: b.batchNumber 
          };
        }
      }
    }
    return { isDuplicate: false };
  }

  // --- Link Manufacturer Codes (Barcode or QR) to a Product or Batch ---
  public linkCodeToProduct(
    productId: string, 
    options: { barcode?: string; qrCode?: string; batchId?: string }
  ): boolean {
    const product = this.products.find(p => p.id === productId);
    if (!product) return false;

    if (options.barcode !== undefined) {
      const cleanBar = options.barcode.trim();
      product.originalBarcode = cleanBar || undefined;
      product.customBarcode = cleanBar || product.customBarcode;
    }
    if (options.qrCode !== undefined) {
      const cleanQr = options.qrCode.trim();
      product.originalQrCode = cleanQr || undefined;
      if (!product.customBarcode) {
        product.customBarcode = cleanQr || undefined;
      }
    }

    if (options.batchId) {
      const batch = product.batches.find(b => b.id === options.batchId);
      if (batch) {
        if (options.barcode !== undefined) {
          const cleanBar = options.barcode.trim();
          batch.originalBarcode = cleanBar || undefined;
          batch.customBarcode = cleanBar || batch.customBarcode;
        }
        if (options.qrCode !== undefined) {
          const cleanQr = options.qrCode.trim();
          batch.originalQrCode = cleanQr || undefined;
          if (!batch.customBarcode) {
            batch.customBarcode = cleanQr || undefined;
          }
        }
      }
    } else if (product.batches.length > 0) {
      // Default apply to primary batch
      const b0 = product.batches[0];
      if (options.barcode !== undefined) {
        b0.originalBarcode = options.barcode.trim() || undefined;
        b0.customBarcode = options.barcode.trim() || b0.customBarcode;
      }
      if (options.qrCode !== undefined) {
        b0.originalQrCode = options.qrCode.trim() || undefined;
        if (!b0.customBarcode) {
          b0.customBarcode = options.qrCode.trim() || undefined;
        }
      }
    }

    this.saveProducts();
    return true;
  }

  // Compatibility wrapper
  public linkBarcodeToProduct(productId: string, barcode: string, batchId?: string): boolean {
    return this.linkCodeToProduct(productId, { barcode, batchId });
  }

  // --- Simplified Quick Product Adding ---
  // Mandatory: Name, Company, Retail Price, Quantity (numeric count)
  // QR & Barcode = Completely Optional (never mandatory)
  // Supports separate originalBarcode and originalQrCode
  public async quickAddProduct(data: {
    name: string;
    company: string;
    retailPrice: number;
    quantity: number;
    customBarcode?: string;
    originalBarcode?: string;
    originalQrCode?: string;
    batchNumber?: string;
    costPrice?: number;
    type?: ProductType;
    minStockThreshold?: number;
    expiryDate?: string;
    activeIngredient?: string;
  }): Promise<{ product: Product; batch: Batch }> {
    const cleanName = data.name.trim();
    const cleanCompany = data.company.trim();
    const cleanBarcode = data.originalBarcode?.trim() || data.customBarcode?.trim() || undefined;
    const cleanQr = data.originalQrCode?.trim() || undefined;
    const primaryCode = cleanBarcode || cleanQr || undefined;

    const qty = Math.max(1, Math.round(data.quantity || 1));
    const retail = Math.max(0, Number(data.retailPrice) || 0);
    const cost = data.costPrice !== undefined ? Number(data.costPrice) : Math.round(retail * 0.8);
    const minThreshold = data.minStockThreshold !== undefined ? Number(data.minStockThreshold) : 5;
    const prodType = data.type || 'INSECTICIDE';
    
    // User-entered batch number or fallback
    const userBatchNo = data.batchNumber?.trim() || `BATCH-${Date.now().toString().slice(-4)}`;

    // Do not assume or invent synthetic expiry date
    const productExpiry = data.expiryDate?.trim() || '';
    const today = new Date().toISOString().split('T')[0];

    // Check if product with same name and brand already exists
    let existingProd = this.products.find(
      p => p.name.toLowerCase() === cleanName.toLowerCase() && p.brand.toLowerCase() === cleanCompany.toLowerCase()
    );

    if (existingProd) {
      if (cleanBarcode) existingProd.originalBarcode = cleanBarcode;
      if (cleanQr) existingProd.originalQrCode = cleanQr;
      if (primaryCode && !existingProd.customBarcode) existingProd.customBarcode = primaryCode;

      const newBatch: Batch = {
        id: `batch-${Date.now().toString().slice(-6)}`,
        productId: existingProd.id,
        batchNumber: userBatchNo,
        customBarcode: primaryCode,
        originalBarcode: cleanBarcode,
        originalQrCode: cleanQr,
        manufacturingDate: today,
        expiryDate: productExpiry,
        initialQuantity: qty,
        currentQuantity: qty,
        unit: 'UNITS',
        costPrice: cost,
        retailPrice: retail,
        supplierId: 'sup-direct',
        supplierInvoiceNo: `INV-${Date.now().toString().slice(-4)}`,
        createdAt: today,
      };

      const qrSource = cleanQr || cleanBarcode || createQRPayload(existingProd, newBatch);
      newBatch.qrCodeDataUrl = await generateBatchQRCodeDataUrl(qrSource);

      existingProd.batches.unshift(newBatch);
      this.saveProducts();
      return { product: existingProd, batch: newBatch };
    }

    // Create new product with clean defaults
    const newProduct: Product = {
      id: `prod-${Date.now().toString().slice(-6)}`,
      name: cleanName,
      brand: cleanCompany,
      type: prodType,
      customBarcode: primaryCode,
      originalBarcode: cleanBarcode,
      originalQrCode: cleanQr,
      activeIngredient: data.activeIngredient?.trim() || `${cleanName} active formulation`,
      toxicityClass: 'YELLOW',
      governmentLicenseNo: 'REG-RETAIL-01',
      minStockThreshold: minThreshold,
      gstRate: 18,
      hsnCode: '38089190',
      description: `Stock item: ${cleanName} by ${cleanCompany}`,
      batches: [],
    };

    const newBatch: Batch = {
      id: `batch-${Date.now().toString().slice(-6)}`,
      productId: newProduct.id,
      batchNumber: userBatchNo,
      customBarcode: primaryCode,
      originalBarcode: cleanBarcode,
      originalQrCode: cleanQr,
      manufacturingDate: today,
      expiryDate: productExpiry,
      initialQuantity: qty,
      currentQuantity: qty,
      unit: 'UNITS',
      costPrice: cost,
      retailPrice: retail,
      supplierId: 'sup-direct',
      supplierInvoiceNo: `INV-${Date.now().toString().slice(-4)}`,
      createdAt: today,
    };

    const qrSource = cleanQr || cleanBarcode || createQRPayload(newProduct, newBatch);
    newBatch.qrCodeDataUrl = await generateBatchQRCodeDataUrl(qrSource);

    newProduct.batches.push(newBatch);
    this.products.unshift(newProduct);
    this.saveProducts();

    return { product: newProduct, batch: newBatch };
  }

  // --- Quick Adjust Stock (+ or -) ---
  public quickAdjustStock(
    productId: string, 
    batchId: string | undefined, 
    deltaQuantity: number, 
    reason?: string
  ): { success: boolean; newQuantity: number; productName: string } {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    let targetBatch = batchId ? product.batches.find(b => b.id === batchId) : product.batches[0];

    // If product has no batches and delta > 0, create a default batch
    if (!targetBatch) {
      if (deltaQuantity <= 0) {
        throw new Error('Cannot subtract stock from product with 0 units.');
      }
      const today = new Date().toISOString().split('T')[0];
      const futureExpiry = new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0];
      targetBatch = {
        id: `batch-${Date.now().toString().slice(-6)}`,
        productId: product.id,
        batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
        customBarcode: product.customBarcode,
        manufacturingDate: today,
        expiryDate: futureExpiry,
        initialQuantity: deltaQuantity,
        currentQuantity: deltaQuantity,
        unit: 'UNITS',
        costPrice: 0,
        retailPrice: 100,
        supplierId: 'sup-direct',
        supplierInvoiceNo: 'ADJUST',
        createdAt: today,
      };
      product.batches.push(targetBatch);
      this.saveProducts();
      return { success: true, newQuantity: deltaQuantity, productName: product.name };
    }

    if (targetBatch.currentQuantity + deltaQuantity < 0) {
      throw new Error(`Cannot deduct ${Math.abs(deltaQuantity)} units. Only ${targetBatch.currentQuantity} units available in stock.`);
    }

    targetBatch.currentQuantity += deltaQuantity;
    if (deltaQuantity > 0) {
      targetBatch.initialQuantity = Math.max(targetBatch.initialQuantity, targetBatch.currentQuantity);
    }

    this.saveProducts();

    const totalProductStock = product.batches.reduce((sum, b) => sum + b.currentQuantity, 0);
    return { success: true, newQuantity: totalProductStock, productName: product.name };
  }

  // --- Low Stock Tracker ---
  public getLowStockProducts(): { 
    product: Product; 
    totalStock: number; 
    minThreshold: number; 
    isOutOfStock: boolean; 
    isLowStock: boolean;
  }[] {
    const list: { 
      product: Product; 
      totalStock: number; 
      minThreshold: number; 
      isOutOfStock: boolean; 
      isLowStock: boolean;
    }[] = [];

    for (const prod of this.products) {
      const totalStock = prod.batches.reduce((sum, b) => sum + b.currentQuantity, 0);
      const isOutOfStock = totalStock === 0;
      const isLowStock = totalStock > 0 && totalStock <= prod.minStockThreshold;

      if (isOutOfStock || isLowStock) {
        list.push({
          product: prod,
          totalStock,
          minThreshold: prod.minStockThreshold,
          isOutOfStock,
          isLowStock,
        });
      }
    }

    return list.sort((a, b) => a.totalStock - b.totalStock);
  }

  public updateBatchStock(batchId: string, deltaQuantity: number): boolean {
    for (const prod of this.products) {
      const batch = prod.batches.find(b => b.id === batchId);
      if (batch) {
        if (batch.currentQuantity + deltaQuantity < 0) {
          throw new Error(`Insufficient stock in Batch ${batch.batchNumber}. Available: ${batch.currentQuantity}`);
        }
        batch.currentQuantity += deltaQuantity;
        this.saveProducts();
        return true;
      }
    }
    return false;
  }

  // --- POS Billing & Automated Deduction Transaction ---
  public processSale(payload: {
    items: CartItem[];
    customerName: string;
    customerPhone: string;
    customerVillage?: string;
    farmerId?: string;
    paymentMethod: PaymentMethod;
    discount?: number;
    notes?: string;
  }): { invoice: Invoice; success: boolean } {
    const { items, customerName, customerPhone, customerVillage, farmerId, paymentMethod, discount = 0, notes } = payload;
    
    if (!items || items.length === 0) {
      throw new Error('Cannot process an empty cart.');
    }

    for (const item of items) {
      const found = this.getBatchById(item.batch.id);
      if (!found) {
        throw new Error(`Batch ID ${item.batch.id} (${item.batch.batchNumber}) not found in live inventory.`);
      }
      if (found.batch.currentQuantity < item.quantity) {
        throw new Error(`Out of stock error: Batch ${item.batch.batchNumber} has only ${found.batch.currentQuantity} units available.`);
      }
    }

    for (const item of items) {
      this.updateBatchStock(item.batch.id, -item.quantity);
    }

    let subtotal = 0;
    let taxTotal = 0;

    const invoiceItems = items.map(i => {
      const lineTax = (i.unitPrice * i.quantity * i.gstRate) / (100 + i.gstRate);
      const lineSubtotal = (i.unitPrice * i.quantity) - lineTax;
      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        productId: i.product.id,
        productName: i.product.name,
        batchId: i.batch.id,
        batchNumber: i.batch.batchNumber,
        activeIngredient: i.product.activeIngredient,
        expiryDate: i.batch.expiryDate,
        quantity: i.quantity,
        unit: i.batch.unit,
        unitPrice: i.unitPrice,
        gstRate: i.gstRate,
        taxAmount: Number(lineTax.toFixed(2)),
        total: Number((i.unitPrice * i.quantity).toFixed(2)),
      };
    });

    const grandTotal = Math.max(0, Number((subtotal + taxTotal - discount).toFixed(2)));
    const amountPaid = paymentMethod === 'KHATA_CREDIT' ? 0 : grandTotal;
    const creditDue = paymentMethod === 'KHATA_CREDIT' ? grandTotal : 0;

    const currentUser = this.getCurrentUser();
    const invoiceNumber = `AGRO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerName: customerName?.trim() || '',
      customerPhone: customerPhone?.trim() || '',
      customerVillage: customerVillage?.trim() || '',
      farmerId,
      items: invoiceItems,
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discount,
      grandTotal,
      paymentMethod,
      amountPaid,
      creditDue,
      notes,
    };

    this.invoices.unshift(newInvoice);
    this.saveInvoices();

    if (paymentMethod === 'KHATA_CREDIT' && farmerId) {
      const farmer = this.farmers.find(f => f.id === farmerId);
      if (farmer) {
        farmer.outstandingDebt += creditDue;
        farmer.totalPurchases += grandTotal;
        if (farmer.outstandingDebt >= farmer.creditLimit) {
          farmer.status = 'WARNING';
        }
        farmer.transactions.unshift({
          id: `tx-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'PURCHASE_CREDIT',
          amount: creditDue,
          balanceAfter: farmer.outstandingDebt,
          invoiceNumber,
          note: `Credit purchase of ${items.length} items on Invoice #${invoiceNumber}`,
        });
        this.saveFarmers();
      }
    }

    const staffMember = this.staff.find(s => s.id === currentUser.id);
    if (staffMember) {
      staffMember.metrics.salesCount += 1;
      staffMember.metrics.totalRevenue += grandTotal;
      this.saveStaff();
    }

    return { invoice: newInvoice, success: true };
  }

  // --- Invoices ---
  public getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  // --- Suppliers & Purchase Orders ---
  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public addSupplier(supplierData: Omit<Supplier, 'id' | 'outstandingBalance' | 'invoicesCount'>): Supplier {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now().toString().slice(-5)}`,
      outstandingBalance: 0,
      invoicesCount: 0,
    };
    this.suppliers.unshift(newSupplier);
    this.saveSuppliers();
    return newSupplier;
  }

  public getSupplierBills(): SupplierBill[] {
    return [...this.supplierBills];
  }

  public recordSupplierPayment(billId: string, amount: number): boolean {
    const bill = this.supplierBills.find(b => b.id === billId);
    if (!bill) return false;

    bill.paidAmount += amount;
    bill.balanceAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
    if (bill.balanceAmount <= 0) {
      bill.status = 'PAID';
    } else {
      bill.status = 'PARTIAL';
    }
    this.saveBills();

    const sup = this.suppliers.find(s => s.id === bill.supplierId);
    if (sup) {
      sup.outstandingBalance = Math.max(0, sup.outstandingBalance - amount);
      sup.lastPaymentDate = new Date().toISOString().split('T')[0];
      this.saveSuppliers();
    }
    return true;
  }

  // --- Farmer Khata (Credit Register) ---
  public getFarmers(): FarmerCustomer[] {
    return [...this.farmers];
  }

  public recordFarmerPayment(farmerId: string, amount: number, note: string = 'Payment received in cash/UPI'): boolean {
    const farmer = this.farmers.find(f => f.id === farmerId);
    if (!farmer) return false;

    farmer.outstandingDebt = Math.max(0, farmer.outstandingDebt - amount);
    if (farmer.outstandingDebt === 0) {
      farmer.status = 'CLEAR';
    } else if (farmer.outstandingDebt < farmer.creditLimit) {
      farmer.status = 'CURRENT';
    }

    farmer.transactions.unshift({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'PAYMENT_RECEIVED',
      amount,
      balanceAfter: farmer.outstandingDebt,
      note,
    });
    this.saveFarmers();
    return true;
  }

  public addFarmer(farmerData: Omit<FarmerCustomer, 'id' | 'totalPurchases' | 'outstandingDebt' | 'transactions'>): FarmerCustomer {
    const newFarmer: FarmerCustomer = {
      ...farmerData,
      id: `far-${Date.now().toString().slice(-5)}`,
      totalPurchases: 0,
      outstandingDebt: 0,
      transactions: [],
    };
    this.farmers.unshift(newFarmer);
    this.saveFarmers();
    return newFarmer;
  }

  public getAttendance(): AttendanceRecord[] {
    return [...this.attendance];
  }

  public getLeaves(): LeaveRequest[] {
    return [...this.leaves];
  }

  public clockInOut(staffId: string, status: AttendanceRecord['status'] = 'PRESENT', notes: string = ''): AttendanceRecord {
    const today = new Date().toISOString().split('T')[0];
    const member = this.staff.find(s => s.id === staffId);
    const existing = this.attendance.find(a => a.staffId === staffId && a.date === today);

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (existing) {
      existing.clockOutTime = timeStr;
      if (notes) existing.notes = (existing.notes ? `${existing.notes} | ` : '') + notes;
      this.saveAttendance();
      return existing;
    } else {
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        staffId,
        staffName: member ? member.name : 'Staff Member',
        date: today,
        clockInTime: timeStr,
        status,
        notes,
      };
      this.attendance.unshift(record);
      this.saveAttendance();
      return record;
    }
  }

  public submitLeaveRequest(data: { staffId: string; startDate: string; endDate: string; reason: string }): LeaveRequest {
    const member = this.staff.find(s => s.id === data.staffId);
    const leave: LeaveRequest = {
      id: `lev-${Date.now()}`,
      staffId: data.staffId,
      staffName: member ? member.name : 'Staff',
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'PENDING',
      appliedAt: new Date().toISOString().split('T')[0],
    };
    this.leaves.unshift(leave);
    this.saveLeaves();
    return leave;
  }

  public updateLeaveStatus(leaveId: string, status: 'APPROVED' | 'REJECTED'): boolean {
    const leave = this.leaves.find(l => l.id === leaveId);
    if (!leave) return false;
    leave.status = status;
    this.saveLeaves();
    return true;
  }

  // --- Business Shop Settings (Name, Address, Actual Contact Phone) ---
  public getShopSettings(): ShopSettings {
    return { ...this.shopSettings };
  }

  public updateShopSettings(settings: Partial<ShopSettings>): ShopSettings {
    this.shopSettings = {
      ...this.shopSettings,
      ...settings,
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(this.shopSettings));
    } catch (e) {
      console.warn('Failed to save shop settings:', e);
    }
    return { ...this.shopSettings };
  }
}

export const store = new StoreService();
