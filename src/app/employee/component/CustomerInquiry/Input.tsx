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
  readOnly?: boolean; // ✅ added readOnly support
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  placeholder,
  type = "text",
  multiple = false,
  value = "", // default for text inputs
  onChange,
  disabled = false,
  readOnly = false, // ✅ default false
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
        // ✅ only pass value for non-file inputs
        {...(!isFileInput
          ? { value, onChange: !readOnly ? onChange : undefined }
          : { onChange })}
        disabled={disabled}
        readOnly={readOnly} // ✅ apply readOnly properly
        className={`w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""}`} // ✅ subtle gray bg for readonly
      />
    </div>
  );
};

export default Input;
