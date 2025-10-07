import {
  LayoutDashboard,
  Users,
  ListChecks,
  ClipboardList,
  ClipboardType,
  FileDown,
  UserPlus,
  Inbox,
  ArrowRightCircle,
  PlusCircle,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// ✅ Sidebar Item type with optional children for nested submenu
export type SidebarItem = {
  name: string;
  href?: string;
  icon: LucideIcon;
  children?: SidebarItem[];
};

// ================= ADMIN =================
export const adminSidebar: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Employees Management",
    icon: Users,
    children: [
      { name: "All Employees", href: "/admin/employees", icon: Users },
      { name: "Add Employee", href: "/admin/employees/add", icon: UserPlus },
    ],
  },
{
    name: "Manage Leads",
    icon: ClipboardType,
    children: [
      {
        name: "All Leads",
        href: "/employee/all-leads",
        icon: ListChecks,
      },
      {
        name: "Pending / Not Forwarded",
        href: "/leads/forwardLeads",
        icon: Inbox,
      },
    ],
  },
  { name: "Audit Logs", href: "/admin/logs", icon: ClipboardList },
];

// ================= EMPLOYEE =================
export const employeeSidebar: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Add Leads",
    href: "/employee/add-leads",
    icon: PlusCircle,
  },
  {
    name: "Manage Leads",
    icon: ClipboardType,
    children: [
      {
        name: "All Leads",
        href: "/employee/all-leads",
        icon: ListChecks,
      },
      {
        name: "Pending / Not Forwarded",
        href: "/leads/forwardLeads",
        icon: Inbox,
      },
    ],
  },
];

// ================= MANAGER =================
export const managerSidebar: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Team Management",
    icon: Users,
    children: [
      { name: "All Employees", href: "/admin/employees", icon: Users },
      { name: "Add Employee", href: "/admin/employees/add", icon: UserPlus },
    ],
  },
  {
    name: "Leads Management",
    icon: ClipboardType,
    children: [
      { name: "All Leads", href: "/manager/all-leads", icon: ListChecks },
      { name: "Pending Leads", href: "/manager/pending-leads", icon: Inbox },
      {
        name: "Forwarded Leads",
        href: "/leads/forwardLeads",
        icon: ArrowRightCircle,
      },
    ],
  },
  {
    name: "Reports",
    href: "/manager/reports",
    icon: FileDown,
  },
];
