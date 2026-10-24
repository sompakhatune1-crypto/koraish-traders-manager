/**
 * Data models for Messrs Koraish Traders (মেসার্স কোরাইশ ট্রেডার্স)
 */

export interface CementProduct {
  id: string;
  brandName: string; // e.g. Shah Cement, Bashundhara, Crown, etc.
  productType: string; // e.g. PCC (Portland Composite Cement), OPC
  bagWeightKg: number; // typically 50 kg
  currentStock: number; // in bags
  minStockAlert: number; // low stock alert threshold
  avgPurchasePrice: number; // in Taka per bag
  defaultSalePrice: number; // in Taka per bag
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'OPENING'
  | 'PURCHASE'
  | 'SALE'
  | 'DAMAGE'
  | 'ADJUSTMENT'
  | 'RETURN_CUSTOMER'
  | 'RETURN_SUPPLIER';

export interface StockMovement {
  id: string;
  productId: string;
  brandName: string;
  type: MovementType;
  quantity: number; // positive or negative
  pricePerBag: number;
  totalAmount: number;
  previousStock: number;
  newStock: number;
  referenceId?: string; // invoice or bill id
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  brandName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'CASH' | 'BKASH' | 'BANK' | 'CREDIT';

export interface SaleTransaction {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0001"
  customerId?: string | null;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  bkashTrxId?: string;
  status: 'COMPLETED' | 'REVERSED';
  reversedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  brandName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseTransaction {
  id: string;
  billNumber: string; // e.g. "PUR-2026-0001"
  supplierId?: string | null;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseItem[];
  transportCost: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  status: 'COMPLETED' | 'REVERSED';
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalDue: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company?: string;
  address?: string;
  totalPayable: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  entityId: string; // customerId or supplierId
  entityType: 'CUSTOMER' | 'SUPPLIER';
  date: string;
  type: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';
  description: string;
  debit: number; // for customer: increases due; for supplier: decreases payable
  credit: number; // for customer: decreases due; for supplier: increases payable
  balanceAfter: number;
  referenceId?: string;
  paymentMethod?: PaymentMethod;
}

export type BkashTxType =
  | 'MONEY_RECEIVED'
  | 'MONEY_SENT'
  | 'CUSTOMER_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'CASH_OUT_CHARGE'
  | 'ADJUSTMENT';

export interface BkashTransaction {
  id: string;
  trxId: string;
  type: BkashTxType;
  amount: number;
  charge: number; // cashout fee or service fee
  netAmount: number;
  counterpartyName: string;
  counterpartyPhone: string;
  previousBalance: number;
  newBalance: number;
  notes?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'TRANSPORT' | 'LABOR' | 'SHOP_RENT' | 'ELECTRICITY' | 'TEA_SNACKS' | 'OTHER';
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  tagline: string;
  pinHash: string | null;
  pinSalt: string | null;
  failedPinAttempts: number;
  lockoutUntil: number | null;
  initialCashBalance: number;
  initialBkashBalance: number;
  currency: string;
}

export interface VoiceAssistantIntent {
  action:
    | 'CHECK_STOCK'
    | 'ADD_STOCK'
    | 'SELL_STOCK'
    | 'CHECK_CUSTOMER_DUE'
    | 'RECORD_CUSTOMER_PAYMENT'
    | 'RECORD_BKASH'
    | 'CHECK_TODAYS_SALES'
    | 'CHECK_LOW_STOCK'
    | 'UNKNOWN';
  brand?: string | null;
  quantity?: number | null;
  pricePerBag?: number | null;
  totalAmount?: number | null;
  personName?: string | null;
  bkashType?: 'CASH_IN' | 'CASH_OUT' | 'PAYMENT' | 'SEND_MONEY' | null;
  paymentMethod?: PaymentMethod | null;
  requiresConfirmation: boolean;
  confirmationMessageBn: string;
  spokenFeedbackBn: string;
  needsFollowUp: boolean;
  followUpQuestionBn?: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}
