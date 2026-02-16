import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = getServiceSupabase();

    try {
        const { data: properties, error } = await supabase
            .from('Property')
            .select(`
                *,
                rooms:Room(*)
            `)
            .eq('ownerId', userId);

        if (error) throw error;

        return NextResponse.json(properties);
    } catch (error) {
        console.error("Database error:", error);
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
        console.log("POST /api/properties Body:", JSON.stringify(body));
        const { name, description, rooms } = body;

        // 1. Create Property
        const { data: property, error: propError } = await supabase
            .from('Property')
            .insert({
                name,
                description,
                ownerId: userId,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (propError) throw propError;
        if (!property) throw new Error("Failed to create property record");

        // 2. Create Rooms if any
        if (rooms && rooms.length > 0) {
            const roomsData = rooms.map((room: any) => ({
                propertyId: property.id,
                name: room.name,
                basePrice: parseFloat(room.price || "0"),
                updatedAt: new Date().toISOString()
            }));

            const { error: roomError } = await supabase
                .from('Room')
                .insert(roomsData);

            if (roomError) {
                // Warning: Partial failure potential here (Property created, Rooms failed)
                // In a production app, we might want to delete the property if room creation fails.
                console.error("Failed to create rooms:", roomError);
                // We'll proceed but log it.
            }
        }

        // 3. Return full object
        const { data: fullProperty, error: fetchError } = await supabase
            .from('Property')
            .select(`
                *,
                rooms:Room(*)
            `)
            .eq('id', property.id)
            .single();

        if (fetchError) throw fetchError;

        return NextResponse.json(fullProperty);
    } catch (error: any) {
        console.error("Failed to create property ERROR:", error);
        return new NextResponse(JSON.stringify({
            error: "Database Error",
            message: error.message || error.details, // Supabase often puts details in .details or .message
            code: error.code
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
