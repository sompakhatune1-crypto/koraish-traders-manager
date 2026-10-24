import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Upload,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Plus,
  Shield,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTaka, toBnDigits, formatDate, formatDateTime } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const {
    sales,
    purchases,
    expenses,
    auditLogs,
    products,
    currentCashBalance,
    currentBkashBalance,
    totalCustomerDue,
    totalSupplierPayable,
    recordExpenseEntry,
    exportDatabaseJson,
    importDatabaseJson,
  } = useApp();

  const [dateRange, setDateRange] = useState<'today' | 'this_month' | 'all'>('this_month');
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [restoreJson, setRestoreJson] = useState<string>('');
  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Expense form state
  const [expTitle, setExpTitle] = useState<string>('');
  const [expCategory, setExpCategory] = useState<'TRANSPORT' | 'LABOR' | 'SHOP_RENT' | 'ELECTRICITY' | 'TEA_SNACKS' | 'OTHER'>('LABOR');
  const [expAmount, setExpAmount] = useState<number>(500);
  const [expMethod, setExpMethod] = useState<'CASH' | 'BKASH'>('CASH');

  // Filter sales and expenses by date
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.status === 'REVERSED') return false;
      const d = new Date(s.createdAt);
      if (dateRange === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (dateRange === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, dateRange]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.createdAt);
      if (dateRange === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (dateRange === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [expenses, dateRange]);

  // Financial calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.netAmount, 0);

  // COGS calculation based on product avg purchase price
  const cogs = useMemo(() => {
    let cost = 0;
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const purchaseCost = prod ? prod.avgPurchasePrice : item.unitPrice * 0.92;
        cost += item.quantity * purchaseCost;
      });
    });
    return cost;
  }, [filteredSales, products]);

  const grossProfit = Math.max(0, totalRevenue - cogs);
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpensesAmount;

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0 || !expTitle.trim()) return;

    recordExpenseEntry({
      title: expTitle.trim(),
      category: expCategory,
      amount: expAmount,
      paymentMethod: expMethod,
    });

    setShowExpenseModal(false);
    setExpTitle('');
    setExpAmount(500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koraish_traders_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice,Date,Customer,Total,Paid,Due,Method\n';

    sales.forEach((s) => {
      csvContent += `"${s.invoiceNumber}","${s.createdAt}","${s.customerName}",${s.netAmount},${s.paidAmount},${s.dueAmount},"${s.paymentMethod}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `koraish_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreStatus(null);
    if (!restoreJson.trim()) return;

    const res = importDatabaseJson(restoreJson);
    setRestoreStatus(res);
    if (res.success) {
      setTimeout(() => {
        setShowRestoreModal(false);
        setRestoreJson('');
      }, 1500);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>ব্যবসায়িক রিপোর্ট ও লাভ-ক্ষতি হিসাব</span>
          </h1>
          <p className="text-xs text-slate-400">দৈনিক ক্লোজিং, নিট মুনাফা ও ডাটা ব্যাকআপ</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setDateRange('today')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                dateRange === 'today' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              আজকে
            </button>
            <button
              onClick={() => setDateRange('this_month')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                dateRange === 'this_month' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              চলতি মাস
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                dateRange === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              সর্বমোট
            </button>
          </div>
        </div>
      </div>

      {/* Profit & Loss Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs text-slate-400">মোট বিক্রয় রাজস্ব</p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-100 mt-1">
            {formatTaka(totalRevenue)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{toBnDigits(filteredSales.length)}টি চালান</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs text-slate-400">বিক্রিত মালের ক্রয়মূল্য (COGS)</p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-300 mt-1">
            {formatTaka(cogs)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">গড় ক্রয়মূল্য অনুযায়ী</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs text-slate-400">দোকানের মোট খরচ</p>
          <p className="text-lg sm:text-xl font-extrabold text-rose-300 mt-1">
            {formatTaka(totalExpensesAmount)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{toBnDigits(filteredExpenses.length)}টি খরচ</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40">
          <p className="text-xs font-semibold text-emerald-400">প্রকৃত নিট লাভ (Net Profit)</p>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-300 mt-1">
            {formatTaka(netProfit)}
          </p>
          <p className="text-[10px] text-emerald-500/80 mt-0.5">মুনাফা - খরচ</p>
        </div>
      </div>

      {/* Daily Closing Report & Actions */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>দৈনিক ক্লোজিং ও ক্যাশ মিলানো রিপোর্ট</span>
          </h2>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 border border-slate-700 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>খরচ লিখুন</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">হাতে নগদ ক্যাশ</span>
            <span className="font-extrabold text-slate-100">{formatTaka(currentCashBalance)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">বিকাশ ব্যালেন্স</span>
            <span className="font-extrabold text-pink-300">{formatTaka(currentBkashBalance)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">কাস্টমার বকেয়া (পাব)</span>
            <span className="font-extrabold text-rose-400">{formatTaka(totalCustomerDue)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">মহাজন দেনা</span>
            <span className="font-extrabold text-orange-400">{formatTaka(totalSupplierPayable)}</span>
          </div>
        </div>
      </div>

      {/* Backup, Durability, and Excel Export */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>ডাটা স্থায়িত্ব, ব্যাকআপ ও এক্সেল এক্সপোর্ট</span>
        </h2>
        <p className="text-xs text-slate-400">
          আপনার ব্যবসার হিসাব সুরক্ষিত রাখতে নিয়মিত সম্পূর্ণ ব্যাকআপ ফাইল নামিয়ে রাখুন।
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950/60"
          >
            <Download className="w-4 h-4" />
            <span>সম্পূর্ণ ব্যাকআপ ফাইল ডাউনলোড (JSON)</span>
          </button>

          <button
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs border border-slate-700"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>ব্যাকআপ রিস্টোর করুন</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs border border-slate-700"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <span>বিক্রয় রিপোর্ট (CSV / Excel)</span>
          </button>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h2 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>অডিট ট্রেইল ও নিরাপত্তা হিস্ট্রি</span>
        </h2>
        <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 text-xs">
          {auditLogs.slice(0, 15).map((log) => (
            <div key={log.id} className="py-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-200">{log.details}</p>
                <p className="text-[10px] text-slate-500 font-mono">{log.action}</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <h2 className="text-base font-bold mb-3">দোকানের দৈনন্দিন খরচ লিখুন</h2>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">খরচের বিবরণ:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ট্রাক লোডিং লেবার খরচ"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ক্যাটাগরি:</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                >
                  <option value="LABOR">লেবার / কুলি বিল</option>
                  <option value="TRANSPORT">ট্রাক ও পরিবহন</option>
                  <option value="SHOP_RENT">দোকান / গোডাউন ভাড়া</option>
                  <option value="ELECTRICITY">বিদ্যুৎ ও জেনারেটর</option>
                  <option value="TEA_SNACKS">আপ্যায়ন ও চা-নাস্তা</option>
                  <option value="OTHER">অন্যান্য খরচ</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">টাকার পরিমাণ (৳):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">পরিশোধ মাধ্যম:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpMethod('CASH')}
                    className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                      expMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    নগদ ক্যাশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpMethod('BKASH')}
                    className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                      expMethod === 'BKASH'
                        ? 'bg-pink-600 text-white border-pink-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    বিকাশ
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <h2 className="text-base font-bold mb-1">ব্যাকআপ ফাইল থেকে ডাটা রিস্টোর</h2>
            <p className="text-xs text-slate-400 mb-3">
              আগে ডাউনলোড করা JSON ব্যাকআপ ফাইলের বিষয়বস্তু নিচে পেস্ট করুন:
            </p>

            <form onSubmit={handleRestoreSubmit} className="space-y-3 text-xs">
              <textarea
                rows={6}
                required
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                placeholder='{"appName": "মেসার্স কোরাইশ ট্রেডার্স", ...}'
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-200 focus:border-emerald-500 focus:outline-none"
              />

              {restoreStatus && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    restoreStatus.success
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {restoreStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{restoreStatus.message}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestoreModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow"
                >
                  রিস্টোর নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
