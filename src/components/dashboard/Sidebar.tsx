"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Calendar,
    Home,
    Users,
    Settings,
    LayoutDashboard,
    LineChart,
    CheckSquare,
    LogOut,
    Package,
    UserPlus,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: LineChart },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "iCal Sync", href: "/dashboard/ical", icon: RefreshCw },
    { name: "Properties", href: "/dashboard/properties", icon: Home },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Invitations", href: "/dashboard/invitations", icon: UserPlus },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex flex-col w-64 glass-dark border-r border-white/10 h-screen sticky top-0">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
                <div className="relative w-10 h-10">
                    <img
                        src="/logo.png"
                        alt="LookAround Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    LookAround
                </span>
            </div>

            <nav className="flex-1 mt-6 px-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-brand-500 text-white shadow-premium"
                                    : "text-foreground/60 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5",
                                isActive ? "text-white" : "text-foreground/40 group-hover:text-brand-400"
                            )} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button className="flex items-center gap-3 w-full px-4 py-3 text-foreground/60 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group">
                    <LogOut className="w-5 h-5 text-foreground/40 group-hover:text-red-400" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
