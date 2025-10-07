import { ObjectId } from "mongoose";

// Log type
export interface Log {
  employeeId: ObjectId | string;
  employeeName: string;
  timestamp?: Date;
  comment: string;
}

// Product type (for CustomerService)
export interface Product {
  productName: string;
  quantity: number;
  size: string;
  usage: string;
  targetPrice: number;
  uploadFiles: string[]; // URLs of photos/videos
}

// Customer Service type
export interface CustomerService {
  customerName: string;
  contactNumber: string;
  address?: string;
  city?: string;
  state?: string;
  products: Product[];
  employeeId?: ObjectId | string;
  managerId?: ObjectId | string;
  logs: Log[];
}

// Sourcing type
export interface Sourcing {
  productName?: string;
  companyName?: string;
  companyAddress?: string;
  supplierName?: string;
  supplierContactNumber?: string;
  productDetail?: string;
  productCatalogue?: string;
  productUnitPrice?: number;
  uploadDocuments: string[]; // URLs
  employeeId?: ObjectId | string;
  managerId?: ObjectId | string;
  logs: Log[];
}

// Shipping type
export interface Shipping {
  itemName?: string;
  totalCTN?: number;
  totalCBM?: number;
  totalKG?: number;
  totalValue?: number;
  totalPCS?: number;
  hsnCode?: string;
  shipmentMode?: string;
  uploadInvoice?: string;
  uploadPackingList?: string;
  employeeId?: ObjectId | string;
  managerId?: ObjectId | string;
  freightRate?: number;
  logs: Log[];
}

// Sales type
export interface Sales {
  trackingNumber?: string;
  warehouseReceipt?: string;
  employeeId?: ObjectId | string;
  managerId?: ObjectId | string;
  logs: Log[];
}

// Current Assigned Employee type
export interface AssignedEmployee {
  employeeId?: ObjectId | string;
  employeeName?: string;
}

// Lead type
export interface Lead {
  _id: ObjectId | string;
  leadId: string;
  currentStatus?: string; // "Customer Service", "Sourcing", "Shipping", "Sales"
  currentAssignedEmployee?: AssignedEmployee;
  customerService?: CustomerService;
  sourcing?: Sourcing;
  shipping?: Shipping;
  sales?: Sales;
  logs: Log[];
  createdAt?: Date;
  updatedAt?: Date;
}

