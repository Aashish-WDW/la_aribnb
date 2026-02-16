import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

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
        // Ownership check can be done via RLS logic if we weren't using Service Key,
        // but with Service Key we must manually check or trust the query parameters carefully.
        // Safer to double check:
        const { data: existing } = await supabase.from('Expense').select('ownerId').eq('id', params.id).single();
        if (!existing || existing.ownerId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { error } = await supabase
            .from('Expense')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return new NextResponse("Error", { status: 500 });
    }
}
