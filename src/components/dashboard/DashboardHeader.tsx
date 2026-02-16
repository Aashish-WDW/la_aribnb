"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Bell, Search, User, LogOut } from "lucide-react";
import MobileSidebar from "./MobileSidebar";
import NotificationCenter from "@/components/NotificationCenter";

export default function DashboardHeader() {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <header className="h-20 border-b border-white/10 sticky top-0 z-40">
            {/* Background with blur */}
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm -z-10" />

            <div className="h-full flex items-center justify-between px-4 md:px-8 relative">
                <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-xl">
                    <MobileSidebar />
                    <div className="relative group w-full md:w-auto hidden sm:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-brand-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full md:w-80 bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    <div className="group relative">
                        <button className="w-10 h-10 rounded-full border-2 border-brand-500/20 hover:border-brand-500/40 transition-colors flex items-center justify-center bg-white/5 overflow-hidden">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-foreground/40" />
                            )}
                        </button>
                        <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-900 border border-white/10 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="px-4 py-2 border-b border-white/5 mb-1">
                                <p className="text-xs text-foreground/40 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground/60 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
