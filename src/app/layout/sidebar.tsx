// src/app/(your-path)/component/Sidebar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from "lucide-react";
import {
  adminSidebar,
  employeeSidebar,
  managerSidebar,
  SidebarItem,
} from "./sidebarData";
import { useSession } from "@/lib/frontendApis/login/session";
import LoadingSkeleton from "../component/loading/loading";

type Props = {
  className?: string;
};

export default function Sidebar({ className = "" }: Props) {
  const { session, loading } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  if (loading) return <LoadingSkeleton />;
  if (!session) return null;

  const toggleMenu = (item: SidebarItem) => {
    if (!item.children) return;
    setOpenMenus((prev) =>
      prev.includes(item.name) ? prev.filter((n) => n !== item.name) : [...prev, item.name]
    );
  };

  const menuItems: SidebarItem[] = (() => {
    switch (session.role) {
      case "admin":
        return adminSidebar;
      case "manager":
        return managerSidebar;
      case "employee":
        if (session.department?.toLowerCase() === "customer service") {
          return [
            { name: "Add Leads", href: "/employee/add-leads", icon: PlusCircle },
            ...employeeSidebar,
          ];
        }
        return employeeSidebar;
      default:
        return [];
    }
  })();

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <aside
      className={`flex flex-col h-full bg-white border-r border-slate-200 ${collapsed ? "w-20" : "w-72"} transition-all duration-300 ${className}`}
      aria-label="Main sidebar"
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center rounded-md text-slate-800 font-bold ${collapsed ? "w-8 h-8" : "w-10 h-10"}`}
            aria-hidden
          >
            <div className="text-lg leading-none">W</div>
          </div>

          {!collapsed && <div className="text-sm font-semibold">Workflow</div>}
        </div>

        <button
          onClick={() => setCollapsed((s) => !s)}
          className="p-1 rounded hover:bg-slate-50"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>

      {/* nav */}
      <nav className="flex-1 px-1 py-3 overflow-y-auto">
        {menuItems.length === 0 && (
          <div className="text-xs text-slate-400 px-4">No menu items</div>
        )}

        <div className="space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isOpen = openMenus.includes(item.name);
            const active = isActive(item.href);

            return (
              <div key={`${item.name}-${idx}`} className="px-2">
                {/* single link */}
                {!item.children ? (
                  <Link
                    href={item.href || "#"}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      active ? "bg-sky-50 ring-1 ring-sky-100" : "hover:bg-slate-50"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <span className="w-6 h-6 flex items-center justify-center text-slate-600">
                      <Icon size={16} />
                    </span>
                    {!collapsed && (
                      <span className={`flex-1 text-sm ${active ? "text-slate-800 font-medium" : "text-slate-700"}`}>
                        {item.name}
                      </span>
                    )}
                  </Link>
                ) : (
                  <>
                    {/* parent */}
                    <div
                      onClick={() => toggleMenu(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") toggleMenu(item);
                      }}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        collapsed ? "justify-center" : ""
                      } ${isOpen ? "bg-slate-50" : "hover:bg-slate-50"}`}
                      title={collapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center text-slate-600">
                          <Icon size={16} />
                        </span>
                        {!collapsed && <span className="text-sm text-slate-700">{item.name}</span>}
                      </div>

                      {!collapsed && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* children */}
                    {!collapsed && isOpen && item.children && (
                      <div className="mt-1 ml-9 space-y-1">
                        {item.children.map((child, cidx) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <Link
                              href={child.href || "#"}
                              key={`${child.name}-${cidx}`}
                              className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                                childActive ? "bg-sky-50 ring-1 ring-sky-100" : "hover:bg-slate-50"
                              }`}
                            >
                              <span className="w-4 h-4 flex items-center justify-center text-slate-500">
                                <ChildIcon size={14} />
                              </span>
                              <span className={`text-sm ${childActive ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                                {child.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
