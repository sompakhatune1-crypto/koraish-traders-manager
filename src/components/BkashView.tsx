import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  AlertCircle,
  ShieldCheck,
  Download,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BkashTxType, BkashTransaction } from '../types';
import { formatTaka, toBnDigits, formatDateTime } from '../utils/formatters';

export const BkashView: React.FC = () => {
  const {
    bkashTransactions,
    currentBkashBalance,
    recordBkashEntry,
    deleteBkashTransaction,
    clearAllBkash,
    clearAllData,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State - string to avoid numeric stuck at 1
  const [txType, setTxType] = useState<BkashTxType>('CUSTOMER_PAYMENT');
  const [amount, setAmount] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [counterpartyName, setCounterpartyName] = useState<string>('');
  const [counterpartyPhone, setCounterpartyPhone] = useState<string>('');
  const [chargeRate, setChargeRate] = useState<number>(1.49); // 1.49% app or 1.85% USSD
  const [notes, setNotes] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);

  // Auto calculate fee for cashouts
  const parsedAmount = parseInt(amount, 10) || 0;
  const calculatedCharge = useMemo(() => {
    if (txType === 'CASH_OUT_CHARGE' || txType === 'MONEY_SENT') {
      return Math.round((parsedAmount * chargeRate) / 100);
    }
    return 0;
  }, [parsedAmount, chargeRate, txType]);

  // Check duplicate TrxID on input
  const handleTrxIdChange = (id: string) => {
    setTrxId(id);
    if (id.trim().length > 4) {
      const exists = bkashTransactions.some((t) => t.trxId.toLowerCase() === id.trim().toLowerCase());
      setDuplicateWarning(exists);
    } else {
      setDuplicateWarning(false);
    }
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      alert('দয়া করে সঠিক টাকার পরিমাণ লিখুন (টাকা ০ হতে পারবে না)');
      return;
    }

    recordBkashEntry({
      trxId: trxId.trim() || 'BKA' + Math.floor(100000 + Math.random() * 900000),
      type: txType,
      amount: parsedAmount,
      charge: calculatedCharge,
      counterpartyName: counterpartyName.trim() || (txType === 'CUSTOMER_PAYMENT' ? 'কাস্টমার' : 'ব্যবসায়িক খরচ'),
      counterpartyPhone: counterpartyPhone.trim(),
      notes: notes.trim(),
    });

    // Reset
    setShowAddModal(false);
    setTrxId('');
    setAmount('');
    setNotes('');
    setCounterpartyName('');
    setCounterpartyPhone('');
    setDuplicateWarning(false);
  };

  // Download Receipt as Text / Slip
  const handleDownloadReceipt = (tx: BkashTransaction) => {
    const isIncoming = tx.type === 'MONEY_RECEIVED' || tx.type === 'CUSTOMER_PAYMENT';
    const typeLabel =
      tx.type === 'CUSTOMER_PAYMENT'
        ? 'কাস্টমার পেমেন্ট (জমা)'
        : tx.type === 'MONEY_RECEIVED'
        ? 'টাকা গ্রহণ (জমা)'
        : tx.type === 'SUPPLIER_PAYMENT'
        ? 'মহাজন বিল পরিশোধ (খরচ)'
        : tx.type === 'MONEY_SENT'
        ? 'টাকা পাঠানো (খরচ)'
        : 'ক্যাশআউট চার্জ';

    const receiptContent = `================================================
           মেসার্স কোরাইশ ট্রেডার্স
   সিমেন্ট ইনভেন্টরি ও ব্যবসায়িক হিসাব খাতা
================================================
বিকাশ লেনদেন মানি রসিদ (bKash Receipt)
------------------------------------------------
রসিদ / TrxID : ${tx.trxId}
তারিখ ও সময়  : ${formatDateTime(tx.createdAt)}
লেনদেনের ধরন : ${typeLabel}
ব্যক্তি/প্রতিষ্ঠান : ${tx.counterpartyName}
মোবাইল নম্বর : ${tx.counterpartyPhone || 'প্রযোজ্য নয়'}

------------------------------------------------
টাকার পরিমাণ : ৳ ${tx.amount.toLocaleString('en-US')}
ক্যাশআউট ফি  : ৳ ${tx.charge || 0}
নেট প্রভাব   : ${isIncoming ? '+' : '-'} ৳ ${Math.abs(tx.netAmount).toLocaleString('en-US')}
পরবর্তী ব্যালেন্স: ৳ ${tx.newBalance.toLocaleString('en-US')}
------------------------------------------------
মন্তব্য/নোট   : ${tx.notes || 'কোনো মন্তব্য নেই'}
================================================
মেসার্স কোরাইশ ট্রেডার্স ব্যবহারের জন্য ধন্যবাদ।
================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bkash_Receipt_${tx.trxId}_${tx.amount}tk.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter transactions
  const filteredTxs = bkashTransactions.filter((tx) => {
    const matchesFilter = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      tx.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.counterpartyPhone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-24 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      {/* Header and Recorded Balance Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-pink-950/60 via-slate-900 to-slate-900 border border-pink-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-950/60 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                <span>বিকাশ বিজনেস লেজার খাতা</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                  অফিসিয়াল bKash সহায়ক
                </span>
              </h1>
              <p className="text-xs text-slate-400">ব্যবসায়িক বিকাশ লেনদেন হিসাব ও ব্যালেন্স ট্র্যাকার</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">রেকর্ডকৃত বর্তমান বিকাশ ব্যালেন্স</p>
              <p className="text-xl sm:text-2xl font-extrabold text-pink-400 tracking-tight">
                {formatTaka(currentBkashBalance)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearAllBkash}
                className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/60 cursor-pointer transition-all border border-rose-500/40"
                title="সকল বিকাশ লেনদেন মুছে ব্যালেন্স ০০ করুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব বিকাশ ০০ করুন</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmount('');
                  setTrxId('');
                  setCounterpartyName('');
                  setCounterpartyPhone('');
                  setNotes('');
                  setShowAddModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-950/60 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন বিকাশ এন্ট্রি</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Non-Custodial Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">নিরাপত্তা সতর্কতা:</strong> এই অ্যাপে কখনই আপনার বিকাশ পিন (PIN) বা OTP চাইবে না এবং দেওয়া নিষেধ। এটি দোকানের নিজস্ব হিসাব খাতা, বাস্তব বিকাশ অ্যাপের সাথে ব্যালেন্স মিলিয়ে হিসাব নির্ভুল রাখুন।
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, মোবাইল বা TrxID দিয়ে বিকাশ লেনদেন খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'সকল' },
            { id: 'CUSTOMER_PAYMENT', label: 'কাস্টমার পেমেন্ট' },
            { id: 'MONEY_RECEIVED', label: 'টাকা গ্রহণ' },
            { id: 'MONEY_SENT', label: 'টাকা পাঠানো' },
            { id: 'SUPPLIER_PAYMENT', label: 'মহাজন পরিশোধ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-pink-600 text-white font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTxs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
            কোনো বিকাশ লেনদেন পাওয়া যায়নি (ব্যালেন্স ৳০)। "নতুন বিকাশ এন্ট্রি" বাটনে চাপুন।
          </div>
        ) : (
          filteredTxs.map((tx) => {
            const isIncoming = tx.type === 'MONEY_RECEIVED' || tx.type === 'CUSTOMER_PAYMENT';

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isIncoming
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isIncoming ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-100 text-sm">{tx.counterpartyName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-pink-300 border border-slate-700">
                        {tx.trxId}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {tx.counterpartyPhone ? `${tx.counterpartyPhone} • ` : ''}
                      {tx.notes || (isIncoming ? 'টাকা প্রাপ্তি' : 'টাকা পরিশোধ')}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatDateTime(tx.createdAt)}
                      {tx.charge > 0 ? ` • ক্যাশআউট চার্জ: ${formatTaka(tx.charge)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto text-right flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div>
                    <p
                      className={`text-sm sm:text-base font-extrabold ${
                        isIncoming ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncoming ? '+' : '-'}
                      {formatTaka(tx.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ব্যালেন্স: <span className="text-slate-300 font-bold">{formatTaka(tx.newBalance)}</span>
                    </p>
                  </div>

                  {/* Actions: Download Receipt & Delete Transaction */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(tx)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer"
                      title="এই লেনদেনের রসিদ ডাউনলোড করুন"
                    >
                      <Download className="w-3.5 h-3.5 text-pink-400" />
                      <span>রসিদ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`TrxID: ${tx.trxId} লেনদেনটি সম্পূর্ণ মুছে ফেলতে চান?`)) {
                          deleteBkashTransaction(tx.id);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 active:scale-95 text-rose-400 border border-rose-500/30 flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer"
                      title="লেনদেন মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ডিলিট</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add bKash Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-pink-500/30 rounded-3xl p-5 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto">
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-pink-400" />
              <span>নতুন বিকাশ লেনদেন রেকর্ড</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">ব্যবসায়িক বিকাশ এন্ট্রি সংরক্ষণ করুন</p>

            <form onSubmit={handleSaveTx} className="space-y-3 text-xs">
              {/* Type selector */}
              <div>
                <label className="text-slate-400 block mb-1">লেনদেনের ধরন:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CUSTOMER_PAYMENT', label: 'কাস্টমার পেমেন্ট (+)' },
                    { id: 'MONEY_RECEIVED', label: 'টাকা গ্রহণ (+)' },
                    { id: 'SUPPLIER_PAYMENT', label: 'মহাজন পরিশোধ (-)' },
                    { id: 'MONEY_SENT', label: 'টাকা পাঠানো (-)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTxType(t.id as BkashTxType)}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                        txType === t.id
                          ? 'bg-pink-600/30 border-pink-500 text-pink-200'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input: string state to prevent stuck at 1 */}
              <div>
                <label className="text-slate-400 block mb-1">টাকার পরিমাণ (৳):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="যেমন: 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-extrabold text-base focus:border-pink-500 focus:outline-none"
                  required
                />
                {/* Quick amount buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['500', '1000', '2000', '5000', '10000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-pink-300 font-bold text-xs active:scale-95 transition-all"
                    >
                      +৳{toBnDigits(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* TrxID */}
              <div>
                <label className="text-slate-400 block mb-1">bKash TrxID (লেনদেন আইডি):</label>
                <input
                  type="text"
                  placeholder="যেমন: BKA992341A (খালি রাখলে স্বয়ংক্রিয় বসবে)"
                  value={trxId}
                  onChange={(e) => handleTrxIdChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs uppercase focus:border-pink-500 focus:outline-none"
                />
                {duplicateWarning && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    সতর্কতা: এই TrxID ইতিমধ্যে ডাটাবেসে বিদ্যমান!
                  </p>
                )}
              </div>

              {/* Counterparty Name & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">ব্যক্তি / প্রতিষ্ঠানের নাম:</label>
                  <input
                    type="text"
                    placeholder="নাম"
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">মোবাইল নম্বর:</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="017xxxxxxxx"
                    value={counterpartyPhone}
                    onChange={(e) => setCounterpartyPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Cash out charge rate if money sent */}
              {(txType === 'MONEY_SENT' || txType === 'CASH_OUT_CHARGE') && (
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 font-semibold">ক্যাশআউট চার্জ হিসাব:</p>
                    <p className="text-[10px] text-slate-400">
                      হার: {toBnDigits(chargeRate)}% (চার্জ: {formatTaka(calculatedCharge)})
                    </p>
                  </div>
                  <select
                    value={chargeRate}
                    onChange={(e) => setChargeRate(parseFloat(e.target.value))}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value={1.49}>অ্যাপ (১.৪৯%)</option>
                    <option value={1.85}>USSD (১.৮৫%)</option>
                    <option value={0}>চার্জ নেই (০%)</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-slate-400 block mb-1">বিবরণ বা নোট:</label>
                <input
                  type="text"
                  placeholder="যেমন: ৫০ বস্তা সিমেন্টের আংশিক বিল"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold shadow-md shadow-pink-950/60 transition-all active:scale-95"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
