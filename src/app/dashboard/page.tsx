"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    TrendingUp,
    Calendar as CalendarIcon,
    Home as HomeIcon,
    Users as UsersIcon
} from "lucide-react";

export default function DashboardPage() {
    const [stats, setStats] = useState([
        { name: "Total Bookings", value: "0", icon: CalendarIcon, color: "text-blue-400" },
        { name: "Occupancy Rate", value: "0%", icon: TrendingUp, color: "text-emerald-400" },
        { name: "Active Listings", value: "0", icon: HomeIcon, color: "text-brand-400" },
        { name: "Team Members", value: "0", icon: UsersIcon, color: "text-purple-400" },
    ]);
    const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
    const [platformMix, setPlatformMix] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel instead of sequential
                const [analyticsRes, propertiesRes, bookingsRes] = await Promise.all([
                    fetch("/api/analytics"),
                    fetch("/api/properties"),
                    fetch("/api/bookings")
                ]);

                const [analytics, properties, bookingsData] = await Promise.all([
                    analyticsRes.ok ? analyticsRes.json() : null,
                    propertiesRes.ok ? propertiesRes.json() : [],
                    bookingsRes.ok ? bookingsRes.json() : { bookings: [] }
                ]);

                const now = new Date();
                const upcoming = (bookingsData.bookings || [])
                    .filter((b: any) => new Date(b.checkOut) >= now)
                    .slice(0, 5);

                setUpcomingBookings(upcoming);

                // Update Stats
                if (analytics) {
                    setStats([
                        { name: "Total Bookings", value: analytics.kpi.bookings.toString(), icon: CalendarIcon, color: "text-blue-400" },
                        { name: "Occupancy Rate", value: `${analytics.kpi.occupancy}%`, icon: TrendingUp, color: "text-emerald-400" },
                        { name: "Active Listings", value: properties.length.toString(), icon: HomeIcon, color: "text-brand-400" },
                        { name: "Team Members", value: "1", icon: UsersIcon, color: "text-purple-400" },
                    ]);
                    setPlatformMix(analytics.charts.revenueByPlatform || []);
                }
            } catch (error) {
                console.error("Dashboard Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-20 text-center opacity-50">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-foreground/60">Here is what's happening with your properties today.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass p-6 rounded-3xl group hover:bg-white/10 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <span className="text-sm font-medium text-foreground/60">{stat.name}</span>
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Bookings */}
                <div className="lg:col-span-2 glass rounded-[2.5rem] p-8">
                    <h2 className="text-xl font-bold mb-6">Upcoming Bookings</h2>
                    <div className="space-y-4">
                        {upcomingBookings.length > 0 ? (
                            upcomingBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center text-lg font-bold text-brand-400">
                                            {booking.customerName.split(' ').map((n: string) => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="font-bold">{booking.customerName}</div>
                                            <div className="text-sm text-foreground/40">
                                                {booking.property?.name} {booking.room?.name ? `• ${booking.room.name}` : ''} • {booking.source}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-sm">
                                            {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
                                            {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-brand-400 capitalize">{booking.status || 'Confirmed'}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center opacity-40 border-2 border-dashed border-white/5 rounded-3xl">
                                No upcoming bookings found
                            </div>
                        )}
                    </div>
                </div>

                {/* Platform Mix */}
                <div className="glass rounded-[2.5rem] p-8">
                    <h2 className="text-xl font-bold mb-6">Platform Mix</h2>
                    <div className="space-y-6">
                        {platformMix.length > 0 ? (
                            platformMix.map((mix) => {
                                const total = platformMix.reduce((a, b) => a + b.value, 0);
                                const percent = Math.round((mix.value / (total || 1)) * 100);
                                let color = "bg-brand-500";
                                if (mix.name === "Booking.com") color = "bg-blue-500";
                                if (mix.name === "Direct") color = "bg-emerald-500";
                                if (mix.name === "Other") color = "bg-purple-500";

                                return (
                                    <PlatformStat
                                        key={mix.name}
                                        label={mix.name}
                                        percent={percent}
                                        color={color}
                                    />
                                );
                            })
                        ) : (
                            <div className="text-center opacity-40 py-8">No data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlatformStat({ label, percent, color }: { label: string, percent: number, color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-foreground/60">{label}</span>
                <span className="font-bold">{percent}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    );
}
