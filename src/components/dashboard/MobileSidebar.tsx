"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
    UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { User } from "lucide-react";

const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: LineChart },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Properties", href: "/dashboard/properties", icon: Home },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Invitations", href: "/dashboard/invitations", icon: UserPlus },
    { name: "Team", href: "/dashboard/team", icon: Users },
];

export default function MobileSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, []);

    const handleSignIn = () => {
        setIsOpen(false);
        router.push("/login");
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2 -ml-2 text-foreground/60 hover:text-white transition-colors"
            >
                <Menu className="w-6 h-6" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-[#0a0a0a] border-r border-white/10 z-50 md:hidden flex flex-col"
                        >
                            <div className="p-6 flex items-center justify-between border-b border-white/10">
                                <div className="flex items-center gap-3">
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
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 -mr-2 text-foreground/60 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
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

                            <div className="p-4 border-t border-white/10 space-y-4">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-foreground/40" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white truncate max-w-[120px]">
                                                {user?.email?.split('@')[0]}
                                            </span>
                                            <span className="text-[10px] text-foreground/40 truncate max-w-[120px]">
                                                {user?.email}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="p-2 text-foreground/40 hover:text-red-400 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
