import React, { useState } from 'react';
import { Invoice } from '../types';
import { Printer, X, CheckCircle2, Download, Settings, Heart, Check } from 'lucide-react';
import { store } from '../services/store';
import { ShopSettingsModal } from './ShopSettingsModal';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shopSettings, setShopSettings] = useState(store.getShopSettings());

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Generate clean self-contained HTML bill suitable for browser print-to-PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill #${invoice.invoiceNumber} - ${shopSettings.shopName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 20px;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.5;
    }
    .bill-box {
      max-width: 480px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 24px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .shop-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .shop-meta {
      font-size: 12px;
      color: #475569;
      margin: 2px 0;
    }
    .bill-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .customer-box {
      margin-bottom: 16px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #475569;
      padding: 8px 4px;
      border-bottom: 1px solid #0f172a;
    }
    td {
      padding: 8px 4px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .num {
      text-align: right;
      font-family: monospace;
    }
    .center {
      text-align: center;
      font-family: monospace;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      padding-top: 12px;
      border-top: 2px solid #0f172a;
      margin-bottom: 24px;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #059669;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .bill-box { border: none; max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="bill-box">
    <div class="header">
      <h1 class="shop-name">${shopSettings.shopName || 'AgroPulse'}</h1>
      ${shopSettings.shopAddress ? `<p class="shop-meta">${shopSettings.shopAddress}</p>` : ''}
      ${shopSettings.shopPhone ? `<p class="shop-meta">Phone: ${shopSettings.shopPhone}</p>` : ''}
    </div>

    <div class="bill-meta">
      <div><strong>Bill No:</strong> #${invoice.invoiceNumber}</div>
      <div><strong>Date:</strong> ${invoice.date}</div>
    </div>

    ${invoice.customerName || invoice.customerPhone ? `
    <div class="customer-box">
      ${invoice.customerName ? `<div><strong>Customer:</strong> ${invoice.customerName}</div>` : ''}
      ${invoice.customerPhone ? `<div><strong>Phone:</strong> ${invoice.customerPhone}</div>` : ''}
    </div>
    ` : ''}

    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th class="center">Qty</th>
          <th class="num">Price (₹)</th>
          <th class="num">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(i => `
          <tr>
            <td><strong>${i.productName}</strong></td>
            <td class="center">${i.quantity}</td>
            <td class="num">₹${i.unitPrice.toLocaleString()}</td>
            <td class="num"><strong>₹${i.total.toLocaleString()}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="total-row">
      <span>Total Amount:</span>
      <span>₹${invoice.grandTotal.toLocaleString()}</span>
    </div>

    <div class="footer">
      Thank you for shopping!
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Has customer details?
  const hasCustomerInfo = Boolean(invoice.customerName?.trim() || invoice.customerPhone?.trim());

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-6 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Controls Bar (Hidden during Print) */}
          <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-extrabold text-xs">Sale Completed Successfully</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Edit Shop Details"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shop Info</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                title="Download Bill File / PDF"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Clean, Simple Customer-Facing Receipt */}
          <div className="printable-sheet bg-white text-slate-900 text-xs space-y-4 p-2 sm:p-4 font-sans select-none border border-slate-200 rounded-xl shadow-2xs">
            
            {/* 1. Shop Details Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
              <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-slate-900">
                {shopSettings.shopName || 'AgroPulse'}
              </h1>
              {shopSettings.shopAddress && (
                <p className="text-xs text-slate-600 font-medium">
                  {shopSettings.shopAddress}
                </p>
              )}
              {shopSettings.shopPhone && (
                <p className="text-xs text-slate-600 font-mono">
                  Phone: {shopSettings.shopPhone}
                </p>
              )}
            </div>

            {/* Bill Number & Date Bar */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-dashed border-slate-200 pb-2">
              <div>
                <span className="font-semibold text-slate-700">Bill No:</span> #{invoice.invoiceNumber}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Date:</span> {invoice.date}
              </div>
            </div>

            {/* 2. Customer Details (Optional - Only shown if provided) */}
            {hasCustomerInfo && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-0.5">
                {invoice.customerName && (
                  <div>
                    <span className="text-slate-500 font-semibold">Customer: </span>
                    <strong className="text-slate-900">{invoice.customerName}</strong>
                  </div>
                )}
                {invoice.customerPhone && (
                  <div className="font-mono text-slate-600">
                    <span className="text-slate-500 font-semibold">Phone: </span>
                    {invoice.customerPhone}
                  </div>
                )}
              </div>
            )}

            {/* 3. Purchased Products Table - SHOWS ONLY: Product Name, Quantity, Price, Total */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-700 uppercase text-[10px]">
                  <th className="py-2 pr-2 font-extrabold">Product Name</th>
                  <th className="py-2 px-2 font-extrabold text-center">Qty</th>
                  <th className="py-2 px-2 font-extrabold text-right">Price</th>
                  <th className="py-2 pl-2 font-extrabold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <span className="font-bold text-slate-900">{item.productName}</span>
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700">
                      ₹{item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-2 pl-2 text-right font-mono font-bold tabular-nums text-slate-900">
                      ₹{item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. Final Bill - Payable Amount */}
            <div className="border-t-2 border-slate-900 pt-3 space-y-1">
              <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-slate-900">
                <span>Final Payable Amount:</span>
                <span className="font-mono tabular-nums text-emerald-800">
                  ₹{invoice.grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-700 uppercase">{invoice.paymentMethod}</span>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="pt-3 pb-1 border-t border-dashed border-slate-200 text-center space-y-0.5">
              <p className="text-xs font-bold text-emerald-700">
                Thank you for shopping!
              </p>
              <p className="text-[10px] text-slate-400">
                We appreciate your business. Visit us again!
              </p>
            </div>

          </div>

          {/* Modal Footer Note */}
          <div className="no-print text-center text-[11px] text-slate-400">
            Clean Customer Bill · Suitable for standard 80mm POS thermal printers or A4 PDF print.
          </div>

        </div>
      </div>

      {/* Edit Shop Settings Modal */}
      <ShopSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={(updated) => setShopSettings(updated)}
      />
    </>
  );
};
