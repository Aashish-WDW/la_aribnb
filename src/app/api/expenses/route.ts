import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const supabase = getServiceSupabase();

    try {
        let query = supabase
            .from('Expense')
            .select(`*, property:Property(name), room:Room(name)`)
            .eq('ownerId', userId)
            .order('date', { ascending: false });

        if (propertyId && propertyId !== 'all') {
            query = query.eq('propertyId', propertyId);
        }

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data: expenses, error } = await query;

        if (error) throw error;

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const body = await req.json();
        const { propertyId, roomId, description, amount, category, date } = body;

        if (!propertyId || !amount || !category || !date) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const { data: expense, error } = await supabase
            .from('Expense')
            .insert({
                propertyId,
                roomId: roomId || null,
                description,
                amount: parseFloat(amount),
                category,
                date: new Date(date).toISOString(),
                ownerId: userId,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Failed to create expense:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
