import QRCode from 'qrcode';
import { Batch, Product, QRPayload } from '../types';

/**
 * Encodes product and batch information into a compressed, high-density JSON QR code payload.
 */
export function createQRPayload(product: Product, batch: Batch): QRPayload {
  return {
    v: 1,
    bId: batch.id,
    pId: product.id,
    pName: product.name,
    bNo: batch.batchNumber,
    exp: batch.expiryDate,
    mrp: batch.retailPrice,
    ai: product.activeIngredient,
    lic: product.governmentLicenseNo,
    tox: product.toxicityClass,
  };
}

/**
 * Generates a dynamic QR Code Data URL (PNG) for rendering in UI and printable sticker sheets.
 */
export async function generateBatchQRCodeDataUrl(payloadOrText: QRPayload | string): Promise<string> {
  const text = typeof payloadOrText === 'string' ? payloadOrText : JSON.stringify(payloadOrText);
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Validates and decodes raw scanned QR data string into a verified QRPayload.
 */
export function parseScannedQRData(rawString: string): QRPayload | null {
  try {
    const parsed = JSON.parse(rawString);
    if (parsed && parsed.bId && parsed.pId && parsed.bNo) {
      return parsed as QRPayload;
    }
    // Also support fallback format like "AGRO:pId:bId"
    if (typeof rawString === 'string' && rawString.startsWith('AGRO:')) {
      const parts = rawString.split(':');
      if (parts.length >= 3) {
        return {
          v: 1,
          pId: parts[1],
          bId: parts[2],
          pName: parts[3] || 'Product',
          bNo: parts[4] || 'BATCH-01',
          exp: '',
          mrp: 0,
          ai: '',
          lic: '',
          tox: 'NONE',
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calculates days until expiration. Negative means already expired.
 */
export function getDaysUntilExpiration(expiryDateStr: string): number {
  if (!expiryDateStr) return 999;
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats Toxicity class display label and badge styling
 */
export function getToxicityDisplay(toxicityClass: string) {
  switch (toxicityClass) {
    case 'RED':
      return {
        label: 'Extremely Toxic (Cat I)',
        short: 'Red',
        colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
        triangleBg: '#e11d48',
      };
    case 'YELLOW':
      return {
        label: 'Highly Toxic (Cat II)',
        short: 'Yellow',
        colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
        triangleBg: '#f59e0b',
      };
    case 'BLUE':
      return {
        label: 'Moderately Toxic (Cat III)',
        short: 'Blue',
        colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
        triangleBg: '#2563eb',
      };
    case 'GREEN':
      return {
        label: 'Slightly Toxic (Cat IV)',
        short: 'Green',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        triangleBg: '#10b981',
      };
    default:
      return {
        label: 'Non-Hazardous / Certified',
        short: 'General',
        colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
        triangleBg: '#94a3b8',
      };
  }
}
