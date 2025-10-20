// src/app/(your-path)/component/LoginFormWithHero.tsx
"use client";

import { ReactNode, useState } from "react";
import {
  User,
  ShieldCheck,
  Building2,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export type EmployeeType = "employee" | "manager" | "admin";

interface LoginFormProps {
  onLogin: (type: EmployeeType, empId: string, password: string) => Promise<void>;
}

/**
 * Layout:
 * - On small screens: stacked (image on top)
 * - On md+ screens: 2-column layout (form left, image right)
 *
 * Replace HERO_IMAGE_URL with your preferred image if needed.
 */
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=6d6b0d1f6e2a0f6d8a3a5d3f0ead7f9b";

export default function LoginFormWithHero({ onLogin }: LoginFormProps) {
  const [type, setType] = useState<EmployeeType>("employee");
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeStyles: Record<EmployeeType, { icon: ReactNode; bg: string }> = {
    employee: { icon: <User className="w-6 h-6 text-white" />, bg: "bg-blue-500" },
    manager: { icon: <ShieldCheck className="w-6 h-6 text-white" />, bg: "bg-purple-500" },
    admin: { icon: <Building2 className="w-6 h-6 text-white" />, bg: "bg-rose-500" },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(type, empId.trim(), password);
    } catch (err) {
      // show a short friendly error (caller can throw a message)
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white/0 rounded-2xl overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2">
        {/* LEFT: Form */}
        <div className="bg-white p-8 md:p-12 flex items-center">
          <div className="w-full max-w-md mx-auto">
            {/* avatar & heading */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${typeStyles[type].bg}`}
              >
                {typeStyles[type].icon}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">Welcome back</h2>
                <p className="text-sm text-slate-500">Sign in to continue to Workflow</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type select */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-2">
                  Sign in as
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("employee")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      type === "employee"
                        ? "bg-sky-50 border border-sky-200 text-slate-800"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("manager")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      type === "manager"
                        ? "bg-sky-50 border border-sky-200 text-slate-800"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("admin")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      type === "admin"
                        ? "bg-sky-50 border border-sky-200 text-slate-800"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label htmlFor="empId" className="block text-sm font-medium text-slate-700 mb-2">
                  Employee ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="empId"
                    type="text"
                    required
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. EMP001"
                    className="w-full border rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && <div className="text-sm text-rose-600">{error}</div>}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg text-white font-semibold transition ${
                  loading ? "bg-teal-600/80 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                <span>{loading ? "Signing in..." : "Sign in"}</span>
              </button>
            </form>

            {/* footer small */}
            <p className="mt-6 text-xs text-slate-400 text-center">
              © {new Date().getFullYear()} Workflow Management System
            </p>
          </div>
        </div>

        {/* RIGHT: Hero image / marketing */}
        <div className="relative hidden md:block">
          <img
            src={HERO_IMAGE_URL}
            alt="Team collaboration"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent flex items-end">
            <div className="p-8 text-white max-w-md">
              <h3 className="text-2xl font-semibold drop-shadow">Welcome to Workflow</h3>
              <p className="mt-2 text-sm drop-shadow">
                Centralize leads, track teams, and speed up operations — all in one place.
              </p>
              <ul className="mt-4 text-sm space-y-2">
                <li>• Realtime team tracking</li>
                <li>• Simple lead management</li>
                <li>• Clean, focused UI</li>
              </ul>
            </div>
          </div>
        </div>

        {/* For small screens show image below form (optional) */}
        <div className="md:hidden">
          <img
            src={HERO_IMAGE_URL}
            alt="Team collaboration"
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
