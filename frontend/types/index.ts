export type PaymentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID";
export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  totalPurchased: number;
  totalPaid: number;
  totalPending: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  godName: string;
  frameName: string;
  size?: string;
  sellingPrice: number;
  costPrice: number;
  images: string[];
  description?: string;
  isActive: boolean;
  isQuickEntry?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  godName: string;
  frameName: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  customerId: string | Customer;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  saleDate: string;
  notes?: string;
  isVoided: boolean;
  createdAt: string;
}

export interface Payment {
  _id: string;
  paymentNumber: string;
  customerId: string | Customer;
  saleId?: string | Sale;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryMovement {
  _id: string;
  productId: string;
  type: "SALE" | "RESTOCK" | "ADJUSTMENT" | "DAMAGE" | "RETURN";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  saleId?: string;
  createdAt: string;
}

export interface BusinessSettings {
  _id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  logo: string;
  currency: string;
  paymentMethods: { key: string; label: string; enabled: boolean }[];
  allowNegativeStock: boolean;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
}
