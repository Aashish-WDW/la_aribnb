import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const supabaseClient = await createClientServer();
        const { data: { user } } = await supabaseClient.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action } = await req.json();

        if (!action || !['increment', 'decrement'].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const supabase = getServiceSupabase();

        // Get current item
        const { data: item, error: fetchError } = await supabase
            .from('InventoryItem')
            .select('*, property:Property(ownerId)')
            .eq('id', id)
            .single();

        if (fetchError || !item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Verify ownership (either global or property owner)
        const isGlobal = !item.propertyId;
        const isOwner = item.property?.ownerId === userId;

        if (!isGlobal && !isOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Calculate new quantity
        const newQuantity = action === 'increment'
            ? item.quantity + 1
            : Math.max(0, item.quantity - 1);

        // Update quantity
        const { data: updated, error: updateError } = await supabase
            .from('InventoryItem')
            .update({ quantity: newQuantity, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Check for low stock and send notification
        if (item.lowStockThreshold && newQuantity <= item.lowStockThreshold && action === 'decrement') {
            await sendNotification(
                userId,
                'Low Stock Alert',
                `Reminder: We are running out of ${item.name}.`,
                'warning',
                { inventoryId: item.id, quantity: newQuantity }
            );
        }

        return NextResponse.json({
            ...updated,
            message: `Quantity ${action === 'increment' ? 'increased' : 'decreased'} successfully`
        });

    } catch (error: any) {
        console.error('Failed to update inventory quantity:', error);
        return NextResponse.json(
            { error: error.message || "Failed to update quantity" },
            { status: 500 }
        );
    }
}
