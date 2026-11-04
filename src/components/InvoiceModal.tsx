import React from 'react';
import { Invoice } from '../types';
import { Printer, X, CheckCircle2, ShieldCheck, Sprout } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
        
        {/* Modal Controls (No Print) */}
        <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm">Sale Completed &amp; Stock Deducted Live</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Document Body */}
        <div className="printable-sheet bg-white text-slate-900 text-xs space-y-5 p-2 font-sans">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-700 rounded flex items-center justify-center text-white">
                  <Sprout className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
                  AgroPulse Kisan Kendra &amp; Retail
                </h1>
              </div>
              <p className="text-[11px] text-slate-600">
                Authorised Dealer: High-Yield Seeds, Agrochemicals &amp; Crop Nutrients
              </p>
              <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                <div>Main Market Yard, Tehsil Road, District Agriculture Corridor</div>
                <div>GSTIN: <span className="font-bold text-slate-800">27AAAPG9912L1ZX</span> · Phone: +91 98200 90001</div>
                <div>Pesticide Reg Lic: <span className="font-bold text-slate-800">LIC-CIB-RC/MH/2021/8891</span> · Seed Permit: <span className="font-bold text-slate-800">SEED-DL-4412</span></div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 font-bold uppercase text-[10px] rounded">
                Tax Invoice / Cash Memo
              </span>
              <div className="font-mono text-xs font-bold text-slate-900">
                #{invoice.invoiceNumber}
              </div>
              <div className="text-[11px] font-mono text-slate-600">
                Date: {invoice.date}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Cashier: {invoice.cashierName}
              </div>
            </div>
          </div>

          {/* Customer / Farmer Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Billed To (Cultivator)</span>
              <div className="font-bold text-slate-900 text-xs">{invoice.customerName}</div>
              <div className="text-slate-600">Village: {invoice.customerVillage || 'Local Tehsil'}</div>
              <div className="font-mono text-slate-600">Phone: {invoice.customerPhone}</div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 uppercase text-[9px] font-bold block">Payment Settlement</span>
              <div className="font-bold text-emerald-800 uppercase">{invoice.paymentMethod}</div>
              {invoice.creditDue > 0 && (
                <div className="font-mono text-amber-800 font-bold">
                  Khata Credit Logged: ₹{invoice.creditDue.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-700 uppercase text-[9px]">
                <th className="py-1.5 font-bold">Item &amp; Active Chemical</th>
                <th className="py-1.5 font-bold">Batch No.</th>
                <th className="py-1.5 font-bold">Exp Date</th>
                <th className="py-1.5 font-bold text-center">Qty</th>
                <th className="py-1.5 font-bold text-right">Rate</th>
                <th className="py-1.5 font-bold text-right">GST %</th>
                <th className="py-1.5 font-bold text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="text-[10px] text-slate-500">{item.activeIngredient}</div>
                  </td>
                  <td className="py-2 pr-2 font-mono text-slate-700">{item.batchNumber}</td>
                  <td className="py-2 pr-2 font-mono text-slate-600">{item.expiryDate}</td>
                  <td className="py-2 px-2 text-center font-mono font-bold tabular-nums">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    ₹{item.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600">
                    {item.gstRate}%
                  </td>
                  <td className="py-2 pl-2 text-right font-mono font-bold tabular-nums text-slate-900">
                    ₹{item.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div className="border-t-2 border-slate-800 pt-3 flex items-start justify-between">
            <div className="text-[10px] text-slate-500 max-w-[280px] space-y-1">
              <div className="font-bold uppercase text-slate-700">Statutory Notice &amp; Safety Compliance:</div>
              <div>
                Store in a cool, dry place. Certified pure seeds according to Seeds Act 1966. For agrochemicals, wear protective gloves, mask and follow dilution instructions strictly.
              </div>
            </div>

            <div className="w-56 space-y-1 text-right font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net):</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST Component:</span>
                <span>₹{invoice.taxTotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-₹{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-300">
                <span>Grand Total:</span>
                <span>₹{invoice.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="pt-6 flex items-center justify-between border-t border-slate-200 text-[10px] text-slate-400">
            <div>
              <span>Verification Stamp: Valid System Generated Tax Invoice</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-700 uppercase">For AgroPulse Kendra</div>
              <div className="mt-4 text-[9px] text-slate-400">Authorised Signatory</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
