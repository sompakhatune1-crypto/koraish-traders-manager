import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { SaleTransaction } from '../types';
import { useApp } from '../context/AppContext';
import { formatTaka, toBnDigits, formatDateTime, formatBags } from '../utils/formatters';

interface InvoicePrintModalProps {
  sale: SaleTransaction;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ sale, onClose }) => {
  const { profile } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 shadow-2xl relative print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden mb-4">
          <span className="text-xs font-bold text-slate-600">ক্যাশ মেমো প্রিন্ট প্রিভিউ</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div className="text-center pb-3 border-b-2 border-slate-900">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {profile.businessName || 'মেসার্স কোরাইশ ট্রেডার্স'}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            {profile.tagline || 'গুণগতমানের সকল ব্রান্ডের সিমেন্ট পাইকারি ও খুচরা বিক্রেতা'}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            {profile.address} • মোবা: {toBnDigits(profile.phone)}
          </p>
          <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
            ক্যাশ মেমো / বিক্রয় চালান
          </div>
        </div>

        {/* Metadata */}
        <div className="flex justify-between text-xs py-2.5 border-b border-slate-200">
          <div>
            <p>
              <span className="text-slate-500">ক্রেতার নাম:</span>{' '}
              <strong className="text-slate-900">{sale.customerName}</strong>
            </p>
            {sale.customerPhone && (
              <p>
                <span className="text-slate-500">মোবাইল:</span>{' '}
                <span>{toBnDigits(sale.customerPhone)}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p>
              <span className="text-slate-500">চালান নং:</span>{' '}
              <strong className="text-slate-900">{sale.invoiceNumber}</strong>
            </p>
            <p className="text-slate-500 text-[10px]">{formatDateTime(sale.createdAt)}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-2.5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 text-[11px]">
                <th className="text-left py-1">বিবরণ / সিমেন্ট</th>
                <th className="text-center py-1">বস্তা</th>
                <th className="text-right py-1">দর</th>
                <th className="text-right py-1">মোট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx} className="py-1.5">
                  <td className="py-1.5 font-semibold text-slate-800">{item.brandName}</td>
                  <td className="py-1.5 text-center font-bold">{toBnDigits(item.quantity)}</td>
                  <td className="py-1.5 text-right font-medium">{formatTaka(item.unitPrice)}</td>
                  <td className="py-1.5 text-right font-bold text-slate-900">
                    {formatTaka(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation summary */}
        <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">মোট টাকা:</span>
            <span className="font-bold">{formatTaka(sale.totalAmount)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>ছাড় (ডিসকাউন্ট):</span>
              <span>-{formatTaka(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-1">
            <span>সর্বমোট প্রদেয়:</span>
            <span>{formatTaka(sale.netAmount)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>পরিশোধ ({sale.paymentMethod}):</span>
            <span>{formatTaka(sale.paidAmount)}</span>
          </div>
          {sale.dueAmount > 0 && (
            <div className="flex justify-between text-rose-700 font-extrabold text-sm border-t border-dashed border-slate-300 pt-1">
              <span>অবশিষ্ট বাকি (Due):</span>
              <span>{formatTaka(sale.dueAmount)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
          <p className="font-semibold text-slate-700">ধন্যবাদ, আপনার ব্যবসা শুভ হোক!</p>
          <p className="mt-0.5">সিমেন্ট ভালো স্থানে রাখুন ও পানি থেকে নিরাপদে রাখুন।</p>
        </div>
      </div>
    </div>
  );
};
