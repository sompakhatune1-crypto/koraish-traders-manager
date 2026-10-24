import React, { useState } from 'react';
import {
  Users,
  Building2,
  Plus,
  Search,
  Phone,
  MapPin,
  Banknote,
  Smartphone,
  CreditCard,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  History,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, Supplier, LedgerEntry } from '../types';
import { formatTaka, toBnDigits, formatDateTime } from '../utils/formatters';

export const LedgerView: React.FC = () => {
  const {
    customers,
    suppliers,
    ledgerEntries,
    addCustomer,
    addSupplier,
    recordCustomerPayment,
    recordSupplierPayment,
    totalCustomerDue,
    totalSupplierPayable,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<Customer | Supplier | null>(null);
  const [showStatementModal, setShowStatementModal] = useState<boolean>(false);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'BANK'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // New Customer/Supplier Form
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [newCompany, setNewCompany] = useState<string>('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenPayment = (entity: Customer | Supplier) => {
    setSelectedEntity(entity);
    const due = 'totalDue' in entity ? entity.totalDue : entity.totalPayable;
    setPaymentAmount(due > 0 ? due : 5000);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleOpenStatement = (entity: Customer | Supplier) => {
    setSelectedEntity(entity);
    setShowStatementModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity || paymentAmount <= 0) return;

    if (activeTab === 'customers') {
      recordCustomerPayment(selectedEntity.id, paymentAmount, paymentMethod, paymentNotes);
    } else {
      recordSupplierPayment(selectedEntity.id, paymentAmount, paymentMethod, paymentNotes);
    }

    setShowPaymentModal(false);
    setSelectedEntity(null);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setShowAddCustomerModal(false);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addSupplier({
      name: newName.trim(),
      phone: newPhone.trim(),
      company: newCompany.trim() || newName.trim(),
      address: newAddress.trim(),
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewCompany('');
    setShowAddSupplierModal(false);
  };

  // Statement entries for selected entity
  const statementEntries = selectedEntity
    ? ledgerEntries.filter((l) => l.entityId === selectedEntity.id)
    : [];

  return (
    <div className="space-y-4 pb-24 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      {/* Header and Aggregate Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>ব্যবসায়িক লেজার ও বাকি খাতা</span>
          </h1>
          <p className="text-xs text-slate-400">কাস্টমার বাকি এবং মহাজন দেনার পূর্ণাঙ্গ লেজার</p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>কাস্টমার খাতা ({toBnDigits(customers.length)})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>মহাজন খাতা ({toBnDigits(suppliers.length)})</span>
          </button>
        </div>
      </div>

      {/* Aggregate Due Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">
            {activeTab === 'customers' ? 'সকল কাস্টমারের মোট বাকি (পাব)' : 'সকল মহাজনের মোট দেনা (পরিশোধযোগ্য)'}
          </p>
          <p
            className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${
              activeTab === 'customers' ? 'text-rose-400' : 'text-orange-400'
            }`}
          >
            {formatTaka(activeTab === 'customers' ? totalCustomerDue : totalSupplierPayable)}
          </p>
        </div>

        <button
          onClick={() =>
            activeTab === 'customers' ? setShowAddCustomerModal(true) : setShowAddSupplierModal(true)
          }
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'customers' ? 'নতুন কাস্টমার' : 'নতুন মহাজন'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === 'customers'
              ? 'কাস্টমারের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন...'
              : 'মহাজন, কোম্পানি বা মোবাইল নম্বর দিয়ে খুঁজুন...'
          }
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeTab === 'customers' ? (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{cust.name}</h3>
                    {cust.phone && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{cust.phone}</span>
                      </p>
                    )}
                    {cust.address && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{cust.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">বর্তমান বাকি</span>
                    <span
                      className={`text-base font-extrabold ${
                        cust.totalDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatTaka(cust.totalDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenPayment(cust)}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>টাকা আদায়</span>
                </button>
                <button
                  onClick={() => handleOpenStatement(cust)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>হিসাব খাতা</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          filteredSuppliers.map((supp) => (
            <div
              key={supp.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{supp.name}</h3>
                    {supp.company && (
                      <p className="text-[11px] text-slate-400">{supp.company}</p>
                    )}
                    {supp.phone && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{supp.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">বর্তমান পাওনা</span>
                    <span
                      className={`text-base font-extrabold ${
                        supp.totalPayable > 0 ? 'text-orange-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatTaka(supp.totalPayable)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenPayment(supp)}
                  className="flex-1 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>বিল পরিশোধ</span>
                </button>
                <button
                  onClick={() => handleOpenStatement(supp)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>হিসাব খাতা</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Collection / Pay Supplier Modal */}
      {showPaymentModal && selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1">
              {activeTab === 'customers' ? 'কাস্টমার বকেয়া টাকা আদায়' : 'মহাজন বিল পরিশোধ'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">{selectedEntity.name}</p>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">টাকার পরিমাণ (৳):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-extrabold text-base text-slate-100 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">পরিশোধ মাধ্যম:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'নগদ ক্যাশ' },
                    { id: 'BKASH', label: 'বিকাশ' },
                    { id: 'BANK', label: 'ব্যাংক চেক' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 rounded-xl border font-semibold ${
                        paymentMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">মন্তব্য বা রেফারেন্স:</label>
                <input
                  type="text"
                  placeholder="যেমন: ৫০ বস্তা সিমেন্টের বকেয়া পরিশোধ"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatementModal && selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-100">{selectedEntity.name} - খতিয়ান</h2>
                <p className="text-xs text-slate-400">
                  {selectedEntity.phone} • বর্তমান ব্যালেন্স:{' '}
                  <span className="font-bold text-emerald-400">
                    {formatTaka('totalDue' in selectedEntity ? selectedEntity.totalDue : selectedEntity.totalPayable)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowStatementModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-800 py-2">
              {statementEntries.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                </p>
              ) : (
                statementEntries.map((entry) => (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{entry.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatDateTime(entry.date)} {entry.paymentMethod ? `• মাধ্যম: ${entry.paymentMethod}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      {entry.debit > 0 && (
                        <p className="text-rose-400 font-bold">যোগ: +{formatTaka(entry.debit)}</p>
                      )}
                      {entry.credit > 0 && (
                        <p className="text-emerald-400 font-bold">জমা: -{formatTaka(entry.credit)}</p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        অবশিষ্ট: {formatTaka(entry.balanceAfter)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-3">নতুন কাস্টমার নিবন্ধন</h2>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">কাস্টমার / ঠিকাদারের নাম:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ইঞ্জিঃ আসাদুল ইসলাম"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">মোবাইল নম্বর:</label>
                <input
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ঠিকানা বা কাজের এলাকা:</label>
                <input
                  type="text"
                  placeholder="গ্রাম বা বাজার এলাকা"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowAddSupplierModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-3">নতুন মহাজন / ডিলার যুক্ত করুন</h2>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">মহাজন / এজেন্সির নাম:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পদ্মা সিমেন্ট ট্রেডার্স"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">কোম্পানি বা ব্র্যান্ড ডিলারশিপ:</label>
                <input
                  type="text"
                  placeholder="যেমন: শাহ ও ফ্রেশ সিমেন্ট ডিস্ট্রিবিউটর"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">মোবাইল নম্বর:</label>
                <input
                  type="tel"
                  placeholder="018xxxxxxxx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ডিপো বা ঘাটের ঠিকানা:</label>
                <input
                  type="text"
                  placeholder="ডিপো বা ঘাটের এলাকা"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
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
