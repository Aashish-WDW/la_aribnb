import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const body = await req.json();
        const { name, quantity, description, link, imageUrl, propertyId } = body;

        // Verify ownership
        const { data: existing } = await supabase
            .from('InventoryItem')
            .select('ownerId')
            .eq('id', params.id)
            .single();

        if (!existing) return new NextResponse("Not Found", { status: 404 });
        if (existing.ownerId !== userId) return new NextResponse("Forbidden", { status: 403 });

        const { data: updated, error } = await supabase
            .from('InventoryItem')
            .update({
                name,
                quantity: quantity !== undefined ? parseInt(quantity) : undefined,
                description,
                link,
                imageUrl,
                propertyId: propertyId || null,
                updatedAt: new Date().toISOString()
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update inventory item:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        // Verify ownership
        const { data: existing } = await supabase
            .from('InventoryItem')
            .select('ownerId')
            .eq('id', params.id)
            .single();

        if (!existing) return new NextResponse("Not Found", { status: 404 });
        if (existing.ownerId !== userId) return new NextResponse("Forbidden", { status: 403 });

        const { error } = await supabase
            .from('InventoryItem')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Failed to delete inventory item:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
