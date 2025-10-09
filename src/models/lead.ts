import { Schema, model, models, Types } from "mongoose";

// ---------------------
// Log Schema & Interface
// ---------------------
export interface Log {
  employeeId: Types.ObjectId | string;
  employeeName: string;
  timestamp?: Date;
  comment: string;
}

const LogSchema = new Schema<Log>(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    comment: { type: String, required: true },
  },
  { _id: false }
);

// ---------------------
// Product Schema & Interface
// ---------------------
export interface Product {
  productName: string;
  quantity: number;
  size?: string;
  usage?: string;
  targetPrice?: number;
  uploadFiles: string[];
}

const ProductSchema = new Schema<Product>(
  {
    productName: String,
    quantity: Number,
    size: String,
    usage: String,
    targetPrice: Number,
    uploadFiles: [String],
  },
  { _id: false }
);

// ---------------------
// CustomerService Schema & Interface
// ---------------------
export interface CustomerService {
  customerName?: string;
  contactNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  products: Product[];
  employeeId?: Types.ObjectId | string;
  managerId?: Types.ObjectId | string;
  logs: Log[];
}

const CustomerServiceSchema = new Schema<CustomerService>(
  {
    customerName: String,
    contactNumber: String,
    address: String,
    city: String,
    state: String,
    products: [ProductSchema],
    employeeId: { type: Schema.Types.Mixed },
    managerId: { type: Schema.Types.Mixed },
    logs: [LogSchema],
  },
  { _id: false }
);

// ---------------------
// Sourcing Schema & Interface
// ---------------------
export interface Sourcing {
  productName?: string;
  companyName?: string;
  companyAddress?: string;
  supplierName?: string;
  supplierContactNumber?: string;
  productDetail?: string;
  productCatalogue?: string;
  productUnitPrice?: number;
  uploadDocuments: string[];
  employeeId?: Types.ObjectId | string;
  managerId?: Types.ObjectId | string;
  logs: Log[];
}

const SourcingSchema = new Schema<Sourcing>(
  {
    productName: String,
    companyName: String,
    companyAddress: String,
    supplierName: String,
    supplierContactNumber: String,
    productDetail: String,
    productCatalogue: String,
    productUnitPrice: Number,
    uploadDocuments: [String],
    employeeId: { type: Schema.Types.Mixed },
    managerId: { type: Schema.Types.Mixed },
    logs: [LogSchema],
  },
  { _id: false }
);

// ---------------------
// Shipping Schema & Interface
// ---------------------
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
  employeeId?: Types.ObjectId | string;
  managerId?: Types.ObjectId | string;
  freightRate?: number;
  logs: Log[];
}

const ShippingSchema = new Schema<Shipping>(
  {
    itemName: String,
    totalCTN: Number,
    totalCBM: Number,
    totalKG: Number,
    totalValue: Number,
    totalPCS: Number,
    hsnCode: String,
    shipmentMode: String,
    uploadInvoice: String,
    uploadPackingList: String,
    employeeId: { type: Schema.Types.Mixed },
    managerId: { type: Schema.Types.Mixed },
    freightRate: Number,
    logs: [LogSchema],
  },
  { _id: false }
);

// ---------------------
// Sales Schema & Interface
// ---------------------
export interface Sales {
  trackingNumber?: string;
  warehouseReceipt?: string;
  employeeId?: Types.ObjectId | string;
  managerId?: Types.ObjectId | string;
  logs: Log[];
}

const SalesSchema = new Schema<Sales>(
  {
    trackingNumber: String,
    warehouseReceipt: String,
    employeeId: { type: Schema.Types.Mixed },
    managerId: { type: Schema.Types.Mixed },
    logs: [LogSchema],
  },
  { _id: false }
);

// ---------------------
// Assigned Employee Schema
// ---------------------
export interface AssignedEmployee {
  employeeId?: Types.ObjectId | string;
  employeeName?: string;
}

const AssignedEmployeeSchema = new Schema(
  {
    employeeId: { type: String },
    employeeName: String,
  },
  { _id: false }
);

// ---------------------
// Lead Schema & Interface
// ---------------------
export interface Lead {
  leadId: string;
  currentStatus?: string;
  currentAssignedEmployee?: AssignedEmployee;
  customerService?: CustomerService;
  sourcing?: Sourcing;
  shipping?: Shipping;
  sales?: Sales;
  logs: Log[];
  createdAt?: Date;
  updatedAt?: Date;
}

const LeadSchema = new Schema<Lead>(
  {
    leadId: { type: String, required: true, unique: true },
    currentStatus: String,
    currentAssignedEmployee: AssignedEmployeeSchema,
    customerService: CustomerServiceSchema,
    sourcing: SourcingSchema,
    shipping: ShippingSchema,
    sales: SalesSchema,
    logs: [LogSchema],
  },
  { timestamps: true }
);

// ---------------------
// Prevent OverwriteModelError (Next.js Hot Reload safe)
// ---------------------
const LeadModel = models.Lead || model<Lead>("Lead", LeadSchema);

export default LeadModel;
