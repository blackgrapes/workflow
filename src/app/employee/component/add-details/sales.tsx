"use client";

import React from "react";

interface Props {
  id: string;
}

export default function Sales({ id }: Props) {
  return (
    <div className="border p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold">Sales Lead</h2>
      <p>Details for Lead ID: {id}</p>
    </div>
  );
}
