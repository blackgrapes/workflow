"use client";

import Input from "./Input";

interface ShippingHelpFormProps {
  shippingInfo: Record<string, string>;
  setShippingInfo: (info: Record<string, string>) => void;
  onSubmit: () => void;
}

const fields = ["Item Name", "Total CTN", "Total CBM", "Total KG", "Total Value", "Total PCS", "HSN Code", "Shipment Mode"];

const ShippingHelpForm = ({ shippingInfo, setShippingInfo, onSubmit }: ShippingHelpFormProps) => {
  const handleChange = (field: string, value: string) => {
    setShippingInfo({ ...shippingInfo, [field]: value });
  };

  return (
    <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="grid md:grid-cols-2 gap-6">
        <Input id="s-customerName" label="Customer Name" placeholder="Enter customer name" value={shippingInfo.customerName} onChange={(e) => handleChange("customerName", e.target.value)} />
        <Input id="s-contactNumber" label="Contact Number" placeholder="Enter contact number" value={shippingInfo.contactNumber} onChange={(e) => handleChange("contactNumber", e.target.value)} />
        <Input id="s-address" label="Address" placeholder="Enter address" value={shippingInfo.address} onChange={(e) => handleChange("address", e.target.value)} />
        <Input id="s-city" label="City" placeholder="Enter city" value={shippingInfo.city} onChange={(e) => handleChange("city", e.target.value)} />
        <Input id="s-state" label="State" placeholder="Enter state" value={shippingInfo.state} onChange={(e) => handleChange("state", e.target.value)} />
      </div>

      <div className="border rounded-2xl p-6 bg-gray-50 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Shipping Product Details</h3>
        <div className="grid md:grid-cols-2 gap-5">
          {fields.map((field, idx) => (
            <Input key={idx} id={`ship-${idx}`} label={field} placeholder={field} value={shippingInfo[field] || ""} onChange={(e) => handleChange(field, e.target.value)} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-5 mt-4">
          <Input id="invoice" label="Upload Invoice" type="file" />
          <Input id="packing" label="Upload Packing List" type="file" />
        </div>
      </div>

      <div className="text-center">
        <button type="submit" className="px-10 py-4 bg-teal-600 text-white rounded-2xl shadow-lg hover:bg-teal-700 transition text-lg font-semibold">
          Submit Shipping Help
        </button>
      </div>
    </form>
  );
};

export default ShippingHelpForm;
