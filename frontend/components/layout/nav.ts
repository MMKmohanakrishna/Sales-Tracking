import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  PlusCircle,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/frames", label: "Photo Frames", icon: ImageIcon },
  { href: "/sales/new", label: "New Sale", icon: PlusCircle, primary: true },
  { href: "/outstanding", label: "Money to Collect", icon: Wallet },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom nav on mobile shows the 4 most-used destinations + a "More" menu.
export const bottomNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/sales/new", label: "New Sale", icon: PlusCircle, primary: true },
  { href: "/outstanding", label: "Collect", icon: Wallet },
];

export const moreNavItems = [
  { href: "/frames", label: "Photo Frames", icon: ImageIcon },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];
