"use client";

import React from "react";

interface InputProps {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
  multiple?: boolean;
  value?: string; // controlled value for text inputs
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // change handler
  disabled?: boolean; // support disabled state
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  placeholder,
  type = "text",
  multiple = false,
  value = "",       // default for text inputs
  onChange,
  disabled = false,
}) => {
  const isFileInput = type === "file";

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-semibold mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        multiple={multiple}
        {...(!isFileInput ? { value, onChange } : { onChange })} 
        // ✅ only pass value for non-file inputs
        disabled={disabled}
        className={`w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
};

export default Input;
