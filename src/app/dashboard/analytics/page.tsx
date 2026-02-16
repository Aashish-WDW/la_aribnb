"use client";

import { useState, useEffect } from "react";
import { Filter, Download, Plus, DollarSign, TrendingUp, TrendingDown, Percent, Calendar } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import ExpenseModal from "@/components/analytics/ExpenseModal";
import { downloadExcel } from "@/lib/export";

// Types
interface KPI {
    revenue: number;
    expenses: number;
    profit: number;
    bookings: number;
    adr: number;
    occupancy: number;
}

interface AnalyticsData {
    kpi: KPI;
    charts: {
        revenueByPlatform: any[];
        revenueOverTime: any[];
        profitOverTime: any[];
        expensesByCategory: any[];
    };
}

const COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#8E24AA', '#F06292'];

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<any[]>([]);

    // Filters
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]); // Start of month
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today

    // Modal
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    useEffect(() => {
        fetchProperties();
        fetchAnalytics();
    }, [selectedProperty, startDate, endDate]);

    const fetchProperties = async () => {
        const res = await fetch("/api/properties");
        if (res.ok) setProperties(await res.json());
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                propertyId: selectedProperty,
                startDate,
                endDate
            });
            const res = await fetch(`/api/analytics?${params}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data) return;

        // Export KPIs and key charts data
        downloadExcel(data.charts.revenueOverTime, `Revenue_Report_${startDate}_${endDate}`);
    };

    if (loading && !data) return <div className="p-20 text-center opacity-50">Crunching numbers...</div>;
    if (!data) return <div className="p-20 text-center">Failed to load data</div>;

    const { kpi, charts } = data;

    return (
        <div className="space-y-8">
            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSuccess={fetchAnalytics}
                properties={properties}
            />

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Analytics</h1>
                    <p className="text-foreground/60">Financial performance and operational insights</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold border border-white/10 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Record Expense
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-premium flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 opacity-50" />
                    <select
                        value={selectedProperty}
                        onChange={e => setSelectedProperty(e.target.value)}
                        className="bg-transparent font-bold [&>option]:bg-zinc-900 focus:outline-none"
                    >
                        <option value="all">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-50" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="bg-transparent font-medium focus:outline-none"
                    />
                    <span className="opacity-50">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-transparent font-medium focus:outline-none"
                    />
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard title="Total Revenue" value={`$${kpi.revenue.toLocaleString()}`} icon={DollarSign} trend="up" />
                <KPICard title="Expenses" value={`$${kpi.expenses.toLocaleString()}`} icon={TrendingDown} trend="down" color="red" />
                <KPICard title="Net Profit" value={`$${kpi.profit.toLocaleString()}`} icon={TrendingUp} trend="up" color="green" />
                <KPICard title="Bookings" value={kpi.bookings} icon={Calendar} />
                <KPICard title="Avg Nightly Rate" value={`$${kpi.adr}`} icon={DollarSign} />
                <KPICard title="Occupancy" value={`${kpi.occupancy}%`} icon={Percent} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Revenue Trend" className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={charts.revenueOverTime}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={d => d.slice(5)} />
                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <Area type="monotone" dataKey="amount" stroke="#4285F4" fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Revenue by Platform">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={charts.revenueByPlatform}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {charts.revenueByPlatform.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Expenses Breakdown">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={charts.expensesByCategory} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                            <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={100} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
                            <Bar dataKey="value" fill="#EA4335" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Profit vs Loss Trend">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={charts.profitOverTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tickFormatter={d => d.slice(5)} />
                            <YAxis stroke="rgba(255,255,255,0.5)" />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
                            <Bar dataKey="amount" fill="#34A853" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, trend, color = "brand" }: any) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-${color === 'red' ? 'red' : color === 'green' ? 'green' : 'brand'}-500/10`}>
                    <Icon className={`w-5 h-5 text-${color === 'red' ? 'red' : color === 'green' ? 'green' : 'brand'}-400`} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-${trend === 'up' ? 'green' : 'red'}-500/10 text-${trend === 'up' ? 'green' : 'red'}-400`}>
                        {trend === 'up' ? '↑' : '↓'}
                    </span>
                )}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-foreground/40 font-medium uppercase mt-1">{title}</div>
        </div>
    );
}

function ChartCard({ title, children, className = "" }: any) {
    return (
        <div className={`p-6 bg-white/5 border border-white/10 rounded-[2.5rem] ${className}`}>
            <h3 className="text-lg font-bold mb-6">{title}</h3>
            {children}
        </div>
    );
}
