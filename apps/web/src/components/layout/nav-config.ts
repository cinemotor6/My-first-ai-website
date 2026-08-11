import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LineChart,
  Calculator,
  Briefcase,
  Newspaper,
  Globe2,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: { label: string; href: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: LineChart },
  {
    label: "Valuation",
    href: "/valuation/dcf",
    icon: Calculator,
    children: [
      { label: "DCF Calculator", href: "/valuation/dcf" },
      { label: "Monte Carlo", href: "/valuation/monte-carlo" },
      { label: "Scenario Analysis", href: "/valuation/scenarios" },
    ],
  },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Macro", href: "/macro", icon: Globe2 },
];
