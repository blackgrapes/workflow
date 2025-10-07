"use client";

import React from "react";

interface Props {
  id: string;
}

export default function shippingAddDetail({ id }: Props) {
  return (
    <div className="border p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold">shipping Lead</h2>
      <p>Showing details for Product/Lead ID: {id}</p>
    </div>
  );
}
