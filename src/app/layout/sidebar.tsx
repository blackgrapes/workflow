"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  adminSidebar,
  employeeSidebar,
  managerSidebar,
  SidebarItem,
} from "./sidebarData";
import { useSession } from "@/lib/frontendApis/login/session";
import { useState } from "react";
import LoadingSkeleton from "../component/loading/loading";

export default function Sidebar({ className }: { className?: string }) {
  const { session, loading } = useSession(); // ✅ Get session from hook
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // ✅ Toggle submenus
  const toggleMenu = (item: SidebarItem) => {
    if (!item.children) return;
    setOpenMenus((prev) =>
      prev.includes(item.name)
        ? prev.filter((n) => n !== item.name)
        : [...prev, item.name]
    );
  };

  if (loading)
    return (
      <div>
        <LoadingSkeleton />
      </div>
    );

  if (!session) return null; // redirect handled by hook

  // ✅ Select menu items based on session role
  const menuItems: SidebarItem[] = (() => {
    switch (session.role) {
      case "admin":
        return adminSidebar;
      case "employee":
        return employeeSidebar;
      case "manager":
        return managerSidebar;
      default:
        console.warn("⚠️ Unknown role, no menu items:", session.role);
        return [];
    }
  })();

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white border-r flex flex-col transition-all duration-300 ${className}`}
    >
      {/* ================= Header (Logo + Collapse Button) ================= */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <span className="font-bold text-lg">Workflow</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* ================= Menu Items ================= */}
      <nav className="flex-1 px-2 mt-4 space-y-1 overflow-y-auto">
        {menuItems.length === 0 && (
          <div className="text-gray-400 text-sm">No menu items</div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isOpen = openMenus.includes(item.name);

          return (
            <div key={item.name}>
              {/* ===== Parent Item ===== */}
              {item.href && !item.children ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 p-2 rounded text-gray-700 hover:bg-gray-100 transition-colors ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center">
                    <Icon size={18} />
                  </span>
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              ) : (
                <div
                  onClick={() => toggleMenu(item)}
                  className={`flex items-center justify-between gap-3 p-2 rounded text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center">
                      <Icon size={18} />
                    </span>
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </div>
                  {!collapsed && item.children && (
                    <span>
                      {isOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* ===== Submenu ===== */}
              {!collapsed && isOpen && item.children && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.name}
                        href={child.href || "#"}
                        className="flex items-center gap-2 p-2 rounded text-gray-600 hover:bg-gray-100 text-sm"
                      >
                        <span className="w-4 h-4 flex items-center justify-center">
                          <ChildIcon size={14} />
                        </span>
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
