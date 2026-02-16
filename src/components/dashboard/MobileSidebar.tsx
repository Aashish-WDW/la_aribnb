"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Calendar,
    Home,
    Users,
    LayoutDashboard,
    LineChart,
    CheckSquare,
    LogOut,
    Package,
    Menu,
    X,
    UserPlus,
    User,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: LineChart },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Sync Calendar", href: "/dashboard/sync-calendar", icon: RefreshCw },
    { name: "iCal Sync", href: "/dashboard/ical", icon: RefreshCw },
    { name: "Properties", href: "/dashboard/properties", icon: Home },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Invitations", href: "/dashboard/invitations", icon: UserPlus },
    { name: "Team", href: "/dashboard/team", icon: Users },
];

export default function MobileSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        console.log("MobileSidebar mounted, portal target:", document.body);
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, []);

    console.log("MobileSidebar render - isOpen:", isOpen, "mounted:", mounted);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2 text-foreground/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[9999] md:hidden">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
                            />

                            {/* Menu Content */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="relative h-full flex flex-col pt-24 pb-8 px-6 overflow-y-auto"
                            >
                                {/* Close Button (Top Right) */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-6 right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                {/* Logo (Top Left) */}
                                <div className="absolute top-6 left-6 flex items-center gap-2">
                                    <div className="relative w-8 h-8">
                                        <img
                                            src="/logo.png"
                                            alt="LookAround Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                        LookAround
                                    </span>
                                </div>

                                {/* Navigation Links */}
                                <div className="flex flex-col space-y-1 mb-12">
                                    {navigation.map((item, index) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-4 text-lg font-medium rounded-2xl transition-all",
                                                    isActive
                                                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                                )}
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <item.icon className={cn(
                                                    "w-6 h-6",
                                                    isActive ? "text-white" : "text-slate-400"
                                                )} />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* User Profile & Sign Out (Bottom) */}
                                <div className="mt-auto pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                                                {user?.user_metadata?.avatar_url ? (
                                                    <img
                                                        src={user.user_metadata.avatar_url}
                                                        alt="User"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-lg font-semibold text-white truncate max-w-[180px]">
                                                    {user?.email?.split("@")[0]}
                                                </span>
                                                <span className="text-sm text-slate-400 truncate max-w-[180px]">
                                                    {user?.email}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="p-3 text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 rounded-2xl transition-all"
                                        >
                                            <LogOut className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
