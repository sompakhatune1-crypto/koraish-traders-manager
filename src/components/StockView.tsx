import React, { useState } from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  History,
  Check,
  X,
  Edit2,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CementProduct, StockMovement } from '../types';
import { formatTaka, toBnDigits, formatBags, formatDateTime } from '../utils/formatters';

export const StockView: React.FC = () => {
  const {
    products,
    stockMovements,
    addStockAdjustment,
    addNewProduct,
    updateProduct,
    totalStockBags,
    totalStockValue,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<CementProduct | null>(null);

  // Adjustment form state
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'OPENING' | 'DAMAGE' | 'ADJUSTMENT'>('OPENING');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // New brand form state
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [newProductType, setNewProductType] = useState<string>('PCC');
  const [newStock, setNewStock] = useState<number>(100);
  const [newPurchasePrice, setNewPurchasePrice] = useState<number>(510);
  const [newSalePrice, setNewSalePrice] = useState<number>(550);
  const [newMinAlert, setNewMinAlert] = useState<number>(30);

  const filteredProducts = products.filter((p) =>
    p.brandName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdjust = (prod: CementProduct, defaultType: 'OPENING' | 'DAMAGE' | 'ADJUSTMENT' = 'OPENING') => {
    setSelectedProduct(prod);
    setAdjustType(defaultType);
    setAdjustQty(defaultType === 'DAMAGE' ? 5 : 50);
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQty <= 0) return;

    const actualQty = adjustType === 'DAMAGE' ? -adjustQty : adjustQty;

    addStockAdjustment({
      productId: selectedProduct.id,
      quantity: actualQty,
      type: adjustType,
      pricePerBag: selectedProduct.avgPurchasePrice,
      notes: adjustNotes || (adjustType === 'DAMAGE' ? 'বস্তা ফেটে নষ্ট বা ক্ষতিপূরণ' : 'স্টক সমন্বয়'),
    });

    setShowAdjustModal(false);
    setSelectedProduct(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    addNewProduct({
      brandName: newBrandName.trim(),
      productType: newProductType,
      bagWeightKg: 50,
      currentStock: Number(newStock) || 0,
      minStockAlert: Number(newMinAlert) || 25,
      avgPurchasePrice: Number(newPurchasePrice) || 500,
      defaultSalePrice: Number(newSalePrice) || 540,
      isActive: true,
    });

    setNewBrandName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 pb-24 max-w-7xl mx-auto px-3 sm:px-4 pt-3">
      {/* Header and Aggregate Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>সিমেন্ট ইনভেন্টরি ও স্টক ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            মোট স্টক: <span className="text-emerald-400 font-bold">{formatBags(totalStockBags)}</span> | মোট মূল্য: <span className="text-amber-300 font-bold">{formatTaka(totalStockValue)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer active:scale-95 transition-all"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>মুভমেন্ট খাতা</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/60 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্র্যান্ড</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ব্র্যান্ডের নাম দিয়ে খুঁজুন (যেমন: শাহ, ক্রাউন, বসুন্ধরা)..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map((prod) => {
          const isLow = prod.currentStock <= prod.minStockAlert;
          const stockValuation = prod.currentStock * prod.avgPurchasePrice;

          return (
            <div
              key={prod.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isLow
                  ? 'bg-slate-900 border-amber-500/40 shadow-amber-950/20 shadow-md'
                  : 'bg-slate-900/90 border-slate-800 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{prod.brandName}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {prod.productType} • ৫০ কেজি ব্যাগ
                    </p>
                  </div>
                  {isLow ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      লো স্টক
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
                      পর্যাপ্ত
                    </span>
                  )}
                </div>

                <div className="my-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">বর্তমান স্টক</p>
                    <p className={`text-xl font-extrabold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatBags(prod.currentStock)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">স্টক মূল্য</p>
                    <p className="text-sm font-bold text-slate-200">{formatTaka(stockValuation)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-3">
                  <div className="p-2 rounded-lg bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">বিক্রয় মূল্য</span>
                    <span className="font-bold text-slate-100">{formatTaka(prod.defaultSalePrice)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">ক্রয় দর (গড়)</span>
                    <span className="font-bold text-slate-100">{formatTaka(prod.avgPurchasePrice)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenAdjust(prod, 'OPENING')}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>স্টক যোগ</span>
                </button>
                <button
                  onClick={() => handleOpenAdjust(prod, 'DAMAGE')}
                  className="flex-1 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>নষ্ট / ক্ষতি</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1">
              {adjustType === 'DAMAGE' ? 'নষ্ট সিমেন্ট সমন্বয়' : 'স্টক যোগ বা সমন্বয়'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">{selectedProduct.brandName}</p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">সমন্বয়ের ধরন:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('OPENING')}
                    className={`py-1.5 rounded-xl border font-semibold ${
                      adjustType === 'OPENING'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    স্টক যোগ (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DAMAGE')}
                    className={`py-1.5 rounded-xl border font-semibold ${
                      adjustType === 'DAMAGE'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    নষ্ট / ফাটা (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT')}
                    className={`py-1.5 rounded-xl border font-semibold ${
                      adjustType === 'ADJUSTMENT'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    সংশোধন
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">বস্তার পরিমাণ:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">মন্তব্য (ঐচ্ছিক):</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="যেমন: ট্রাক আনলোডের সময় ৫ বস্তা ফেটে গেছে"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-950/60"
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Brand Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-3">নতুন সিমেন্ট ব্রান্ড যুক্ত করুন</h2>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">সিমেন্ট ব্র্যান্ডের নাম:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ডায়মন্ড সিমেন্ট (Diamond Cement)"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">টাইপ:</label>
                  <input
                    type="text"
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">প্রাথমিক স্টক (বস্তা):</label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">ক্রয় দর (টাকা):</label>
                  <input
                    type="number"
                    min="1"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">বিক্রয় দর (টাকা):</label>
                  <input
                    type="number"
                    min="1"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-950/60"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <span>সিমেন্ট স্টক মুভমেন্ট অডিট লগ</span>
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-800 py-2">
              {stockMovements.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  এখনও কোনো স্টক মুভমেন্ট রেকর্ড হয়নি।
                </p>
              ) : (
                stockMovements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{mov.brandName}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isPositive
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {mov.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(mov.createdAt)} {mov.notes ? `• ${mov.notes}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-extrabold text-sm ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {toBnDigits(mov.quantity)} বস্তা
                        </span>
                        <p className="text-[10px] text-slate-400">
                          অবশিষ্ট: {toBnDigits(mov.newStock)} বস্তা
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
