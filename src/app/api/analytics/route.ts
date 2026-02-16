import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, differenceInDays } from "date-fns";

export async function GET(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || 'all';
    const startDateStr = searchParams.get("startDate") || startOfMonth(new Date()).toISOString();
    const endDateStr = searchParams.get("endDate") || endOfMonth(new Date()).toISOString();

    const supabase = getServiceSupabase();

    try {
        // 1. Fetch Bookings (Revenue & Occupancy)
        let bookingQuery = supabase
            .from('Booking')
            .select(`
                id,
                propertyId,
                property:Property(name),
                price,
                checkIn,
                checkOut,
                source,
                roomId
            `)
            .gte('checkIn', startDateStr)
            .lte('checkIn', endDateStr);

        // Note: For strict accounting we might want overlapping bookings, 
        // but for simplicity we filter by checkIn date for now.

        if (propertyId !== 'all') {
            bookingQuery = bookingQuery.eq('propertyId', propertyId);
        } else {
            // Ensure we only get bookings for properties owned by user
            // We can filtering by joining Property but RLS handles it if we selected property.
            // Since we use service role, we must manually filter by owner properties.
            const { data: userProperties } = await supabase.from('Property').select('id').eq('ownerId', userId);
            const userPropIds = userProperties?.map(p => p.id) || [];
            bookingQuery = bookingQuery.in('propertyId', userPropIds);
        }

        const { data: bookings, error: bookingError } = await bookingQuery;
        if (bookingError) throw bookingError;

        // 2. Fetch Expenses
        let expenseQuery = supabase
            .from('Expense')
            .select('*')
            .eq('ownerId', userId)
            .gte('date', startDateStr)
            .lte('date', endDateStr);

        if (propertyId !== 'all') {
            expenseQuery = expenseQuery.eq('propertyId', propertyId);
        }

        const { data: expenses, error: expenseError } = await expenseQuery;
        if (expenseError) throw expenseError;

        // 3. Fetch Blocks (for Occupancy)
        // ... (Similar query to bookings if identifying blocked days)

        // --- Aggregation Logic ---

        // KPI: Revenue
        const totalRevenue = bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;

        // KPI: Expenses
        const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

        // KPI: Net Profit
        const netProfit = totalRevenue - totalExpenses;

        // KPI: Bookings Count
        const totalBookings = bookings?.length || 0;

        // KPI: ADR (Average Daily Rate)
        // Simple approx: Revenue / Bookings (or calculate total nights)
        // Let's calculate total nights
        let totalBookedNights = 0;
        bookings?.forEach(b => {
            const start = parseISO(b.checkIn);
            const end = parseISO(b.checkOut);
            const nights = differenceInDays(end, start);
            totalBookedNights += Math.max(1, nights);
        });
        const adr = totalBookedNights > 0 ? totalRevenue / totalBookedNights : 0;

        // KPI: Occupancy Rate
        // Available nights = (Days in range) * (Number of properties/rooms)
        // This is complex if filtering 'all' with variable property counts.
        // Simplified: (Total Booked Nights) / (Days in Range * 1 (per property unit)) 
        // We need accurate "inventory count" for denominator.
        const daysInPeriod = differenceInDays(parseISO(endDateStr), parseISO(startDateStr)) + 1;

        // Get property count
        let propertyCount = 1;
        if (propertyId === 'all') {
            const { count } = await supabase.from('Property').select('*', { count: 'exact', head: true }).eq('ownerId', userId);
            propertyCount = count || 1;
        }
        const totalAvailableNights = Math.max(1, daysInPeriod * propertyCount);
        const occupancyRate = (totalBookedNights / totalAvailableNights) * 100;


        // Charts: Revenue by Platform
        const revenueByPlatform: Record<string, number> = {};
        bookings?.forEach(b => {
            const source = b.source || 'Other';
            revenueByPlatform[source] = (revenueByPlatform[source] || 0) + b.price;
        });

        // Charts: Revenue Over Time (Daily)
        const revenueOverTime: Record<string, number> = {};
        const profitOverTime: Record<string, number> = {};

        // Initialize with 0
        const interval = eachDayOfInterval({ start: parseISO(startDateStr), end: parseISO(endDateStr) });
        interval.forEach(date => {
            const key = format(date, 'yyyy-MM-dd');
            revenueOverTime[key] = 0;
            profitOverTime[key] = 0;
        });

        bookings?.forEach(b => {
            // Attribution: Add full price to check-in date (Simple cash basis)
            const dateKey = format(parseISO(b.checkIn), 'yyyy-MM-dd');
            if (revenueOverTime[dateKey] !== undefined) {
                revenueOverTime[dateKey] += b.price;
                profitOverTime[dateKey] += b.price;
            }
        });

        expenses?.forEach(e => {
            const dateKey = format(parseISO(e.date), 'yyyy-MM-dd');
            if (profitOverTime[dateKey] !== undefined) {
                profitOverTime[dateKey] -= e.amount;
            }
        });

        const revenueChartData = Object.entries(revenueOverTime).map(([date, amount]) => ({ date, amount }));
        const profitChartData = Object.entries(profitOverTime).map(([date, amount]) => ({ date, amount }));

        // Charts: Expense Breakdown
        const expenseByCategory: Record<string, number> = {};
        expenses?.forEach(e => {
            const cat = e.category || 'Other';
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
        });

        return NextResponse.json({
            kpi: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: netProfit,
                bookings: totalBookings,
                adr: Math.round(adr),
                occupancy: Math.round(occupancyRate),
            },
            charts: {
                revenueByPlatform: Object.entries(revenueByPlatform).map(([name, value]) => ({ name, value })),
                revenueOverTime: revenueChartData,
                profitOverTime: profitChartData,
                expensesByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
            }
        });

    } catch (error) {
        console.error("Aggregation Error:", error);
        return new NextResponse("Internal Analytics Error", { status: 500 });
    }
}
