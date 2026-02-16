import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const supabase = getServiceSupabase();

    try {
        let query = supabase
            .from('InventoryItem')
            .select(`
                *,
                property:Property(name)
            `)
            .eq('ownerId', userId)
            .order('createdAt', { ascending: false });

        if (propertyId) {
            // If filtering by property, we generally want items specifically assigned to it.
            // (Optionally, we could include global items here too, but simple filter is best for now)
            query = query.eq('propertyId', propertyId);
        }

        const { data: items, error } = await query;

        if (error) throw error;

        return NextResponse.json(items);
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
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
        const { name, quantity, description, link, imageUrl, propertyId } = body;

        if (!name || quantity === undefined) {
            return new NextResponse("Name and Quantity are required", { status: 400 });
        }

        const { data: item, error } = await supabase
            .from('InventoryItem')
            .insert({
                name,
                quantity: parseInt(quantity),
                description,
                link,
                imageUrl,
                propertyId: propertyId || null, // Null = Global
                ownerId: userId,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(item);
    } catch (error) {
        console.error("Failed to create inventory item:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
