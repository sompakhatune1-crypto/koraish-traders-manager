import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  UserCheck,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SaleTransaction, PaymentMethod } from '../types';
import { formatTaka, toBnDigits, formatDateTime, formatBags } from '../utils/formatters';

interface SalesViewProps {
  onPrintInvoice: (sale: SaleTransaction) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onPrintInvoice }) => {
  const {
    products,
    customers,
    sales,
    recordSale,
    reverseSaleTransaction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'new_sale' | 'history'>('new_sale');

  // New Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('খুচরা ক্রেতা');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [cartItems, setCartItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >([{ productId: products[0]?.id || '', quantity: 1, unitPrice: products[0]?.defaultSalePrice || 550 }]);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [bkashTrxId, setBkashTrxId] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successSale, setSuccessSale] = useState<SaleTransaction | null>(null);

  // Search History
  const [historySearch, setHistorySearch] = useState<string>('');

  // Cart calculations
  const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const netAmount = Math.max(0, totalAmount - (discountAmount || 0));
  const dueAmount = Math.max(0, netAmount - (paidAmount || 0));

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) {
      setCustomerName('খুচরা ক্রেতা');
      setCustomerPhone('');
      return;
    }
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || '');
    }
  };

  const handleAddItem = () => {
    const unselected = products.find((p) => !cartItems.some((ci) => ci.productId === p.id)) || products[0];
    if (unselected) {
      setCartItems((prev) => [
        ...prev,
        { productId: unselected.id, quantity: 10, unitPrice: unselected.defaultSalePrice },
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
            unitPrice: prod?.defaultSalePrice || item.unitPrice,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessSale(null);

    const res = recordSale({
      customerName,
      customerPhone,
      customerId: selectedCustomerId || null,
      items: cartItems,
      discountAmount,
      paidAmount,
      paymentMethod,
      bkashTrxId: paymentMethod === 'BKASH' ? bkashTrxId : undefined,
      notes: saleNotes,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'বিক্রয় সম্পন্ন করা যায়নি।');
    } else {
      setSuccessSale(res.sale!);
      // Reset cart
      setCartItems([
        { productId: products[0]?.id || '', quantity: 10, unitPrice: products[0]?.defaultSalePrice || 550 },
      ]);
      setDiscountAmount(0);
      setPaidAmount(0);
      setSaleNotes('');
      setBkashTrxId('');
    }
  };

  const handleReverseSale = (saleId: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই বিক্রয়টি বাতিল করে স্টক ফেরত নিতে চান?')) {
      const res = reverseSaleTransaction(saleId);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const filteredHistory = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.customerName.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-24 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      {/* Header and Mode Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <span>সিমেন্ট বিক্রয় টার্মিনাল ও ক্যাশ মেমো</span>
          </h1>
          <p className="text-xs text-slate-400">দ্রুত বিক্রয়, বাকি হিসাব এবং চালান প্রিন্ট</p>
        </div>

        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('new_sale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'new_sale'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            নতুন বিক্রি
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            বিক্রয় খাতা
          </button>
        </div>
      </div>

      {activeTab === 'new_sale' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Sale Form */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleSubmitSale} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              {/* Customer Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    কাস্টমার নির্বাচন করুন:
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">খুচরা ক্রেতা (ক্যাশ মেমো)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.totalDue > 0 ? `(বাকি: ৳${toBnDigits(c.totalDue)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ক্রেতার নাম ও মোবাইল:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="নাম"
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="মোবাইল নম্বর"
                      className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cement Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">সিমেন্ট আইটেম সমূহ:</span>
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
                  {cartItems.map((item, index) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const isOverselling = prod ? item.quantity > prod.currentStock : false;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2 text-xs ${
                          isOverselling
                            ? 'bg-rose-500/10 border-rose-500/40'
                            : 'bg-slate-850 bg-slate-800/60 border-slate-700/60'
                        }`}
                      >
                        {/* Product dropdown */}
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="text-[10px] text-slate-400 block mb-0.5">সিমেন্ট ব্র্যান্ড:</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-semibold"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.brandName} (স্টক: {toBnDigits(p.currentStock)} বস্তা)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-full sm:w-28">
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            বস্তা: {prod ? `(মজুদ: ${toBnDigits(prod.currentStock)})` : ''}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={prod?.currentStock || 1000}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))
                            }
                            className={`w-full px-2.5 py-1.5 bg-slate-900 border rounded-lg font-bold ${
                              isOverselling ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-slate-100'
                            }`}
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="w-full sm:w-28">
                          <label className="text-[10px] text-slate-400 block mb-0.5">দর (প্রতি বস্তা):</label>
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

                        {/* Subtotal */}
                        <div className="w-full sm:w-24 text-right">
                          <label className="text-[10px] text-slate-400 block mb-0.5">মোট মূল্য:</label>
                          <p className="font-bold text-emerald-400 text-sm mt-1">
                            {formatTaka(item.quantity * item.unitPrice)}
                          </p>
                        </div>

                        {/* Remove */}
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
                    );
                  })}
                </div>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">মন্তব্য বা ডেলিভারি তথ্য (ঐচ্ছিক):</label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="যেমন: ট্রাক নং ঢাকা মেট্রো-ট ১২৩৪, ড্রাইভার রহিম"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>বিক্রয় নিশ্চিত করুন ও মেমো তৈরি করুন</span>
              </button>
            </form>
          </div>

          {/* Payment & Calculation Sidebar */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
              <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
                হিসাব ও পেমেন্ট বিবরণ
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>মোট সিমেন্ট মূল্য:</span>
                  <span className="font-bold text-slate-100">{formatTaka(totalAmount)}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">ছাড় (ডিসকাউন্ট):</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right font-bold text-slate-100 text-xs"
                  />
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-emerald-400">{formatTaka(netAmount)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">পরিশোধের মাধ্যম:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'নগদ ক্যাশ', icon: Banknote },
                    { id: 'BKASH', label: 'বিকাশ (bKash)', icon: Smartphone },
                    { id: 'BANK', label: 'ব্যাংক চেক', icon: CreditCard },
                    { id: 'CREDIT', label: 'পুরো বাকি', icon: UserCheck },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id as PaymentMethod);
                          if (m.id === 'CREDIT') setPaidAmount(0);
                          else if (paidAmount === 0) setPaidAmount(netAmount);
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* bKash TrxID if selected */}
              {paymentMethod === 'BKASH' && (
                <div className="p-2.5 rounded-xl bg-pink-900/20 border border-pink-500/30">
                  <label className="text-[11px] text-pink-300 block mb-1">বিকাশ TrxID (ঐচ্ছিক):</label>
                  <input
                    type="text"
                    value={bkashTrxId}
                    onChange={(e) => setBkashTrxId(e.target.value)}
                    placeholder="যেমন: BKA992381"
                    className="w-full px-2.5 py-1 bg-slate-900 border border-pink-500/40 rounded text-xs text-pink-100"
                  />
                </div>
              )}

              {/* Paid and Due Amount */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">জমা (পরিশোধ):</span>
                  <input
                    type="number"
                    min="0"
                    max={netAmount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right font-extrabold text-slate-100 text-sm focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">অবশিষ্ট বাকি (Due):</span>
                  <span className={`font-bold ${dueAmount > 0 ? 'text-rose-400 text-sm' : 'text-slate-400'}`}>
                    {formatTaka(dueAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Invoice Popup Callout */}
            {successSale && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">বিক্রয় সফলভাবে সম্পন্ন হয়েছে!</p>
                <p className="text-xs text-slate-300">
                  চালান নম্বর: <span className="font-bold">{successSale.invoiceNumber}</span>
                </p>
                <button
                  type="button"
                  onClick={() => onPrintInvoice(successSale)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>ক্যাশ মেমো প্রিন্ট / দেখুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="চালান নম্বর বা কাস্টমারের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2.5">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              filteredHistory.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{sale.customerName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {sale.invoiceNumber}
                      </span>
                      {sale.status === 'REVERSED' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                          বাতিলকৃত
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sale.items.map((i) => `${toBnDigits(i.quantity)} বস্তা ${i.brandName}`).join(', ')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formatDateTime(sale.createdAt)} • মাধ্যম: {sale.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-emerald-400">{formatTaka(sale.netAmount)}</p>
                      {sale.dueAmount > 0 && (
                        <p className="text-[10px] text-rose-400 font-semibold">
                          বাকি: {formatTaka(sale.dueAmount)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrintInvoice(sale)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="মেমো প্রিন্ট"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {sale.status !== 'REVERSED' && (
                        <button
                          onClick={() => handleReverseSale(sale.id)}
                          className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300"
                          title="বিক্রয় বাতিল ও স্টক ফেরত"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
