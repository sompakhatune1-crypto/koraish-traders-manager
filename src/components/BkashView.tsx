import React, { useState, useMemo } from 'react';
import { Smartphone, ArrowDownLeft, ArrowUpRight, Plus, Search, AlertCircle, ShieldCheck, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BkashTxType } from '../types';
import { formatTaka, toBnDigits, formatDateTime } from '../utils/formatters';

export const BkashView: React.FC = () => {
  const { bkashTransactions, currentBkashBalance, recordBkashEntry } = useApp() as any;
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [txType, setTxType] = useState<BkashTxType>('CUSTOMER_PAYMENT');
  // FIX 1: amount এখন string, তাই ফাঁকা করলেও 1 হবে না
  const [amount, setAmount] = useState<string>('5000');
  const [trxId, setTrxId] = useState<string>('');
  const [counterpartyName, setCounterpartyName] = useState<string>('');
  const [counterpartyPhone, setCounterpartyPhone] = useState<string>('');
  const [chargeRate, setChargeRate] = useState<number>(1.49);
  const [notes, setNotes] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);

  const calculatedCharge = useMemo(() => {
    if (txType === 'CASH_OUT_CHARGE' || txType === 'MONEY_SENT') {
      const num = parseInt(amount) || 0;
      return Math.round((num * chargeRate) / 100);
    }
    return 0;
  }, [amount, chargeRate, txType]);

  const handleTrxIdChange = (id: string) => {
    setTrxId(id);
    if (id.trim().length > 4) {
      const exists = bkashTransactions.some((t: any) => t.trxId.toLowerCase() === id.trim().toLowerCase());
      setDuplicateWarning(exists);
    } else {
      setDuplicateWarning(false);
    }
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount) || 0;
    if (numAmount <= 0) return;
    recordBkashEntry({
      trxId: trxId.trim() || 'BKA' + Math.floor(100000 + Math.random() * 900000),
      type: txType,
      amount: numAmount,
      charge: calculatedCharge,
      counterpartyName: counterpartyName || (txType === 'CUSTOMER_PAYMENT' ? 'কাস্টমার' : 'ব্যবসায়িক খরচ'),
      counterpartyPhone: counterpartyPhone || '',
      notes,
    });
    setShowAddModal(false);
    setTrxId(''); setAmount('1000'); setNotes(''); setCounterpartyName(''); setCounterpartyPhone(''); setDuplicateWarning(false);
  };

  // FIX 2: ডিলিট ফাংশন - AppContext এ না থাকলেও localStorage থেকে ডিলিট হবে
  const handleDelete = (id: string, trxId: string) => {
    if (!confirm(`TrxID ${trxId} ডিলিট করলে ব্যালেন্স আবার হিসাব হবে। নিশ্চিত?`)) return;
    const anyApp = useApp() as any;
    if (anyApp.deleteBkashEntry) {
      anyApp.deleteBkashEntry(id);
    } else {
      // Fallback: localStorage থেকে সরাসরি ডিলিট
      const saved = JSON.parse(localStorage.getItem('koraish_bkash') || '[]');
      const filtered = saved.filter((t: any) => t.id !== id);
      localStorage.setItem('koraish_bkash', JSON.stringify(filtered));
      // AppContext এর key খুঁজে ডিলিট
      Object.keys(localStorage).forEach(k => {
        if (k.includes('bkash')) {
          try {
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(arr)) {
              localStorage.setItem(k, JSON.stringify(arr.filter((t: any) => t.id !== id)));
            }
          } catch {}
        }
      });
      alert("ডিলিট হয়েছে, পেজ রিলোড হচ্ছে...");
      location.reload();
    }
  };

  const handleClearAll = () => {
    if (!confirm("সব বিকাশ টেস্ট লেনদেন ডিলিট করে ব্যালেন্স ০ করতে চান? এইটা করলে হিসাব ঠিক হয়ে যাবে।")) return;
    Object.keys(localStorage).forEach(k => {
      if (k.toLowerCase().includes('bkash')) localStorage.removeItem(k);
    });
    location.reload();
  };

  const filteredTxs = bkashTransactions.filter((tx: any) => {
    const matchesFilter = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch = tx.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase()) || tx.trxId.toLowerCase().includes(searchQuery.toLowerCase()) || tx.counterpartyPhone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-24 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-pink-950/60 via-slate-900 to-slate-900 border border-pink-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white"><Smartphone className="w-6 h-6" /></div>
            <div>
              <h1 className="text-base font-bold text-slate-100">বিকাশ বিজনেস লেজার খাতা</h1>
              <p className="text-xs text-slate-400">ব্যালেন্স ট্র্যাকার</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400">রেকর্ডকৃত ব্যালেন্স</p>
              <p className="text-xl font-extrabold text-pink-400">{formatTaka(currentBkashBalance)}</p>
              <button onClick={handleClearAll} className="text-[10px] text-red-400 underline mt-1">সব ডিলিট ০ করুন</button>
            </div>
            <button onClick={() => setShowAddModal(true)} className="px-3.5 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs flex items-center gap-1"><Plus className="w-4 h-4" />নতুন এন্ট্রি</button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 text-[11px] text-slate-400"><ShieldCheck className="w-4 h-4 text-emerald-400" />পিন/OTP চাইবে না, শুধু হিসাবের খাতা</div>
      </div>

      <div className="flex gap-2.5">
        <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="নাম, TrxID..." className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white" /></div>
      </div>

      <div className="space-y-2.5">
        {filteredTxs.map((tx: any) => {
          const isIncoming = tx.type === 'MONEY_RECEIVED' || tx.type === 'CUSTOMER_PAYMENT';
          return (
            <div key={tx.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between gap-3 text-xs">
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isIncoming ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{isIncoming ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}</div>
                <div>
                  <div className="flex gap-2"><span className="font-bold text-slate-100">{tx.counterpartyName}</span><span className="px-1.5 py-0.5 rounded bg-slate-800 text-pink-300 font-mono">{tx.trxId}</span></div>
                  <p className="text-[11px] text-slate-400">{tx.notes}</p>
                  <p className="text-[10px] text-slate-500">{formatDateTime(tx.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-extrabold ${isIncoming ? 'text-emerald-400' : 'text-rose-400'}`}>{isIncoming ? '+' : '-'} {formatTaka(tx.amount)}</p>
                <p className="text-[10px]">ব্যালেন্স: {formatTaka(tx.newBalance)}</p>
                <button onClick={() => handleDelete(tx.id, tx.trxId)} className="mt-1 px-2 py-1 bg-red-900/30 text-red-400 rounded flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" />ডিলিট</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-pink-500/30 rounded-3xl p-5">
            <h2 className="font-bold mb-3">নতুন বিকাশ লেনদেন</h2>
            <form onSubmit={handleSaveTx} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'CUSTOMER_PAYMENT', label: 'কাস্টমার পেমেন্ট (+)' }, { id: 'MONEY_RECEIVED', label: 'টাকা প্রাপ্তি (+)' }, { id: 'SUPPLIER_PAYMENT', label: 'মহাজন পরিশোধ (-)' }, { id: 'MONEY_SENT', label: 'টাকা পাঠানো (-)' }].map((t) => (
                  <button key={t.id} type="button" onClick={() => setTxType(t.id as any)} className={`p-2 rounded-xl border ${txType === t.id ? 'bg-pink-600/30 border-pink-500 text-pink-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{t.label}</button>
                ))}
              </div>

              <div>
                <label className="text-slate-400 block mb-1">টাকার পরিমাণ (৳):</label>
                {/* FIX: type=text + replace */}
                <input type="text" inputMode="numeric" placeholder="যেমন: 500" required value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-extrabold text-base" />
                <div className="flex gap-1.5 mt-2">
                  {['500','1000','2000','5000'].map(v => (
                    <button key={v} type="button" onClick={()=>setAmount(v)} className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-xl">৳{v}</button>
                  ))}
                </div>
              </div>

              <div><label className="text-slate-400 block mb-1">TrxID:</label><input type="text" value={trxId} onChange={(e)=>handleTrxIdChange(e.target.value)} placeholder="BKA992341A" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl" />{duplicateWarning && <p className="text-amber-400 mt-1 flex gap-1"><AlertCircle className="w-3 h-3" />এই TrxID আছে!</p>}</div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="নাম" value={counterpartyName} onChange={(e)=>setCounterpartyName(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl" />
                <input type="tel" placeholder="017xxxxxxxx" value={counterpartyPhone} onChange={(e)=>setCounterpartyPhone(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl" />
              </div>
              <input type="text" placeholder="নোট" value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl" />
              <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-2 bg-slate-800 rounded-xl">বাতিল</button><button type="submit" className="flex-1 py-2 bg-pink-600 text-white rounded-xl font-bold">সংরক্ষণ</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
