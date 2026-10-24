import React from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Smartphone,
  Users,
  Building2,
  AlertTriangle,
  PlusCircle,
  Mic,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTaka, toBnDigits, formatDateTime, formatBags } from '../utils/formatters';
import { NavTab } from './BottomNav';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenVoice: () => void;
  onQuickSale: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenVoice,
  onQuickSale,
}) => {
  const {
    products,
    sales,
    purchases,
    bkashTransactions,
    totalStockBags,
    totalStockValue,
    totalCustomerDue,
    totalSupplierPayable,
    currentCashBalance,
    currentBkashBalance,
    todaySalesAmount,
    todayPurchasesAmount,
    lowStockCount,
  } = useApp();

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);
  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/10 border border-amber-500/40 flex items-center justify-between gap-3 text-slate-100">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-300">
                {toBnDigits(lowStockCount)}টি সিমেন্টের স্টক সতর্কতা সীমায় আছে!
              </p>
              <p className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-md">
                {lowStockProducts.map((p) => `${p.brandName} (${toBnDigits(p.currentStock)})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('stock')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow"
          >
            স্টক দেখুন
          </button>
        </div>
      )}

      {/* Primary KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Today's Sales */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-emerald-500/30 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">আজকের বিক্রি</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {formatTaka(todaySalesAmount)}
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            নগদ ও বাকি বিক্রয়
          </p>
        </div>

        {/* Cash in Hand */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-teal-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">হাতে নগদ ক্যাশ</span>
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {formatTaka(currentCashBalance)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">দোকানের চলতি ক্যাশ</p>
        </div>

        {/* bKash Balance */}
        <div
          onClick={() => onNavigate('bkash')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-pink-500/30 shadow-lg cursor-pointer hover:border-pink-500/60 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">বিকাশ ব্যালেন্স</span>
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-pink-300 tracking-tight">
            {formatTaka(currentBkashBalance)}
          </div>
          <p className="text-[10px] text-pink-400 mt-1 flex items-center justify-between">
            <span>রেকর্ডকৃত জমা</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Total Stock Valuation */}
        <div
          onClick={() => onNavigate('stock')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-amber-500/30 shadow-lg cursor-pointer hover:border-amber-500/60 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">মোট স্টক সিমেন্ট</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {formatBags(totalStockBags)}
          </div>
          <p className="text-[10px] text-amber-300 mt-1 flex items-center justify-between font-medium">
            <span>মূল্য: {formatTaka(totalStockValue)}</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Dues & Payables Quick Row */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        <div
          onClick={() => onNavigate('ledger')}
          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">কাস্টমার বাকি (পাব)</p>
              <p className="text-base sm:text-lg font-bold text-rose-300">
                {formatTaka(totalCustomerDue)}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => onNavigate('ledger')}
          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">মহাজন পাওনা (দেনা)</p>
              <p className="text-base sm:text-lg font-bold text-orange-300">
                {formatTaka(totalSupplierPayable)}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Prominent Quick Actions Toolbar */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-900/30">
        <p className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
          <span>দ্রুত ব্যবসায়িক কাজ</span>
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={onQuickSale}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex flex-col items-center justify-center gap-1 shadow-md shadow-emerald-950/60 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-[11px] font-bold">নতুন বিক্রি</span>
          </button>

          <button
            onClick={() => onNavigate('purchases')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 flex flex-col items-center justify-center gap-1 border border-slate-700/60 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold">মাল ক্রয়</span>
          </button>

          <button
            onClick={() => onNavigate('bkash')}
            className="p-2.5 rounded-xl bg-pink-900/40 hover:bg-pink-900/60 active:scale-95 text-pink-200 flex flex-col items-center justify-center gap-1 border border-pink-500/40 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span className="text-[11px] font-bold">বিকাশ জমা</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-slate-950 flex flex-col items-center justify-center gap-1 shadow-md shadow-amber-950/40 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4 text-slate-950" />
            <span className="text-[11px] font-bold">ভয়েস নির্দেশ</span>
          </button>
        </div>
      </div>

      {/* Brand-Wise Cement Stock Grid */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>সিমেন্ট ব্রান্ড স্টক পরিস্থিতি</span>
          </h2>
          <button
            onClick={() => onNavigate('stock')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {products.slice(0, 6).map((product) => {
            const isLow = product.currentStock <= product.minStockAlert;
            const percentage = Math.min(100, Math.round((product.currentStock / 500) * 100));

            return (
              <div
                key={product.id}
                className={`p-3 rounded-xl border transition-all ${
                  isLow
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-850 bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {product.brandName}
                  </span>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      isLow ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {toBnDigits(product.currentStock)} বস্তা
                  </span>
                </div>

                <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${
                      isLow ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>বিক্রয় দর: {formatTaka(product.defaultSalePrice)}</span>
                  <span>ক্রয় দর: {formatTaka(product.avgPurchasePrice)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sales History */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>সাম্প্রতিক বিক্রয় লেনদেন</span>
          </h2>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>বিক্রয় খাতা</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            এখনও কোনো বিক্রয় রেকর্ড করা হয়নি। "নতুন বিক্রি" বাটনে চাপুন।
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentSales.map((sale) => (
              <div key={sale.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200">{sale.customerName}</span>
                    <span className="text-[10px] text-slate-400">({sale.invoiceNumber})</span>
                    {sale.status === 'REVERSED' && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300">বাতিলকৃত</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {sale.items.map((i) => `${toBnDigits(i.quantity)} বস্তা ${i.brandName}`).join(', ')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-emerald-400">{formatTaka(sale.netAmount)}</p>
                  <p className="text-[10px] text-slate-400">{formatDateTime(sale.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
