"use client";

import { Plus } from "lucide-react";
import Input from "./Input";
import ProductInput from "./ProductInput";

interface Product {
  id: number;
  name: string;
  qty: string;
  size: string;
  usage: string;
  price: string;
}

interface ProductSourcingFormProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  customerInfo: Record<string, string>;
  setCustomerInfo: (info: Record<string, string>) => void;
  onSubmit: () => void;
}

const ProductSourcingForm = ({ products, setProducts, customerInfo, setCustomerInfo, onSubmit }: ProductSourcingFormProps) => {

  const addProduct = () => {
    setProducts([...products, { id: products.length + 1, name: "", qty: "", size: "", usage: "", price: "" }]);
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleProductChange = (id: number, field: string, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleCustomerChange = (field: string, value: string) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  return (
    <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="grid md:grid-cols-2 gap-6">
        <Input id="customerName" label="Customer Name" placeholder="Enter customer name" value={customerInfo.customerName} onChange={(e) => handleCustomerChange("customerName", e.target.value)} />
        <Input id="contactNumber" label="Contact Number" placeholder="Enter contact number" value={customerInfo.contactNumber} onChange={(e) => handleCustomerChange("contactNumber", e.target.value)} />
        <Input id="address" label="Address" placeholder="Enter address" value={customerInfo.address} onChange={(e) => handleCustomerChange("address", e.target.value)} />
        <Input id="city" label="City" placeholder="Enter city" value={customerInfo.city} onChange={(e) => handleCustomerChange("city", e.target.value)} />
        <Input id="state" label="State" placeholder="Enter state" value={customerInfo.state} onChange={(e) => handleCustomerChange("state", e.target.value)} />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">Products</h2>
        {products.map((product, idx) => (
          <ProductInput
            key={product.id}
            product={product}
            index={idx}
            removeProduct={removeProduct}
            onChange={handleProductChange}
            isRemovable={products.length > 1}
          />
        ))}

        <button type="button" onClick={addProduct} className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition text-base">
          <Plus size={20} /> Add Another Product
        </button>
      </div>

      <div className="text-center">
        <button type="submit" className="px-10 py-4 bg-teal-600 text-white rounded-2xl shadow-lg hover:bg-teal-700 transition text-lg font-semibold">
          Submit Inquiry
        </button>
      </div>
    </form>
  );
};

export default ProductSourcingForm;
