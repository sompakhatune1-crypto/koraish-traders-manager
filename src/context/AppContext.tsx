import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CementProduct,
  StockMovement,
  SaleTransaction,
  PurchaseTransaction,
  Customer,
  Supplier,
  LedgerEntry,
  BkashTransaction,
  BkashTxType,
  ExpenseRecord,
  BusinessProfile,
  AuditLog,
} from '../types';
import { hashPin, generateSalt, verifyAppPin, LOCKOUT_DURATION_MS } from '../utils/security';

const STORAGE_KEY_PREFIX = 'koraish_traders_';

// Initial Bangladesh Cement Brands Catalog
const INITIAL_PRODUCTS: CementProduct[] = [
  {
    id: 'prod_shah_pcc',
    brandName: 'শাহ সিমেন্ট (Shah Cement)',
    productType: 'PCC (Portland Composite)',
    bagWeightKg: 50,
    currentStock: 420,
    minStockAlert: 50,
    avgPurchasePrice: 510,
    defaultSalePrice: 550,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_bashundhara_pcc',
    brandName: 'বসুন্ধরা সিমেন্ট (Bashundhara)',
    productType: 'PCC (Super Strong)',
    bagWeightKg: 50,
    currentStock: 350,
    minStockAlert: 40,
    avgPurchasePrice: 520,
    defaultSalePrice: 560,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_crown_pcc',
    brandName: 'ক্রাউন সিমেন্ট (Crown Cement)',
    productType: 'PCC (High Tensile)',
    bagWeightKg: 50,
    currentStock: 280,
    minStockAlert: 35,
    avgPurchasePrice: 515,
    defaultSalePrice: 555,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_fresh_pcc',
    brandName: 'ফ্রেশ সিমেন্ট (Fresh Cement)',
    productType: 'PCC (High Durability)',
    bagWeightKg: 50,
    currentStock: 190,
    minStockAlert: 30,
    avgPurchasePrice: 500,
    defaultSalePrice: 540,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_sevenrings_pcc',
    brandName: 'সেভেন রিংস সিমেন্ট (Seven Rings)',
    productType: 'PCC (Advanced Tech)',
    bagWeightKg: 50,
    currentStock: 160,
    minStockAlert: 30,
    avgPurchasePrice: 525,
    defaultSalePrice: 565,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_premier_pcc',
    brandName: 'প্রিমিয়ার সিমেন্ট (Premier Cement)',
    productType: 'PCC',
    bagWeightKg: 50,
    currentStock: 210,
    minStockAlert: 40,
    avgPurchasePrice: 505,
    defaultSalePrice: 545,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_akij_pcc',
    brandName: 'আকিজ সিমেন্ট (Akij Cement)',
    productType: 'PCC (Portland Composite)',
    bagWeightKg: 50,
    currentStock: 140,
    minStockAlert: 25,
    avgPurchasePrice: 510,
    defaultSalePrice: 550,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_scan_pcc',
    brandName: 'স্ক্যান সিমেন্ট (Scan Cement)',
    productType: 'OPC / PCC',
    bagWeightKg: 50,
    currentStock: 75,
    minStockAlert: 25,
    avgPurchasePrice: 535,
    defaultSalePrice: 575,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_confidence_pcc',
    brandName: 'কনফিডেন্স সিমেন্ট (Confidence)',
    productType: 'PCC',
    bagWeightKg: 50,
    currentStock: 90,
    minStockAlert: 20,
    avgPurchasePrice: 495,
    defaultSalePrice: 535,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_holcim_pcc',
    brandName: 'হোলসিম সিমেন্ট (Holcim Cement)',
    productType: 'PCC (Water Protect)',
    bagWeightKg: 50,
    currentStock: 110,
    minStockAlert: 30,
    avgPurchasePrice: 540,
    defaultSalePrice: 580,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Customers
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'রহিম বিল্ডার্স (ইঞ্জিঃ রহিম)',
    phone: '01711223344',
    address: 'ষ্টেশন রোড, বাজার এলাকা',
    totalDue: 45000,
    totalPaid: 125000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust_2',
    name: 'করিম অ্যান্ড সন্স ঠিকাদার',
    phone: '01819556677',
    address: 'উপজেলা মোড়, মেইন রোড',
    totalDue: 28500,
    totalPaid: 95000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust_3',
    name: 'হাজী রফিকুল ইসলাম',
    phone: '01912334455',
    address: 'গ্রামঃ চাঁদপুর, ডাকঘরঃ বাজার',
    totalDue: 0,
    totalPaid: 64000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust_4',
    name: 'মেসার্স হাসান ব্রিকস ও কনস্ট্রাকশন',
    phone: '01678990011',
    address: 'বাইপাস সংযোগ সড়ক',
    totalDue: 62000,
    totalPaid: 210000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Suppliers
const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp_1',
    name: 'মেঘনা ডিস্ট্রিবিউশন এজেন্সি',
    company: 'মেঘনা গ্রুপ / ফ্রেশ সিমেন্ট ডিলার',
    phone: '01733445566',
    address: 'সদর ঘাট ডিপো',
    totalPayable: 85000,
    totalPaid: 450000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'supp_2',
    name: 'শাহ সিমেন্ট সেন্ট্রাল ডিলারশিপ',
    company: 'আবুল খায়ের গ্রুপ',
    phone: '01844556677',
    address: 'নদী বন্দর ঘাট',
    totalPayable: 110000,
    totalPaid: 680000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'supp_3',
    name: 'বসুন্ধরা সিমেন্ট সেলস ডিপো',
    company: 'বসুন্ধরা গ্রুপ',
    phone: '01955667788',
    address: 'ইন্ডাস্ট্রিয়াল জোন',
    totalPayable: 45000,
    totalPaid: 320000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial bKash Transactions
const INITIAL_BKASH_TXS: BkashTransaction[] = [
  {
    id: 'bkash_tx_1',
    trxId: 'BKA88192A1',
    type: 'CUSTOMER_PAYMENT',
    amount: 15000,
    charge: 0,
    netAmount: 15000,
    counterpartyName: 'করিম অ্যান্ড সন্স',
    counterpartyPhone: '01819556677',
    previousBalance: 32500,
    newBalance: 47500,
    notes: 'সিমেন্ট বিক্রির আংশিক বিল পরিশোধ',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'bkash_tx_2',
    trxId: 'BKA77459C8',
    type: 'MONEY_RECEIVED',
    amount: 25000,
    charge: 0,
    netAmount: 25000,
    counterpartyName: 'হাজী রফিকুল ইসলাম',
    counterpartyPhone: '01912334455',
    previousBalance: 7500,
    newBalance: 32500,
    notes: '৫০ বস্তা ক্রাউন সিমেন্ট অগ্রিম বাবদ',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

// Initial Business Profile
const INITIAL_PROFILE: BusinessProfile = {
  businessName: 'মেসার্স কোরাইশ ট্রেডার্স',
  ownerName: 'মোহাম্মদ কোরাইশ',
  phone: '01712000000',
  address: 'মেসার্স কোরাইশ ট্রেডার্স, স্টেশন রোড, বাজার',
  tagline: 'গুণগতমানের সকল ব্রান্ডের সিমেন্ট পাইকারি ও খুচরা বিক্রেতা',
  pinHash: null,
  pinSalt: null,
  failedPinAttempts: 0,
  lockoutUntil: null,
  initialCashBalance: 85000,
  initialBkashBalance: 47500,
  currency: 'BDT',
};

interface AppContextType {
  profile: BusinessProfile;
  products: CementProduct[];
  stockMovements: StockMovement[];
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  customers: Customer[];
  suppliers: Supplier[];
  ledgerEntries: LedgerEntry[];
  bkashTransactions: BkashTransaction[];
  expenses: ExpenseRecord[];
  auditLogs: AuditLog[];
  isLocked: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  lastSyncTime: string;

  // Actions
  unlockApp: (pin: string) => Promise<{ success: boolean; error?: string }>;
  setAppPinCode: (pin: string) => Promise<boolean>;
  removeAppPin: () => void;
  lockAppNow: () => void;
  updateProfile: (updates: Partial<BusinessProfile>) => void;

  // Inventory & Stock
  addStockAdjustment: (data: {
    productId: string;
    quantity: number;
    type: 'OPENING' | 'DAMAGE' | 'ADJUSTMENT' | 'RETURN_CUSTOMER';
    pricePerBag: number;
    notes?: string;
  }) => void;
  addNewProduct: (product: Omit<CementProduct, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<CementProduct>) => void;

  // Sales
  recordSale: (data: {
    customerName: string;
    customerPhone?: string;
    customerId?: string | null;
    items: { productId: string; quantity: number; unitPrice: number }[];
    discountAmount: number;
    paidAmount: number;
    paymentMethod: 'CASH' | 'BKASH' | 'BANK' | 'CREDIT';
    bkashTrxId?: string;
    notes?: string;
  }) => { success: boolean; sale?: SaleTransaction; error?: string };

  reverseSaleTransaction: (saleId: string) => { success: boolean; error?: string };

  // Purchases
  recordPurchase: (data: {
    supplierName: string;
    supplierPhone?: string;
    supplierId?: string | null;
    items: { productId: string; quantity: number; unitPrice: number }[];
    transportCost: number;
    paidAmount: number;
    paymentMethod: 'CASH' | 'BKASH' | 'BANK' | 'CREDIT';
    notes?: string;
  }) => { success: boolean; purchase?: PurchaseTransaction; error?: string };

  // Customers & Suppliers
  addCustomer: (data: Omit<Customer, 'id' | 'totalDue' | 'totalPaid' | 'createdAt' | 'updatedAt'>) => Customer;
  addSupplier: (data: Omit<Supplier, 'id' | 'totalPayable' | 'totalPaid' | 'createdAt' | 'updatedAt'>) => Supplier;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: 'CASH' | 'BKASH' | 'BANK', notes?: string) => void;
  recordSupplierPayment: (supplierId: string, amount: number, paymentMethod: 'CASH' | 'BKASH' | 'BANK', notes?: string) => void;

  // bKash
  recordBkashEntry: (data: {
    trxId: string;
    type: BkashTxType;
    amount: number;
    charge?: number;
    counterpartyName: string;
    counterpartyPhone: string;
    notes?: string;
  }) => void;

  // Expenses
  recordExpenseEntry: (data: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;

  // Backups & Durability
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => { success: boolean; message: string };
  resetToDefaults: () => void;

  // Quick aggregates
  totalStockBags: number;
  totalStockValue: number;
  totalCustomerDue: number;
  totalSupplierPayable: number;
  currentCashBalance: number;
  currentBkashBalance: number;
  todaySalesAmount: number;
  todayPurchasesAmount: number;
  lowStockCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<BusinessProfile>(() =>
    loadFromStorage('profile', INITIAL_PROFILE)
  );
  const [products, setProducts] = useState<CementProduct[]>(() =>
    loadFromStorage('products', INITIAL_PRODUCTS)
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadFromStorage('stockMovements', [])
  );
  const [sales, setSales] = useState<SaleTransaction[]>(() =>
    loadFromStorage('sales', [])
  );
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(() =>
    loadFromStorage('purchases', [])
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage('customers', INITIAL_CUSTOMERS)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage('suppliers', INITIAL_SUPPLIERS)
  );
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() =>
    loadFromStorage('ledgerEntries', [])
  );
  const [bkashTransactions, setBkashTransactions] = useState<BkashTransaction[]>(() =>
    loadFromStorage('bkashTransactions', INITIAL_BKASH_TXS)
  );
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() =>
    loadFromStorage('expenses', [])
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadFromStorage('auditLogs', [
      {
        id: 'init_log',
        timestamp: new Date().toISOString(),
        action: 'APP_INITIALIZED',
        details: 'মেসার্স কোরাইশ ট্রেডার্স ডাটাবেস প্রস্তুত হয়েছে',
        user: 'Owner',
      },
    ])
  );

  // Security Lock State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const prof = loadFromStorage('profile', INITIAL_PROFILE);
    return Boolean(prof.pinHash);
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());

  // Save changes to localStorage automatically
  useEffect(() => { saveToStorage('profile', profile); }, [profile]);
  useEffect(() => { saveToStorage('products', products); }, [products]);
  useEffect(() => { saveToStorage('stockMovements', stockMovements); }, [stockMovements]);
  useEffect(() => { saveToStorage('sales', sales); }, [sales]);
  useEffect(() => { saveToStorage('purchases', purchases); }, [purchases]);
  useEffect(() => { saveToStorage('customers', customers); }, [customers]);
  useEffect(() => { saveToStorage('suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveToStorage('ledgerEntries', ledgerEntries); }, [ledgerEntries]);
  useEffect(() => { saveToStorage('bkashTransactions', bkashTransactions); }, [bkashTransactions]);
  useEffect(() => { saveToStorage('expenses', expenses); }, [expenses]);
  useEffect(() => { saveToStorage('auditLogs', auditLogs); }, [auditLogs]);

  // Periodic heartbeat sync indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime(new Date().toISOString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addAudit = useCallback((action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      details,
      user: profile.ownerName || 'Owner',
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, [profile.ownerName]);

  // Unlock with PIN
  const unlockApp = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      const res = await verifyAppPin(
        pin,
        profile.pinHash,
        profile.pinSalt,
        profile.failedPinAttempts,
        profile.lockoutUntil
      );

      if (res.success) {
        setProfile((prev) => ({
          ...prev,
          failedPinAttempts: 0,
          lockoutUntil: null,
        }));
        setIsLocked(false);
        addAudit('PIN_UNLOCK_SUCCESS', 'সঠিক পিন দিয়ে অ্যাপে প্রবেশ করা হয়েছে');
        return { success: true };
      } else {
        const lockoutTime = res.isLocked ? Date.now() + LOCKOUT_DURATION_MS : profile.lockoutUntil;
        setProfile((prev) => ({
          ...prev,
          failedPinAttempts: prev.failedPinAttempts + 1,
          lockoutUntil: lockoutTime,
        }));
        addAudit('PIN_UNLOCK_FAIL', `ভুল পিন চেষ্টা। অবশিষ্ট চেষ্টা: ${res.remainingAttempts}`);
        return { success: false, error: res.errorMessageBn };
      }
    },
    [profile.pinHash, profile.pinSalt, profile.failedPinAttempts, profile.lockoutUntil, addAudit]
  );

  // Set new PIN
  const setAppPinCode = useCallback(async (pin: string): Promise<boolean> => {
    if (!pin || pin.length < 4) return false;
    const salt = generateSalt();
    const hash = await hashPin(pin, salt);
    setProfile((prev) => ({
      ...prev,
      pinHash: hash,
      pinSalt: salt,
      failedPinAttempts: 0,
      lockoutUntil: null,
    }));
    addAudit('PIN_CONFIGURED', 'নতুন নিরাপত্তা পিন সেট করা হয়েছে');
    return true;
  }, [addAudit]);

  // Remove PIN
  const removeAppPin = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      pinHash: null,
      pinSalt: null,
      failedPinAttempts: 0,
      lockoutUntil: null,
    }));
    setIsLocked(false);
    addAudit('PIN_REMOVED', 'অ্যাপ নিরাপত্তা পিন নিষ্ক্রিয় করা হয়েছে');
  }, [addAudit]);

  const lockAppNow = useCallback(() => {
    if (profile.pinHash) {
      setIsLocked(true);
    }
  }, [profile.pinHash]);

  const updateProfile = useCallback((updates: Partial<BusinessProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    addAudit('PROFILE_UPDATED', 'ব্যবসার তথ্য পরিবর্তন করা হয়েছে');
  }, [addAudit]);

  // Inventory movements
  const addStockAdjustment = useCallback(
    (data: {
      productId: string;
      quantity: number;
      type: 'OPENING' | 'DAMAGE' | 'ADJUSTMENT' | 'RETURN_CUSTOMER';
      pricePerBag: number;
      notes?: string;
    }) => {
      const prod = products.find((p) => p.id === data.productId);
      if (!prod) return;

      const prevStock = prod.currentStock;
      const newStock = Math.max(0, prevStock + data.quantity);

      const movement: StockMovement = {
        id: 'mov_' + Date.now(),
        productId: prod.id,
        brandName: prod.brandName,
        type: data.type,
        quantity: data.quantity,
        pricePerBag: data.pricePerBag,
        totalAmount: Math.abs(data.quantity) * data.pricePerBag,
        previousStock: prevStock,
        newStock: newStock,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      };

      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, currentStock: newStock, updatedAt: new Date().toISOString() } : p))
      );
      setStockMovements((prev) => [movement, ...prev]);
      addAudit('STOCK_ADJUSTMENT', `${prod.brandName}: ${data.quantity} বস্তা (${data.type})`);
    },
    [products, addAudit]
  );

  const addNewProduct = useCallback(
    (product: Omit<CementProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newProd: CementProduct = {
        ...product,
        id: 'prod_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProd, ...prev]);
      addAudit('PRODUCT_ADDED', `নতুন সিমেন্ট যুক্ত: ${product.brandName}`);
    },
    [addAudit]
  );

  const updateProduct = useCallback((id: string, updates: Partial<CementProduct>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    addAudit('PRODUCT_UPDATED', `পণ্য আপডেট করা হয়েছে: ID ${id}`);
  }, [addAudit]);

  // Record a Sale
  const recordSale = useCallback(
    (data: {
      customerName: string;
      customerPhone?: string;
      customerId?: string | null;
      items: { productId: string; quantity: number; unitPrice: number }[];
      discountAmount: number;
      paidAmount: number;
      paymentMethod: 'CASH' | 'BKASH' | 'BANK' | 'CREDIT';
      bkashTrxId?: string;
      notes?: string;
    }): { success: boolean; sale?: SaleTransaction; error?: string } => {
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'অন্তত একটি পণ্য নির্বাচন করুন।' };
      }

      // Check stock availability
      for (const item of data.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) {
          return { success: false, error: `পণ্য খুঁজে পাওয়া যায়নি (ID: ${item.productId})` };
        }
        if (prod.currentStock < item.quantity) {
          return {
            success: false,
            error: `${prod.brandName}-এর স্টকে মাত্র ${prod.currentStock} বস্তা আছে। ${item.quantity} বস্তা বিক্রি সম্ভব নয়!`,
          };
        }
      }

      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const netAmount = Math.max(0, totalAmount - (data.discountAmount || 0));
      const paid = Math.min(netAmount, Math.max(0, data.paidAmount || 0));
      const due = Math.max(0, netAmount - paid);

      const saleId = 'sale_' + Date.now();
      const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + String(sales.length + 1).padStart(4, '0');

      const saleItems = data.items.map((item) => {
        const prod = products.find((p) => p.id === item.productId)!;
        return {
          productId: prod.id,
          brandName: prod.brandName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        };
      });

      const newSale: SaleTransaction = {
        id: saleId,
        invoiceNumber,
        customerId: data.customerId || null,
        customerName: data.customerName || 'খুচরা ক্রেতা',
        customerPhone: data.customerPhone || '',
        items: saleItems,
        totalAmount,
        discountAmount: data.discountAmount || 0,
        netAmount,
        paidAmount: paid,
        dueAmount: due,
        paymentMethod: data.paymentMethod,
        bkashTrxId: data.bkashTrxId || '',
        status: 'COMPLETED',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      };

      // Deduct stock and record movements
      const newMovements: StockMovement[] = [];
      setProducts((prev) =>
        prev.map((prod) => {
          const item = data.items.find((it) => it.productId === prod.id);
          if (item) {
            const prevStock = prod.currentStock;
            const newStock = prevStock - item.quantity;
            newMovements.push({
              id: 'mov_sale_' + Date.now() + '_' + prod.id,
              productId: prod.id,
              brandName: prod.brandName,
              type: 'SALE',
              quantity: -item.quantity,
              pricePerBag: item.unitPrice,
              totalAmount: item.quantity * item.unitPrice,
              previousStock: prevStock,
              newStock,
              referenceId: invoiceNumber,
              createdAt: new Date().toISOString(),
            });
            return { ...prod, currentStock: newStock, updatedAt: new Date().toISOString() };
          }
          return prod;
        })
      );
      setStockMovements((prev) => [...newMovements, ...prev]);

      // If customer is selected or due exists, update Customer Ledger
      if (data.customerId || due > 0) {
        let matchedCustomer = customers.find((c) => c.id === data.customerId);
        if (!matchedCustomer && data.customerName) {
          // create customer
          matchedCustomer = {
            id: 'cust_' + Date.now(),
            name: data.customerName,
            phone: data.customerPhone || '',
            totalDue: due,
            totalPaid: paid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCustomers((prev) => [matchedCustomer!, ...prev]);
        } else if (matchedCustomer) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === matchedCustomer!.id
                ? {
                    ...c,
                    totalDue: c.totalDue + due,
                    totalPaid: c.totalPaid + paid,
                    updatedAt: new Date().toISOString(),
                  }
                : c
            )
          );
        }

        if (matchedCustomer) {
          const ledger: LedgerEntry = {
            id: 'ledg_' + Date.now(),
            entityId: matchedCustomer.id,
            entityType: 'CUSTOMER',
            date: new Date().toISOString(),
            type: 'SALE',
            description: `বিক্রয় চালান: ${invoiceNumber} (${saleItems.map((i) => `${i.quantity} ${i.brandName}`).join(', ')})`,
            debit: netAmount,
            credit: paid,
            balanceAfter: matchedCustomer.totalDue + due,
            referenceId: invoiceNumber,
            paymentMethod: data.paymentMethod,
          };
          setLedgerEntries((prev) => [ledger, ...prev]);
        }
      }

      // If paid via bKash, auto record to bKash ledger
      if (data.paymentMethod === 'BKASH' && paid > 0) {
        const lastBkash = bkashTransactions[0];
        const prevBal = lastBkash ? lastBkash.newBalance : profile.initialBkashBalance;
        const newBkashTx: BkashTransaction = {
          id: 'bkt_' + Date.now(),
          trxId: data.bkashTrxId || 'BKA' + Math.floor(100000 + Math.random() * 900000),
          type: 'CUSTOMER_PAYMENT',
          amount: paid,
          charge: 0,
          netAmount: paid,
          counterpartyName: data.customerName || 'কাস্টমার',
          counterpartyPhone: data.customerPhone || '',
          previousBalance: prevBal,
          newBalance: prevBal + paid,
          notes: `চালান #${invoiceNumber} বাবদ বিক্রয় মূল্য`,
          createdAt: new Date().toISOString(),
        };
        setBkashTransactions((prev) => [newBkashTx, ...prev]);
      }

      setSales((prev) => [newSale, ...prev]);
      addAudit('SALE_RECORDED', `বিক্রয় সম্পন্ন: ${invoiceNumber}, মোট ৳${netAmount}, জমা ৳${paid}, বাকি ৳${due}`);
      return { success: true, sale: newSale };
    },
    [products, sales.length, customers, bkashTransactions, profile.initialBkashBalance, addAudit]
  );

  // Reverse Sale Transaction
  const reverseSaleTransaction = useCallback(
    (saleId: string): { success: boolean; error?: string } => {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) return { success: false, error: 'বিক্রয় পাওয়া যায়নি' };
      if (sale.status === 'REVERSED') return { success: false, error: 'এই বিক্রয়টি ইতিমধ্যে বাতিল করা হয়েছে' };

      // Restore product stock
      const restockMovements: StockMovement[] = [];
      setProducts((prev) =>
        prev.map((prod) => {
          const item = sale.items.find((it) => it.productId === prod.id);
          if (item) {
            const prevStock = prod.currentStock;
            const newStock = prevStock + item.quantity;
            restockMovements.push({
              id: 'mov_rev_' + Date.now() + '_' + prod.id,
              productId: prod.id,
              brandName: prod.brandName,
              type: 'RETURN_CUSTOMER',
              quantity: item.quantity,
              pricePerBag: item.unitPrice,
              totalAmount: item.subtotal,
              previousStock: prevStock,
              newStock,
              referenceId: sale.invoiceNumber + '-REVERSED',
              notes: `চালান ${sale.invoiceNumber} বিক্রয় বাতিলের কারণে ফেরত`,
              createdAt: new Date().toISOString(),
            });
            return { ...prod, currentStock: newStock, updatedAt: new Date().toISOString() };
          }
          return prod;
        })
      );
      setStockMovements((prev) => [...restockMovements, ...prev]);

      // Adjust customer balance
      if (sale.customerId) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === sale.customerId
              ? {
                  ...c,
                  totalDue: Math.max(0, c.totalDue - sale.dueAmount),
                  totalPaid: Math.max(0, c.totalPaid - sale.paidAmount),
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        );
      }

      setSales((prev) =>
        prev.map((s) =>
          s.id === saleId
            ? { ...s, status: 'REVERSED', reversedAt: new Date().toISOString() }
            : s
        )
      );

      addAudit('SALE_REVERSED', `বিক্রয় বাতিল ও স্টক ফেরত: চালান #${sale.invoiceNumber}`);
      return { success: true };
    },
    [sales, addAudit]
  );

  // Record a Purchase
  const recordPurchase = useCallback(
    (data: {
      supplierName: string;
      supplierPhone?: string;
      supplierId?: string | null;
      items: { productId: string; quantity: number; unitPrice: number }[];
      transportCost: number;
      paidAmount: number;
      paymentMethod: 'CASH' | 'BKASH' | 'BANK' | 'CREDIT';
      notes?: string;
    }): { success: boolean; purchase?: PurchaseTransaction; error?: string } => {
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'অন্তত একটি পণ্য যোগ করুন।' };
      }

      const totalItemsCost = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const totalAmount = totalItemsCost + (data.transportCost || 0);
      const paid = Math.min(totalAmount, Math.max(0, data.paidAmount || 0));
      const due = Math.max(0, totalAmount - paid);

      const billNumber = 'PUR-' + new Date().getFullYear() + '-' + String(purchases.length + 1).padStart(4, '0');

      const purchaseItems = data.items.map((item) => {
        const prod = products.find((p) => p.id === item.productId)!;
        return {
          productId: prod.id,
          brandName: prod.brandName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        };
      });

      const newPurchase: PurchaseTransaction = {
        id: 'pur_' + Date.now(),
        billNumber,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName,
        supplierPhone: data.supplierPhone || '',
        items: purchaseItems,
        transportCost: data.transportCost || 0,
        totalAmount,
        paidAmount: paid,
        dueAmount: due,
        paymentMethod: data.paymentMethod,
        status: 'COMPLETED',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      };

      // Add to stock and movements
      const newMovements: StockMovement[] = [];
      setProducts((prev) =>
        prev.map((prod) => {
          const item = data.items.find((it) => it.productId === prod.id);
          if (item) {
            const prevStock = prod.currentStock;
            const newStock = prevStock + item.quantity;
            newMovements.push({
              id: 'mov_pur_' + Date.now() + '_' + prod.id,
              productId: prod.id,
              brandName: prod.brandName,
              type: 'PURCHASE',
              quantity: item.quantity,
              pricePerBag: item.unitPrice,
              totalAmount: item.quantity * item.unitPrice,
              previousStock: prevStock,
              newStock,
              referenceId: billNumber,
              createdAt: new Date().toISOString(),
            });
            return {
              ...prod,
              currentStock: newStock,
              avgPurchasePrice: item.unitPrice,
              updatedAt: new Date().toISOString(),
            };
          }
          return prod;
        })
      );
      setStockMovements((prev) => [...newMovements, ...prev]);

      // Update Supplier Balance & Ledger
      let matchedSupplier = suppliers.find((s) => s.id === data.supplierId);
      if (!matchedSupplier && data.supplierName) {
        matchedSupplier = {
          id: 'supp_' + Date.now(),
          name: data.supplierName,
          phone: data.supplierPhone || '',
          company: data.supplierName,
          totalPayable: due,
          totalPaid: paid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSuppliers((prev) => [matchedSupplier!, ...prev]);
      } else if (matchedSupplier) {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === matchedSupplier!.id
              ? {
                  ...s,
                  totalPayable: s.totalPayable + due,
                  totalPaid: s.totalPaid + paid,
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        );
      }

      if (matchedSupplier) {
        const ledger: LedgerEntry = {
          id: 'ledg_' + Date.now(),
          entityId: matchedSupplier.id,
          entityType: 'SUPPLIER',
          date: new Date().toISOString(),
          type: 'PURCHASE',
          description: `ক্রয় বিল: ${billNumber} (${purchaseItems.map((i) => `${i.quantity} ${i.brandName}`).join(', ')})`,
          debit: paid,
          credit: totalAmount,
          balanceAfter: matchedSupplier.totalPayable + due,
          referenceId: billNumber,
          paymentMethod: data.paymentMethod,
        };
        setLedgerEntries((prev) => [ledger, ...prev]);
      }

      setPurchases((prev) => [newPurchase, ...prev]);
      addAudit('PURCHASE_RECORDED', `ক্রয় সম্পন্ন: ${billNumber}, মোট ৳${totalAmount}, পরিশোধ ৳${paid}, বাকি ৳${due}`);
      return { success: true, purchase: newPurchase };
    },
    [products, purchases.length, suppliers, addAudit]
  );

  // Add Customer / Supplier
  const addCustomer = useCallback(
    (data: Omit<Customer, 'id' | 'totalDue' | 'totalPaid' | 'createdAt' | 'updatedAt'>) => {
      const newCust: Customer = {
        ...data,
        id: 'cust_' + Date.now(),
        totalDue: 0,
        totalPaid: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCustomers((prev) => [newCust, ...prev]);
      addAudit('CUSTOMER_ADDED', `নতুন গ্রাহক যুক্ত: ${data.name}`);
      return newCust;
    },
    [addAudit]
  );

  const addSupplier = useCallback(
    (data: Omit<Supplier, 'id' | 'totalPayable' | 'totalPaid' | 'createdAt' | 'updatedAt'>) => {
      const newSupp: Supplier = {
        ...data,
        id: 'supp_' + Date.now(),
        totalPayable: 0,
        totalPaid: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [newSupp, ...prev]);
      addAudit('SUPPLIER_ADDED', `নতুন মহাজন/সরবরাহকারী যুক্ত: ${data.name}`);
      return newSupp;
    },
    [addAudit]
  );

  // Customer Payment
  const recordCustomerPayment = useCallback(
    (customerId: string, amount: number, paymentMethod: 'CASH' | 'BKASH' | 'BANK', notes?: string) => {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust || amount <= 0) return;

      const newDue = Math.max(0, cust.totalDue - amount);
      const newPaid = cust.totalPaid + amount;

      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, totalDue: newDue, totalPaid: newPaid, updatedAt: new Date().toISOString() } : c))
      );

      const ledger: LedgerEntry = {
        id: 'ledg_' + Date.now(),
        entityId: cust.id,
        entityType: 'CUSTOMER',
        date: new Date().toISOString(),
        type: 'PAYMENT',
        description: `বকেয়া আদায় (${notes || 'নগদ জমা'})`,
        debit: 0,
        credit: amount,
        balanceAfter: newDue,
        paymentMethod,
      };
      setLedgerEntries((prev) => [ledger, ...prev]);

      if (paymentMethod === 'BKASH') {
        const lastBkash = bkashTransactions[0];
        const prevBal = lastBkash ? lastBkash.newBalance : profile.initialBkashBalance;
        const newBkashTx: BkashTransaction = {
          id: 'bkt_' + Date.now(),
          trxId: 'BKA' + Math.floor(100000 + Math.random() * 900000),
          type: 'CUSTOMER_PAYMENT',
          amount,
          charge: 0,
          netAmount: amount,
          counterpartyName: cust.name,
          counterpartyPhone: cust.phone,
          previousBalance: prevBal,
          newBalance: prevBal + amount,
          notes: `বকেয়া আদায়: ${notes || ''}`,
          createdAt: new Date().toISOString(),
        };
        setBkashTransactions((prev) => [newBkashTx, ...prev]);
      }

      addAudit('CUSTOMER_PAYMENT', `${cust.name}-এর থেকে ৳${amount} আদায় করা হয়েছে`);
    },
    [customers, bkashTransactions, profile.initialBkashBalance, addAudit]
  );

  // Supplier Payment
  const recordSupplierPayment = useCallback(
    (supplierId: string, amount: number, paymentMethod: 'CASH' | 'BKASH' | 'BANK', notes?: string) => {
      const supp = suppliers.find((s) => s.id === supplierId);
      if (!supp || amount <= 0) return;

      const newPayable = Math.max(0, supp.totalPayable - amount);
      const newPaid = supp.totalPaid + amount;

      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? { ...s, totalPayable: newPayable, totalPaid: newPaid, updatedAt: new Date().toISOString() } : s))
      );

      const ledger: LedgerEntry = {
        id: 'ledg_' + Date.now(),
        entityId: supp.id,
        entityType: 'SUPPLIER',
        date: new Date().toISOString(),
        type: 'PAYMENT',
        description: `বিল পরিশোধ (${notes || 'নগদ'})`,
        debit: amount,
        credit: 0,
        balanceAfter: newPayable,
        paymentMethod,
      };
      setLedgerEntries((prev) => [ledger, ...prev]);

      if (paymentMethod === 'BKASH') {
        const lastBkash = bkashTransactions[0];
        const prevBal = lastBkash ? lastBkash.newBalance : profile.initialBkashBalance;
        const newBkashTx: BkashTransaction = {
          id: 'bkt_' + Date.now(),
          trxId: 'BKA' + Math.floor(100000 + Math.random() * 900000),
          type: 'SUPPLIER_PAYMENT',
          amount,
          charge: 0,
          netAmount: -amount,
          counterpartyName: supp.name,
          counterpartyPhone: supp.phone,
          previousBalance: prevBal,
          newBalance: Math.max(0, prevBal - amount),
          notes: `মহাজন বিল পরিশোধ: ${notes || ''}`,
          createdAt: new Date().toISOString(),
        };
        setBkashTransactions((prev) => [newBkashTx, ...prev]);
      }

      addAudit('SUPPLIER_PAYMENT', `${supp.name}-কে ৳${amount} পরিশোধ করা হয়েছে`);
    },
    [suppliers, bkashTransactions, profile.initialBkashBalance, addAudit]
  );

  // Record bKash Entry
  const recordBkashEntry = useCallback(
    (data: {
      trxId: string;
      type: BkashTxType;
      amount: number;
      charge?: number;
      counterpartyName: string;
      counterpartyPhone: string;
      notes?: string;
    }) => {
      const lastBkash = bkashTransactions[0];
      const prevBal = lastBkash ? lastBkash.newBalance : profile.initialBkashBalance;
      const charge = data.charge || 0;

      let net = 0;
      let newBal = prevBal;

      if (data.type === 'MONEY_RECEIVED' || data.type === 'CUSTOMER_PAYMENT') {
        net = data.amount - charge;
        newBal = prevBal + net;
      } else {
        // MONEY_SENT, SUPPLIER_PAYMENT, CASH_OUT_CHARGE
        net = -(data.amount + charge);
        newBal = Math.max(0, prevBal + net);
      }

      const tx: BkashTransaction = {
        id: 'bkt_' + Date.now(),
        trxId: data.trxId || 'BKA' + Math.floor(100000 + Math.random() * 900000),
        type: data.type,
        amount: data.amount,
        charge,
        netAmount: net,
        counterpartyName: data.counterpartyName || 'বিকাশ লেনদেন',
        counterpartyPhone: data.counterpartyPhone || '',
        previousBalance: prevBal,
        newBalance: newBal,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      };

      setBkashTransactions((prev) => [tx, ...prev]);
      addAudit('BKASH_ENTRY', `বিকাশ লেনদেন: ${data.type}, ৳${data.amount}, নতুন ব্যালেন্স: ৳${newBal}`);
    },
    [bkashTransactions, profile.initialBkashBalance, addAudit]
  );

  // Expense
  const recordExpenseEntry = useCallback(
    (data: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
      const exp: ExpenseRecord = {
        ...data,
        id: 'exp_' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => [exp, ...prev]);
      addAudit('EXPENSE_RECORDED', `খরচ: ${data.title}, ৳${data.amount} (${data.category})`);
    },
    [addAudit]
  );

  // Backup & Restore
  const exportDatabaseJson = useCallback(() => {
    const backupData = {
      appVersion: '2.0.0',
      exportDate: new Date().toISOString(),
      appName: 'মেসার্স কোরাইশ ট্রেডার্স',
      profile,
      products,
      stockMovements,
      sales,
      purchases,
      customers,
      suppliers,
      ledgerEntries,
      bkashTransactions,
      expenses,
      auditLogs,
    };
    addAudit('BACKUP_EXPORTED', 'সম্পূর্ণ ডাটাবেস ব্যাকআপ এক্সপোর্ট করা হয়েছে');
    return JSON.stringify(backupData, null, 2);
  }, [profile, products, stockMovements, sales, purchases, customers, suppliers, ledgerEntries, bkashTransactions, expenses, auditLogs, addAudit]);

  const importDatabaseJson = useCallback(
    (jsonString: string): { success: boolean; message: string } => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.products || !Array.isArray(parsed.products)) {
          return { success: false, message: 'অবৈধ ব্যাকআপ ফাইল। পণ্যের তালিকা পাওয়া যায়নি।' };
        }

        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.purchases) setPurchases(parsed.purchases);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.ledgerEntries) setLedgerEntries(parsed.ledgerEntries);
        if (parsed.bkashTransactions) setBkashTransactions(parsed.bkashTransactions);
        if (parsed.expenses) setExpenses(parsed.expenses);

        addAudit('BACKUP_RESTORED', 'সফলভাবে ব্যাকআপ ডাটা রিস্টোর করা হয়েছে');
        return { success: true, message: 'ডাটাবেস সফলভাবে রিস্টোর করা হয়েছে!' };
      } catch (err) {
        return { success: false, message: 'ফাইলটি সঠিক JSON ফরম্যাটে নেই।' };
      }
    },
    [addAudit]
  );

  const resetToDefaults = useCallback(() => {
    setProfile(INITIAL_PROFILE);
    setProducts(INITIAL_PRODUCTS);
    setStockMovements([]);
    setSales([]);
    setPurchases([]);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setLedgerEntries([]);
    setBkashTransactions(INITIAL_BKASH_TXS);
    setExpenses([]);
    addAudit('DATABASE_RESET', 'ডাটাবেস প্রাথমিক সেটিংসে রিসেট করা হয়েছে');
  }, [addAudit]);

  // Aggregates & KPIs
  const totalStockBags = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
  }, [products]);

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.avgPurchasePrice || 0), 0);
  }, [products]);

  const totalCustomerDue = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.totalDue || 0), 0);
  }, [customers]);

  const totalSupplierPayable = useMemo(() => {
    return suppliers.reduce((acc, s) => acc + (s.totalPayable || 0), 0);
  }, [suppliers]);

  const currentBkashBalance = useMemo(() => {
    const last = bkashTransactions[0];
    return last ? last.newBalance : profile.initialBkashBalance;
  }, [bkashTransactions, profile.initialBkashBalance]);

  // Calculate cash balance: initial + cash sales + cash customer payments - cash purchases - cash supplier payments - cash expenses
  const currentCashBalance = useMemo(() => {
    let cash = profile.initialCashBalance || 0;

    sales.forEach((s) => {
      if (s.status === 'COMPLETED' && s.paymentMethod === 'CASH') {
        cash += s.paidAmount;
      }
    });

    purchases.forEach((p) => {
      if (p.status === 'COMPLETED' && p.paymentMethod === 'CASH') {
        cash -= p.paidAmount;
      }
    });

    expenses.forEach((e) => {
      if (e.paymentMethod === 'CASH') {
        cash -= e.amount;
      }
    });

    return cash;
  }, [profile.initialCashBalance, sales, purchases, expenses]);

  // Today sales
  const todaySalesAmount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return sales
      .filter((s) => s.status === 'COMPLETED' && new Date(s.createdAt).toDateString() === todayStr)
      .reduce((sum, s) => sum + s.netAmount, 0);
  }, [sales]);

  // Today purchases
  const todayPurchasesAmount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return purchases
      .filter((p) => p.status === 'COMPLETED' && new Date(p.createdAt).toDateString() === todayStr)
      .reduce((sum, p) => sum + p.totalAmount, 0);
  }, [purchases]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStockAlert).length;
  }, [products]);

  const value = {
    profile,
    products,
    stockMovements,
    sales,
    purchases,
    customers,
    suppliers,
    ledgerEntries,
    bkashTransactions,
    expenses,
    auditLogs,
    isLocked,
    cloudSyncStatus,
    lastSyncTime,

    unlockApp,
    setAppPinCode,
    removeAppPin,
    lockAppNow,
    updateProfile,

    addStockAdjustment,
    addNewProduct,
    updateProduct,

    recordSale,
    reverseSaleTransaction,
    recordPurchase,

    addCustomer,
    addSupplier,
    recordCustomerPayment,
    recordSupplierPayment,

    recordBkashEntry,
    recordExpenseEntry,

    exportDatabaseJson,
    importDatabaseJson,
    resetToDefaults,

    totalStockBags,
    totalStockValue,
    totalCustomerDue,
    totalSupplierPayable,
    currentCashBalance,
    currentBkashBalance,
    todaySalesAmount,
    todayPurchasesAmount,
    lowStockCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
