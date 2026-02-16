import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    // We check ownership first via the query
    const { data: property, error } = await supabase
        .from('Property')
        .select('*, rooms:Room(*)')
        .eq('id', id)
        .single(); // Returns null if not found or error if multiple? single() errors if 0 rows. maybe() returns null.

    if (error || !property) return new NextResponse("Not Found", { status: 404 });
    if (property.ownerId !== userId) return new NextResponse("Forbidden", { status: 403 });

    return NextResponse.json(property);
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        // verify ownership first
        const { data: property } = await supabase
            .from('Property')
            .select('ownerId')
            .eq('id', id)
            .single();

        if (!property) return new NextResponse("Not Found", { status: 404 });
        if (property.ownerId !== userId) return new NextResponse("Forbidden", { status: 403 });

        const { error } = await supabase
            .from('Property')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Failed to delete property:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const body = await req.json();
        const { name, description, rooms } = body;

        // Verify ownership
        const { data: property } = await supabase
            .from('Property')
            .select('ownerId')
            .eq('id', id)
            .single();

        if (!property) return new NextResponse("Not Found", { status: 404 });
        if (property.ownerId !== userId) return new NextResponse("Forbidden", { status: 403 });

        // Update Property Metadata
        const { error: updateError } = await supabase
            .from('Property')
            .update({
                name,
                description,
                updatedAt: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // Handle Rooms logic
        if (rooms && Array.isArray(rooms)) {
            // Get existing rooms to diff
            const { data: existingRooms } = await supabase
                .from('Room')
                .select('id')
                .eq('propertyId', id);

            const existingIds = new Set((existingRooms || []).map((r: any) => r.id));
            const keepIds = new Set();

            for (const room of rooms) {
                if (room.id && existingIds.has(room.id)) {
                    // Update
                    await supabase
                        .from('Room')
                        .update({
                            name: room.name,
                            basePrice: parseFloat(room.price || room.basePrice || "0"),
                            updatedAt: new Date().toISOString()
                        })
                        .eq('id', room.id);
                    keepIds.add(room.id);
                } else {
                    // Create
                    await supabase
                        .from('Room')
                        .insert({
                            propertyId: id,
                            name: room.name,
                            basePrice: parseFloat(room.price || room.basePrice || "0"),
                            updatedAt: new Date().toISOString()
                        });
                }
            }

            // Delete removed rooms
            const toDelete = (existingRooms || []).filter((r: any) => !keepIds.has(r.id)).map((r: any) => r.id);
            if (toDelete.length > 0) {
                await supabase
                    .from('Room')
                    .delete()
                    .in('id', toDelete);
            }
        }

        // Return updated object
        const { data: updatedProperty } = await supabase
            .from('Property')
            .select('*, rooms:Room(*)')
            .eq('id', id)
            .single();

        return NextResponse.json(updatedProperty);
    } catch (error) {
        console.error("Failed to update property:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
