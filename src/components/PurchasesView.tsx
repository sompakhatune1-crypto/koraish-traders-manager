import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentMethod } from '../types';
import { formatTaka, toBnDigits, formatDateTime, formatBags } from '../utils/formatters';

export const PurchasesView: React.FC = () => {
  const { products, suppliers, purchases, recordPurchase } = useApp();

  const [activeTab, setActiveTab] = useState<'new_purchase' | 'history'>('new_purchase');

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('ডিলার এজেন্সি');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [cartItems, setCartItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >([{ productId: products[0]?.id || '', quantity: 10, unitPrice: products[0]?.avgPurchasePrice || 510 }]);

  const [transportCost, setTransportCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string>('');

  const totalItemsCost = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalAmount = totalItemsCost + (transportCost || 0);
  const dueAmount = Math.max(0, totalAmount - (paidAmount || 0));

  const handleSupplierSelect = (id: string) => {
    setSelectedSupplierId(id);
    const supp = suppliers.find((s) => s.id === id);
    if (supp) {
      setSupplierName(supp.name);
      setSupplierPhone(supp.phone || '');
    }
  };

  const handleAddItem = () => {
    const unselected = products.find((p) => !cartItems.some((ci) => ci.productId === p.id)) || products[0];
    if (unselected) {
      setCartItems((prev) => [
        ...prev,
        { productId: unselected.id, quantity: 50, unitPrice: unselected.avgPurchasePrice },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (cartItems.length > 1) {
      setCartItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity' | 'unitPrice', value: any) => {
    setCartItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'productId') {
          const prod = products.find((p) => p.id === value);
          return {
            ...item,
            productId: value,
            unitPrice: prod?.avgPurchasePrice || item.unitPrice,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = recordPurchase({
      supplierName,
      supplierPhone,
      supplierId: selectedSupplierId || null,
      items: cartItems,
      transportCost,
      paidAmount,
      paymentMethod,
      notes: purchaseNotes,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'ক্রয় সম্পন্ন করা যায়নি।');
    } else {
      setSuccessMessage(`ক্রয় সফল হয়েছে! বিল #${res.purchase?.billNumber}`);
      setCartItems([
        { productId: products[0]?.id || '', quantity: 50, unitPrice: products[0]?.avgPurchasePrice || 510 },
      ]);
      setTransportCost(0);
      setPaidAmount(0);
      setPurchaseNotes('');
    }
  };

  const filteredPurchases = purchases.filter(
    (p) =>
      p.billNumber.toLowerCase().includes(searchHistory.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-24 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>সিমেন্ট ক্রয় ও মহাজন চালান</span>
          </h1>
          <p className="text-xs text-slate-400">নতুন চালান এন্ট্রি, পরিবহন খরচ ও স্টক বৃদ্ধি</p>
        </div>

        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('new_purchase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'new_purchase'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            নতুন ক্রয়
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ক্রয় খাতা ({toBnDigits(purchases.length)})
          </button>
        </div>
      </div>

      {activeTab === 'new_purchase' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleSubmitPurchase} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              {/* Supplier selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    সরবরাহকারী / ডিলার নির্বাচন:
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">নির্বাচন করুন...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.company ? `(${s.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ডিলারের নাম ও মোবাইল:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="মহাজনের নাম"
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="tel"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="মোবাইল নম্বর"
                      className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Cement Brands to purchase */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">ক্রয়কৃত সিমেন্ট আইটেম সমূহ:</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>আইটেম যোগ করুন</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {cartItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-center gap-2 text-xs"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="text-[10px] text-slate-400 block mb-0.5">সিমেন্ট ব্র্যান্ড:</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-semibold"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.brandName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="text-[10px] text-slate-400 block mb-0.5">বস্তা সংখ্যা:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-bold text-slate-100"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="text-[10px] text-slate-400 block mb-0.5">ক্রয় দর (প্রতি বস্তা):</label>
                        <input
                          type="number"
                          min="1"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'unitPrice', Math.max(1, parseFloat(e.target.value) || 0))
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-bold text-slate-100"
                        />
                      </div>

                      <div className="w-full sm:w-24 text-right">
                        <label className="text-[10px] text-slate-400 block mb-0.5">মোট দর:</label>
                        <p className="font-bold text-emerald-400 text-sm mt-1">
                          {formatTaka(item.quantity * item.unitPrice)}
                        </p>
                      </div>

                      {cartItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg mt-2 sm:mt-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">চালান নম্বর বা ড্রাফট নোট:</label>
                <input
                  type="text"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="যেমন: ঘাট থেকে ট্রাকে ডেলিভারি নং ৯৯৮১"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ক্রয় নিশ্চিত করুন ও স্টকে যোগ করুন</span>
              </button>
            </form>
          </div>

          {/* Pricing & Transport Sidebar */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
              <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
                ক্রয় খরচ ও পরিশোধ বিবরণ
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>সিমেন্ট মূল্য:</span>
                  <span className="font-bold text-slate-100">{formatTaka(totalItemsCost)}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">পরিবহন / লেবার খরচ:</span>
                  <input
                    type="number"
                    min="0"
                    value={transportCost}
                    onChange={(e) => setTransportCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right font-bold text-slate-100 text-xs"
                  />
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                  <span>সর্বমোট ক্রয় খরচ:</span>
                  <span className="text-emerald-400">{formatTaka(totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">পরিশোধ মাধ্যম:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                >
                  <option value="BANK">ব্যাংক স্থানান্তর / চেক</option>
                  <option value="CASH">নগদ ক্যাশ</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="CREDIT">পুরো বাকি (ডিলার বাকিতে)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">পরিশোধিত অর্থ:</span>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right font-extrabold text-slate-100 text-sm focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">মহাজন বাকি (দেনা):</span>
                  <span className={`font-bold ${dueAmount > 0 ? 'text-orange-400 text-sm' : 'text-slate-400'}`}>
                    {formatTaka(dueAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History */
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="বিল নম্বর বা মহাজনের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100"
            />
          </div>

          <div className="space-y-2.5">
            {filteredPurchases.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                কোনো ক্রয়ের রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              filteredPurchases.map((pur) => (
                <div
                  key={pur.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{pur.supplierName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-emerald-300">
                        {pur.billNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {pur.items.map((i) => `${toBnDigits(i.quantity)} বস্তা ${i.brandName}`).join(', ')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formatDateTime(pur.createdAt)} • মাধ্যম: {pur.paymentMethod}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-sm text-slate-100">{formatTaka(pur.totalAmount)}</p>
                    <p className="text-[10px] text-emerald-400">পরিশোধ: {formatTaka(pur.paidAmount)}</p>
                    {pur.dueAmount > 0 && (
                      <p className="text-[10px] text-orange-400 font-semibold">
                        বাকি: {formatTaka(pur.dueAmount)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
