import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

// GET telegram settings
export async function GET() {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const { data, error } = await supabase
            .from('TelegramSettings')
            .select('*')
            .eq('userId', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return NextResponse.json(data || { botToken: '', chatId: '', enabled: false });
    } catch (error) {
        console.error("Failed to fetch Telegram settings:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}

// POST/UPDATE telegram settings
export async function POST(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const body = await req.json();
        const { botToken, chatId, enabled } = body;

        // Upsert settings
        const { data, error } = await supabase
            .from('TelegramSettings')
            .upsert({
                userId,
                botToken,
                chatId,
                enabled: enabled ?? true,
                updatedAt: new Date().toISOString()
            }, {
                onConflict: 'userId'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to save Telegram settings:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
