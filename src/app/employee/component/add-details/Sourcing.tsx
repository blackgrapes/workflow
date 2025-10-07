"use client";

import React from "react";

interface Props {
  id: string;
}

export default function SourcingAddDetail({ id }: Props) {
  return (
    <div className="border p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold">Sourcing Lead</h2>
      <p>Showing details for Product/Lead ID: {id}</p>
    </div>
  );
}
