"use client";

import { ReactNode, useState } from "react";
import { User, ShieldCheck, Building2, LogIn, Loader2, Eye, EyeOff } from "lucide-react";

// Employee type
export type EmployeeType = "employee" | "manager" | "admin";

interface LoginFormProps {
  onLogin: (type: EmployeeType, empId: string, password: string) => Promise<void>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [type, setType] = useState<EmployeeType>("employee");
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Type icons & colors
  const typeStyles: Record<EmployeeType, { icon: ReactNode; bg: string }> = {
    employee: { icon: <User className="w-6 h-6 text-white" />, bg: "bg-blue-500" },
    manager: { icon: <ShieldCheck className="w-6 h-6 text-white" />, bg: "bg-purple-500" },
    admin: { icon: <Building2 className="w-6 h-6 text-white" />, bg: "bg-red-500" },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(type, empId, password);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${typeStyles[type].bg}`}
        >
          {typeStyles[type].icon}
        </div>
        <h1 className="text-3xl font-bold mt-4 text-gray-800">Login</h1>
        <p className="text-gray-500 text-sm mt-1">Select type to continue</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Selection */}
        <div>
          <label htmlFor="type" className="block text-gray-700 font-medium mb-2">
            Select Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as EmployeeType)}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Employee ID */}
        <div>
          <label htmlFor="empId" className="block text-gray-700 font-medium mb-2">
            Employee ID
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="empId"
              type="text"
              required
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              placeholder="EMP001"
              className="w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg shadow-lg font-medium text-lg transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Workflow Management System
      </p>
    </div>
  );
}
