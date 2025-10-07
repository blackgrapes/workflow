"use client";

import { useState } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/frontendApis/login/session";
import NavbarSkeleton from "../component/loading/NavbarSkeleton";

export default function Navbar() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/");
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
       <NavbarSkeleton/>
      </header>
    );
  }

  if (!session) return null; // Session required

  const { name, role, department } = session;

  return (
    <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* Left side - Page/Section Title */}
      <div className="font-semibold text-lg tracking-wide text-gray-800">
        Dashboard{" "}
        {department &&
          `- ${
            role === "admin"
              ? "Admin"
              : role === "manager"
              ? "Manager"
              : department
          } Dashboard`}
      </div>

      {/* Right side - User Info + Settings */}
      <div className="flex items-center gap-4 relative">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{name || session.employeeId}</span>
          <button
            type="button"
            aria-label="User profile"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <User className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Settings Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-700" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
