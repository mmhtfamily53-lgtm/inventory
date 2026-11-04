/**
 * Intelligent QR Code & Barcode Intelligence Engine for Pesticide Inventory
 * 
 * Supports:
 * - GS1 DataMatrix & GS1-128 (Application Identifiers: (01) GTIN, (10) Batch, (17) Expiry, (11) Mfg, (21) Serial)
 * - Standard 1D product barcodes (EAN-13, EAN-8, UPC-A, Code-128, Code-39)
 * - Manufacturer Track & Trace URLs (Bayer, Syngenta, FMC, UPL, etc.) safely without auto-navigation
 * - Key-Value & custom label formats (B.No, Batch, Lot, Exp, Mfg, MRP)
 * - Transparent detection breakdown (detected fields vs unidentified fields)
 * - Smart multi-candidate inventory matching (never assumes company name alone identifies a product)
 * - Scan history logging & issue reporting
 */

import { 
  DetectedCodeInfo, 
  ProductMatchResult, 
  ProductMatchCandidate,
  Product, 
  Batch, 
  ScanHistoryEntry, 
  ReportedScanIssue,
  ScannedCodeFormat 
} from '../types';

// Known Pesticide Manufacturers
const KNOWN_MANUFACTURERS: { name: string; aliases: string[]; domainMatches: string[] }[] = [
  { name: 'Bayer CropScience', aliases: ['Bayer', 'Bayer India', 'Bayer Crop Science'], domainMatches: ['bayer.com', 'bayer.in', 'verify.bayer'] },
  { name: 'Syngenta India', aliases: ['Syngenta', 'Syngenta Crop Protection'], domainMatches: ['syngenta.com', 'syngenta.co.in'] },
  { name: 'FMC Corporation', aliases: ['FMC', 'FMC India', 'Cheminova'], domainMatches: ['fmc.com', 'fmc.in'] },
  { name: 'UPL Limited', aliases: ['UPL', 'United Phosphorus', 'Advanta'], domainMatches: ['upl-ltd.com', 'uplonline.com'] },
  { name: 'Corteva Agriscience', aliases: ['Corteva', 'Dow AgroSciences', 'DuPont'], domainMatches: ['corteva.com', 'corteva.in'] },
  { name: 'Tata Rallis India', aliases: ['Rallis', 'Tata Rallis', 'Tata Chemicals'], domainMatches: ['rallis.com', 'rallis.co.in'] },
  { name: 'Dhanuka Agritech', aliases: ['Dhanuka'], domainMatches: ['dhanuka.com'] },
  { name: 'BASF India', aliases: ['BASF', 'BASF Agricultural'], domainMatches: ['basf.com', 'basf.in'] },
  { name: 'PI Industries', aliases: ['PI Industries', 'PI'], domainMatches: ['piindustries.com'] },
  { name: 'Coromandel International', aliases: ['Coromandel', 'Gromor'], domainMatches: ['coromandel.biz'] },
  { name: 'Indofil Industries', aliases: ['Indofil'], domainMatches: ['indofilcc.com'] },
  { name: 'Sumitomo Chemical', aliases: ['Sumitomo', 'Sumitomo India'], domainMatches: ['sumichem.co.in'] },
  { name: 'Crystal Crop Protection', aliases: ['Crystal Crop', 'Crystal'], domainMatches: ['crystalcropprotection.com'] },
  { name: 'Mahyco Seeds', aliases: ['Mahyco', 'Maharashtra Hybrid Seeds'], domainMatches: ['mahyco.com'] }
];

// Common Indian Trade Names to Active Ingredients
const KNOWN_TRADE_PRODUCTS: { name: string; company: string; activeIngredient: string }[] = [
  { name: 'Coragen', company: 'FMC Corporation', activeIngredient: 'Chlorantraniliprole 18.5% SC' },
  { name: 'Confidor', company: 'Bayer CropScience', activeIngredient: 'Imidacloprid 17.8% SL' },
  { name: 'Admire', company: 'Bayer CropScience', activeIngredient: 'Imidacloprid 70% WG' },
  { name: 'Amistar Top', company: 'Syngenta India', activeIngredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC' },
  { name: 'Saaf', company: 'UPL Limited', activeIngredient: 'Carbendazim 12% + Mancozeb 63% WP' },
  { name: 'Furadan', company: 'FMC Corporation', activeIngredient: 'Carbofuran 3% CG' },
  { name: 'Karate', company: 'Syngenta India', activeIngredient: 'Lambda-cyhalothrin 5% EC' },
  { name: 'Ridomil Gold', company: 'Syngenta India', activeIngredient: 'Metalaxyl-M 4% + Mancozeb 64% WP' },
  { name: 'Roundup', company: 'Bayer CropScience', activeIngredient: 'Glyphosate 41% SL' },
  { name: 'Regent', company: 'Bayer CropScience', activeIngredient: 'Fipronil 5% SC' },
  { name: 'Tafgor', company: 'Tata Rallis India', activeIngredient: 'Dimethoate 30% EC' },
  { name: 'Tata Mida', company: 'Tata Rallis India', activeIngredient: 'Imidacloprid 17.8% SL' },
  { name: 'Pegasus', company: 'Syngenta India', activeIngredient: 'Diafenthiuron 50% WP' },
  { name: 'Dithane M-45', company: 'Indofil Industries', activeIngredient: 'Mancozeb 75% WP' },
  { name: 'Bavistin', company: 'Crystal Crop Protection', activeIngredient: 'Carbendazim 50% WP' },
  { name: 'Urea 45kg', company: 'Coromandel International', activeIngredient: 'Nitrogen 46%' },
  { name: 'DAP 50kg', company: 'Coromandel International', activeIngredient: 'Di-Ammonium Phosphate 18:46:0' }
];

const SCAN_HISTORY_STORAGE_KEY = 'agropulse_scan_history_v1';
const REPORTED_ISSUES_STORAGE_KEY = 'agropulse_reported_scans_v1';

/**
 * Parses YYMMDD GS1 date string to ISO YYYY-MM-DD
 */
function parseGS1Date(yymmdd: string): string | undefined {
  if (!yymmdd || yymmdd.length !== 6) return undefined;
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  // Agrochemicals are manufactured in 2000s
  const yyyy = 2000 + yy;
  const day = dd === '00' ? '28' : dd; // 00 in GS1 means end of month
  return `${yyyy}-${mm}-${day}`;
}

/**
 * Intelligent Code Parser & Detector
 * Inspects any raw scanned code (1D barcode or 2D QR/DataMatrix) and extracts available fields.
 */
export function analyzeScannedCode(rawString: string): DetectedCodeInfo {
  const clean = (rawString || '').trim();
  const detectedFields: string[] = [];
  const unidentifiedFields: string[] = [];

  const result: DetectedCodeInfo = {
    rawCode: clean,
    codeFormat: 'ALPHANUMERIC_TEXT',
    confidence: 'LOW',
    detectedFields: [],
    unidentifiedFields: [],
    rawFormatDescription: 'Plain Text Code',
    isUrl: false,
    isUrlSafeToDisplay: true,
  };

  if (!clean) {
    result.unidentifiedFields = ['Product Name', 'Company Name', 'Batch Number', 'Expiry Date', 'Barcode'];
    return result;
  }

  // --- 1. Check for Internal JSON format ---
  try {
    const json = JSON.parse(clean);
    if (json && typeof json === 'object') {
      result.codeFormat = 'INTERNAL_JSON';
      result.confidence = 'HIGH';
      result.rawFormatDescription = 'AgroPulse Secure Internal JSON Payload';

      if (json.pName) {
        result.productName = json.pName;
        detectedFields.push('Product Name');
      }
      if (json.bNo) {
        result.batchNumber = json.bNo;
        detectedFields.push('Batch Number');
      }
      if (json.exp) {
        result.expiryDate = json.exp;
        detectedFields.push('Expiry Date');
      }
      if (json.mrp) {
        result.retailPrice = Number(json.mrp);
        detectedFields.push('Selling Price / MRP');
      }
      if (json.ai) {
        result.activeIngredient = json.ai;
        detectedFields.push('Active Chemical Ingredient');
      }
      if (json.pId) {
        result.productIdOrGtin = json.pId;
        detectedFields.push('Product ID');
      }

      finalizeBreakdown(result, detectedFields);
      return result;
    }
  } catch {
    // Not JSON, continue
  }

  // --- 2. Check for GS1 DataMatrix / GS1-128 Format ---
  // Matches (01) GTIN, (10) Batch, (17) Expiry YYMMDD, (11) Mfg YYMMDD, (21) Serial
  const hasGS1Parens = clean.includes('(01)') || clean.includes('(10)') || clean.includes('(17)');
  const gs1GtinMatch = clean.match(/\(01\)(\d{14})/);
  const gs1BatchMatch = clean.match(/\(10\)([A-Za-z0-9\-_]+)(?=\(\d{2}\)|$)/);
  const gs1ExpMatch = clean.match(/\(17\)(\d{6})/);
  const gs1MfgMatch = clean.match(/\(11\)(\d{6})/);
  const gs1SerialMatch = clean.match(/\(21\)([A-Za-z0-9\-_]+)(?=\(\d{2}\)|$)/);

  if (hasGS1Parens || gs1GtinMatch || gs1BatchMatch || gs1ExpMatch) {
    result.codeFormat = 'GS1_DATAMATRIX';
    result.confidence = 'HIGH';
    result.rawFormatDescription = 'GS1 Agrochemical DataMatrix Standard';

    if (gs1GtinMatch) {
      result.productIdOrGtin = gs1GtinMatch[1];
      result.barcodeNumber = gs1GtinMatch[1];
      detectedFields.push('GS1 GTIN / Barcode');
    }
    if (gs1BatchMatch) {
      result.batchNumber = gs1BatchMatch[1];
      detectedFields.push('Batch Number');
    }
    if (gs1ExpMatch) {
      const expIso = parseGS1Date(gs1ExpMatch[1]);
      if (expIso) {
        result.expiryDate = expIso;
        detectedFields.push('Expiry Date');
      }
    }
    if (gs1MfgMatch) {
      const mfgIso = parseGS1Date(gs1MfgMatch[1]);
      if (mfgIso) {
        result.manufacturingDate = mfgIso;
        detectedFields.push('Manufacturing Date');
      }
    }
    if (gs1SerialMatch) {
      result.serialNumber = gs1SerialMatch[1];
      detectedFields.push('Serial Number');
    }

    // Try finding company or product name from raw text
    detectBrandAndProductFromText(clean, result, detectedFields);

    finalizeBreakdown(result, detectedFields);
    return result;
  }

  // --- 3. Check for Website URL / Manufacturer Verification Portal ---
  if (/^https?:\/\//i.test(clean)) {
    result.codeFormat = 'MANUFACTURER_URL';
    result.isUrl = true;
    result.websiteUrl = clean;
    result.rawFormatDescription = 'Manufacturer Verification QR URL';
    detectedFields.push('Verification Portal URL');

    try {
      const urlObj = new URL(clean);
      const hostname = urlObj.hostname.toLowerCase();

      // Identify manufacturer from domain
      for (const m of KNOWN_MANUFACTURERS) {
        if (m.domainMatches.some(d => hostname.includes(d))) {
          result.brandOrCompany = m.name;
          detectedFields.push('Manufacturer Name');
          break;
        }
      }

      // Extract parameters from URL query string
      const searchParams = urlObj.searchParams;
      const paramBatch = searchParams.get('batch') || searchParams.get('bno') || searchParams.get('lot') || searchParams.get('b');
      const paramProduct = searchParams.get('product') || searchParams.get('p') || searchParams.get('prod');
      const paramExp = searchParams.get('exp') || searchParams.get('expiry');
      const paramMfg = searchParams.get('mfg');
      const paramGtin = searchParams.get('gtin') || searchParams.get('id') || searchParams.get('code');
      const paramSerial = searchParams.get('serial') || searchParams.get('sn') || searchParams.get('s');
      const paramMrp = searchParams.get('mrp') || searchParams.get('price');

      if (paramBatch) {
        result.batchNumber = paramBatch;
        detectedFields.push('Batch Number');
      }
      if (paramProduct) {
        result.productName = decodeURIComponent(paramProduct);
        detectedFields.push('Product Name');
      }
      if (paramExp) {
        result.expiryDate = normalizeDate(paramExp);
        detectedFields.push('Expiry Date');
      }
      if (paramMfg) {
        result.manufacturingDate = normalizeDate(paramMfg);
        detectedFields.push('Manufacturing Date');
      }
      if (paramGtin) {
        result.productIdOrGtin = paramGtin;
        detectedFields.push('Product ID / Code');
      }
      if (paramSerial) {
        result.serialNumber = paramSerial;
        detectedFields.push('Serial Number');
      }
      if (paramMrp && !isNaN(Number(paramMrp))) {
        result.retailPrice = Number(paramMrp);
        detectedFields.push('Selling Price / MRP');
      }

      result.confidence = detectedFields.length >= 3 ? 'HIGH' : 'MEDIUM';

      // Match trade name if product name still not set
      if (!result.productName) {
        detectBrandAndProductFromText(clean, result, detectedFields);
      }

    } catch {
      // Invalid URL syntax
    }

    finalizeBreakdown(result, detectedFields);
    return result;
  }

  // --- 4. Check for Standard 1D Barcode Formats ---
  // EAN-13 (13 digits), EAN-8 (8 digits), UPC-A (12 digits), or pure numeric/alphanumeric barcode string
  const isNumericOnly = /^\d+$/.test(clean);
  if (isNumericOnly && (clean.length === 13 || clean.length === 12 || clean.length === 8)) {
    result.codeFormat = 'BARCODE_1D';
    result.barcodeNumber = clean;
    result.productIdOrGtin = clean;
    detectedFields.push('Barcode Number');
    result.rawFormatDescription = clean.length === 13 
      ? 'EAN-13 Product Barcode' 
      : clean.length === 12 
      ? 'UPC-A Product Barcode' 
      : 'EAN-8 Product Barcode';
    result.confidence = 'HIGH';

    // Important agrochemical insight: standard 1D barcodes on bottles identify product/SKU only!
    // They do NOT contain batch number or expiry date.
    finalizeBreakdown(result, detectedFields);
    return result;
  }

  // --- 5. Custom Key-Value or Delimited Alphanumeric Code ---
  // E.g. "FMC:FURADAN:BATCH-771:EXP-2026-11:MRP-850" or "B.No: CRG102 / Mfg: 2024 / Exp: 2026"
  if (clean.includes(':') || clean.includes('/') || clean.includes(';') || clean.includes('|')) {
    result.codeFormat = 'ALPHANUMERIC_TEXT';
    result.rawFormatDescription = 'Custom Formatted Manufacturer Code';

    // Regex matchers for common labeled fields
    const batchRegex = /(?:BATCH|B\.?NO|LOT|BATCHNO)[:\s=-]+([A-Za-z0-9\-_]+)/i;
    const expRegex = /(?:EXP|EXPIRY|EXP\.?DATE)[:\s=-]+([0-9\-\/.]+)/i;
    const mfgRegex = /(?:MFG|MFD|MFG\.?DATE)[:\s=-]+([0-9\-\/.]+)/i;
    const mrpRegex = /(?:MRP|PRICE|RS)[:\s=-]+([0-9.]+)/i;
    const gtinRegex = /(?:GTIN|SKU|BARCODE|ID)[:\s=-]+([A-Za-z0-9]+)/i;

    const bMatch = clean.match(batchRegex);
    if (bMatch) {
      result.batchNumber = bMatch[1];
      detectedFields.push('Batch Number');
    }

    const expMatch = clean.match(expRegex);
    if (expMatch) {
      result.expiryDate = normalizeDate(expMatch[1]);
      detectedFields.push('Expiry Date');
    }

    const mfgMatch = clean.match(mfgRegex);
    if (mfgMatch) {
      result.manufacturingDate = normalizeDate(mfgMatch[1]);
      detectedFields.push('Manufacturing Date');
    }

    const mrpMatch = clean.match(mrpRegex);
    if (mrpMatch && !isNaN(Number(mrpMatch[1]))) {
      result.retailPrice = Number(mrpMatch[1]);
      detectedFields.push('Selling Price / MRP');
    }

    const gtinMatch = clean.match(gtinRegex);
    if (gtinMatch) {
      result.productIdOrGtin = gtinMatch[1];
      detectedFields.push('Product ID / GTIN');
    }

    // Try colon-separated parts if no explicit labels were matched
    if (detectedFields.length === 0 && clean.includes(':')) {
      const parts = clean.split(':').map(p => p.trim());
      if (parts.length >= 2) {
        // Try matching first part with company
        const comp = findManufacturerMatch(parts[0]);
        if (comp) {
          result.brandOrCompany = comp;
          detectedFields.push('Company Name');
        }
        if (parts[1]) {
          result.productName = parts[1];
          detectedFields.push('Product Name');
        }
        if (parts[2]) {
          result.batchNumber = parts[2];
          detectedFields.push('Batch Number');
        }
      }
    }

    detectBrandAndProductFromText(clean, result, detectedFields);
    result.confidence = detectedFields.length >= 2 ? 'MEDIUM' : 'LOW';
    finalizeBreakdown(result, detectedFields);
    return result;
  }

  // --- 6. Plain String / Fallback ---
  // Could be a raw batch number, serial code, or product name
  result.codeFormat = clean.length > 20 ? 'QR_CODE' : 'ALPHANUMERIC_TEXT';
  result.rawFormatDescription = 'Raw Identification Code';

  // Check if string itself is a known trade product or company
  detectBrandAndProductFromText(clean, result, detectedFields);

  // If no fields found, treat the clean string as candidate batch or barcode
  if (detectedFields.length === 0) {
    if (/^[A-Za-z0-9\-_]{3,20}$/.test(clean)) {
      result.batchNumber = clean;
      result.barcodeNumber = clean;
      detectedFields.push('Raw Code / Candidate Batch');
    }
  }

  finalizeBreakdown(result, detectedFields);
  return result;
}

/**
 * Searches text for known pesticide brands and product trade names
 */
function detectBrandAndProductFromText(text: string, result: DetectedCodeInfo, detectedFields: string[]) {
  const lower = text.toLowerCase();

  // 1. Manufacturer
  if (!result.brandOrCompany) {
    for (const m of KNOWN_MANUFACTURERS) {
      if (lower.includes(m.name.toLowerCase()) || m.aliases.some(a => lower.includes(a.toLowerCase()))) {
        result.brandOrCompany = m.name;
        if (!detectedFields.includes('Company Name')) detectedFields.push('Company Name');
        break;
      }
    }
  }

  // 2. Product Trade Name
  if (!result.productName) {
    for (const tp of KNOWN_TRADE_PRODUCTS) {
      if (lower.includes(tp.name.toLowerCase())) {
        result.productName = tp.name;
        if (!detectedFields.includes('Product Name')) detectedFields.push('Product Name');
        if (!result.activeIngredient) {
          result.activeIngredient = tp.activeIngredient;
          if (!detectedFields.includes('Active Chemical Ingredient')) detectedFields.push('Active Chemical Ingredient');
        }
        if (!result.brandOrCompany) {
          result.brandOrCompany = tp.company;
          if (!detectedFields.includes('Company Name')) detectedFields.push('Company Name');
        }
        break;
      }
    }
  }
}

function findManufacturerMatch(text: string): string | null {
  const lower = text.toLowerCase();
  for (const m of KNOWN_MANUFACTURERS) {
    if (lower === m.name.toLowerCase() || m.aliases.some(a => lower === a.toLowerCase())) {
      return m.name;
    }
  }
  return null;
}

function normalizeDate(rawDate: string): string {
  const clean = rawDate.replace(/\//g, '-').trim();
  // If YYYY-MM
  if (/^\d{4}-\d{2}$/.test(clean)) return `${clean}-01`;
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  // If DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
    const parts = clean.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  // If MM-YYYY
  if (/^\d{2}-\d{4}$/.test(clean)) {
    const parts = clean.split('-');
    return `${parts[1]}-${parts[0]}-01`;
  }
  return clean;
}

/**
 * Builds the transparent breakdown of which typical fields were found vs NOT found
 */
function finalizeBreakdown(result: DetectedCodeInfo, detectedFields: string[]) {
  result.detectedFields = Array.from(new Set(detectedFields));

  const standardExpectedFields = [
    'Product Name',
    'Company Name',
    'Batch Number',
    'Barcode Number',
    'Expiry Date',
    'Manufacturing Date',
    'Selling Price / MRP',
    'Serial Number'
  ];

  result.unidentifiedFields = standardExpectedFields.filter(f => {
    if (f === 'Product Name' && result.productName) return false;
    if (f === 'Company Name' && result.brandOrCompany) return false;
    if (f === 'Batch Number' && result.batchNumber) return false;
    if (f === 'Barcode Number' && (result.barcodeNumber || result.productIdOrGtin)) return false;
    if (f === 'Expiry Date' && result.expiryDate) return false;
    if (f === 'Manufacturing Date' && result.manufacturingDate) return false;
    if (f === 'Selling Price / MRP' && result.retailPrice) return false;
    if (f === 'Serial Number' && result.serialNumber) return false;
    return true;
  });
}

/**
 * Smart Product Matching Engine
 * 
 * Searches the inventory using all detected identifiers.
 * CRITICAL RULE: "Never assume a manufacturer name alone identifies a specific product or batch."
 */
export function matchDetectedCodeWithInventory(
  detected: DetectedCodeInfo, 
  inventoryProducts: Product[]
): ProductMatchResult {
  const candidates: ProductMatchCandidate[] = [];
  const rawClean = detected.rawCode.trim().toLowerCase();

  // --- PASS 1: Exact Code Match (Original Barcode, Original QR, or Custom Barcode) ---
  for (const prod of inventoryProducts) {
    // Check product-level codes
    if (
      (prod.originalBarcode && prod.originalBarcode.toLowerCase() === rawClean) ||
      (prod.originalQrCode && prod.originalQrCode.toLowerCase() === rawClean) ||
      (prod.customBarcode && prod.customBarcode.toLowerCase() === rawClean)
    ) {
      // Find active batch or newest batch
      const bestBatch = prod.batches.find(b => b.currentQuantity > 0) || prod.batches[0];
      candidates.push({
        product: prod,
        batch: bestBatch,
        matchReason: 'Exact match with registered manufacturer barcode / QR code',
        matchScore: 100,
      });
      continue;
    }

    // Check batch-level codes
    for (const b of prod.batches) {
      if (
        (b.originalBarcode && b.originalBarcode.toLowerCase() === rawClean) ||
        (b.originalQrCode && b.originalQrCode.toLowerCase() === rawClean) ||
        (b.customBarcode && b.customBarcode.toLowerCase() === rawClean)
      ) {
        candidates.push({
          product: prod,
          batch: b,
          matchReason: `Exact match with Batch ${b.batchNumber} registered code`,
          matchScore: 100,
        });
      }
    }
  }

  // --- PASS 2: Match by detected Batch Number ---
  if (detected.batchNumber) {
    const targetBatch = detected.batchNumber.toLowerCase();
    for (const prod of inventoryProducts) {
      for (const b of prod.batches) {
        if (b.batchNumber.toLowerCase() === targetBatch) {
          // Verify if not already added in pass 1
          const exists = candidates.some(c => c.product.id === prod.id && c.batch?.id === b.id);
          if (!exists) {
            candidates.push({
              product: prod,
              batch: b,
              matchReason: `Batch Number match (${b.batchNumber})`,
              matchScore: 90,
            });
          }
        }
      }
    }
  }

  // --- PASS 3: Match by detected Barcode Number / GTIN ---
  const detectedBarcode = detected.barcodeNumber || detected.productIdOrGtin;
  if (detectedBarcode) {
    const targetCode = detectedBarcode.toLowerCase();
    for (const prod of inventoryProducts) {
      if (
        (prod.originalBarcode && prod.originalBarcode.toLowerCase() === targetCode) ||
        (prod.customBarcode && prod.customBarcode.toLowerCase() === targetCode)
      ) {
        const exists = candidates.some(c => c.product.id === prod.id);
        if (!exists) {
          const batch = prod.batches.find(b => b.currentQuantity > 0) || prod.batches[0];
          candidates.push({
            product: prod,
            batch: batch,
            matchReason: `Product Barcode / GTIN match (${detectedBarcode})`,
            matchScore: 85,
          });
        }
      }
    }
  }

  // --- PASS 4: Match by detected Product Name + Brand ---
  // (NEVER match on brand alone!)
  if (detected.productName) {
    const targetName = detected.productName.toLowerCase();
    for (const prod of inventoryProducts) {
      const pNameLower = prod.name.toLowerCase();
      if (pNameLower.includes(targetName) || targetName.includes(pNameLower)) {
        // If brand is also detected, verify it matches
        if (detected.brandOrCompany) {
          const brandMatch = prod.brand.toLowerCase().includes(detected.brandOrCompany.toLowerCase()) ||
                             detected.brandOrCompany.toLowerCase().includes(prod.brand.toLowerCase());
          if (!brandMatch) continue; // Skip if different company
        }

        const exists = candidates.some(c => c.product.id === prod.id);
        if (!exists) {
          const batch = prod.batches.find(b => b.currentQuantity > 0) || prod.batches[0];
          candidates.push({
            product: prod,
            batch: batch,
            matchReason: `Product Name match: "${prod.name}"`,
            matchScore: 75,
          });
        }
      }
    }
  }

  // Determine Final Match Status
  if (candidates.length === 1) {
    return {
      status: 'EXACT_MATCH',
      matches: candidates,
      detectedInfo: detected,
    };
  } else if (candidates.length > 1) {
    return {
      status: 'MULTIPLE_MATCHES',
      matches: candidates,
      detectedInfo: detected,
    };
  } else {
    return {
      status: 'NOT_FOUND',
      matches: [],
      detectedInfo: detected,
    };
  }
}

/**
 * Scan History Manager
 */
export function getScanHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logScanToHistory(entry: Omit<ScanHistoryEntry, 'id' | 'timestamp'>): void {
  try {
    const history = getScanHistory();
    const newEntry: ScanHistoryEntry = {
      ...entry,
      id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    // Keep last 50 scans
    const updated = [newEntry, ...history].slice(0, 50);
    localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to log scan history:', err);
  }
}

export function clearScanHistory(): void {
  localStorage.removeItem(SCAN_HISTORY_STORAGE_KEY);
}

/**
 * Reported Incorrect Scans Manager
 */
export function getReportedScanIssues(): ReportedScanIssue[] {
  try {
    const raw = localStorage.getItem(REPORTED_ISSUES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function reportScanIssue(data: Omit<ReportedScanIssue, 'id' | 'timestamp' | 'status'>): ReportedScanIssue {
  const issues = getReportedScanIssues();
  const newIssue: ReportedScanIssue = {
    ...data,
    id: 'issue_' + Date.now(),
    timestamp: new Date().toISOString(),
    status: 'LOGGED',
  };
  const updated = [newIssue, ...issues].slice(0, 30);
  localStorage.setItem(REPORTED_ISSUES_STORAGE_KEY, JSON.stringify(updated));
  return newIssue;
}

/**
 * Sample Pesticide Test Codes for Testing Mode
 * Covers 5 different real-world manufacturers & code formats
 */
export interface ScannerTestCase {
  id: string;
  manufacturer: string;
  productName: string;
  codeFormat: string;
  sampleCode: string;
  description: string;
  expectedDetected: {
    batchNumber?: string;
    productName?: string;
    company?: string;
    expiry?: string;
    barcode?: string;
    gtin?: string;
    serial?: string;
    url?: string;
  };
  notes: string;
}

export const SCANNER_TEST_CASES: ScannerTestCase[] = [
  {
    id: 'test_bayer_gs1',
    manufacturer: 'Bayer CropScience',
    productName: 'Coragen 18.5% SC',
    codeFormat: 'GS1 2D DataMatrix',
    sampleCode: '(01)08901234567890(10)BAY-CRG-9021(17)271231(21)SN-998812(11)240615',
    description: 'High-density GS1 DataMatrix code printed on 150ml and 500ml Coragen bottles.',
    expectedDetected: {
      company: 'Bayer CropScience',
      productName: 'Coragen',
      batchNumber: 'BAY-CRG-9021',
      expiry: '2027-12-31',
      gtin: '08901234567890',
      serial: 'SN-998812',
    },
    notes: 'Encodes GTIN (01), Batch (10), Expiry (17), Serial (21), and Mfg Date (11).'
  },
  {
    id: 'test_syngenta_ean13',
    manufacturer: 'Syngenta India',
    productName: 'Amistar Top (Fungicide)',
    codeFormat: 'Standard 1D EAN-13 Barcode',
    sampleCode: '8901030825123',
    description: 'Physical 13-digit retail barcode found on Syngenta packaging.',
    expectedDetected: {
      barcode: '8901030825123',
    },
    notes: 'Standard 1D barcodes encode product GTIN only. Does NOT contain batch number.'
  },
  {
    id: 'test_fmc_qr',
    manufacturer: 'FMC Corporation',
    productName: 'Furadan 3G (Carbofuran)',
    codeFormat: 'Manufacturer Bottle QR Code',
    sampleCode: 'FMC:FURADAN:BATCH-FMC-4481:EXP-2027-05-30:MRP-620',
    description: 'Alphanumeric QR code printed on granular pesticide buckets.',
    expectedDetected: {
      company: 'FMC Corporation',
      productName: 'Furadan',
      batchNumber: 'BATCH-FMC-4481',
      expiry: '2027-05-30',
    },
    notes: 'Delimited manufacturer code containing product name, batch, expiry, and MRP.'
  },
  {
    id: 'test_upl_url',
    manufacturer: 'UPL Limited',
    productName: 'Saaf Fungicide 500g',
    codeFormat: 'Track & Trace Verification URL',
    sampleCode: 'https://upl-ltd.com/track/saaf?batch=UPL-SF-2024&mfg=2024-02-10&exp=2026-08-31&mrp=480',
    description: 'Security anti-counterfeit QR code printed on UPL Saaf pouches.',
    expectedDetected: {
      company: 'UPL Limited',
      productName: 'saaf',
      batchNumber: 'UPL-SF-2024',
      expiry: '2026-08-31',
      url: 'https://upl-ltd.com/track/saaf?batch=UPL-SF-2024&mfg=2024-02-10&exp=2026-08-31&mrp=480',
    },
    notes: 'URL format safely parsed without navigating or trusting untrusted external links.'
  },
  {
    id: 'test_rallis_manual',
    manufacturer: 'Tata Rallis India',
    productName: 'Tata Mida 250ml',
    codeFormat: 'No Barcode / No QR (100% Manual Entry)',
    sampleCode: '',
    description: 'Local pesticide bottle with worn or missing sticker label.',
    expectedDetected: {},
    notes: 'Validates that the system functions without barcodes or QR codes (optional scanning requirement).'
  }
];
