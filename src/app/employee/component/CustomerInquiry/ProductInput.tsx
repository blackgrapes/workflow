"use client";

import { Trash2 } from "lucide-react";
import Input from "./Input";

interface Product {
  id: number;
  name: string;
  qty: string;
  size: string;
  usage: string;
  price: string;
}

interface ProductInputProps {
  product: Product;
  index: number;
  removeProduct?: (id: number) => void;
  onChange: (id: number, field: keyof Product, value: string) => void;
  isRemovable?: boolean;
}

const ProductInput = ({ product, index, removeProduct, onChange, isRemovable = true }: ProductInputProps) => {
  return (
    <div className="border rounded-2xl p-6 bg-gray-50 shadow-md relative">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Product {index }</h3>
      {isRemovable && removeProduct && (
        <button
          type="button"
          onClick={() => removeProduct(product.id)}
          title="Remove this product"
          aria-label="Remove product"
          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
        >
          <Trash2 size={20} />
        </button>
      )}
      <div className="grid md:grid-cols-2 gap-5">
        <Input
          id={`name-${product.id}`}
          label="Product Name"
          placeholder="Product Name"
          value={product.name}
          onChange={(e) => onChange(product.id, "name", e.target.value)}
        />
        <Input
          id={`qty-${product.id}`}
          label="Quantity"
          placeholder="Quantity"
          value={product.qty}
          onChange={(e) => onChange(product.id, "qty", e.target.value)}
        />
        <Input
          id={`size-${product.id}`}
          label="Size"
          placeholder="Size"
          value={product.size}
          onChange={(e) => onChange(product.id, "size", e.target.value)}
        />
        <Input
          id={`usage-${product.id}`}
          label="Usage"
          placeholder="Usage"
          value={product.usage}
          onChange={(e) => onChange(product.id, "usage", e.target.value)}
        />
        <Input
          id={`price-${product.id}`}
          label="Target Price"
          placeholder="Target Price"
          value={product.price}
          onChange={(e) => onChange(product.id, "price", e.target.value)}
        />
      </div>
    </div>
  );
};

export default ProductInput;
