import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

// GET — List all saved iCal feeds for the authenticated user
export async function GET() {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const { data: feeds, error } = await supabase
            .from("ICalFeed")
            .select(`
                *,
                property:Property(id, name)
            `)
            .eq("userId", user.id)
            .order("createdAt", { ascending: false });

        if (error) throw error;

        return NextResponse.json(feeds || []);
    } catch (error) {
        console.error("Failed to fetch iCal feeds:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}

// POST — Add a new iCal feed
export async function POST(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const { name, url, propertyId } = await req.json();

        if (!name || !url || !propertyId) {
            return NextResponse.json(
                { error: "Name, URL, and property are required" },
                { status: 400 }
            );
        }

        // Validate the URL format
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            );
        }

        const { data: feed, error } = await supabase
            .from("ICalFeed")
            .insert({
                userId: user.id,
                propertyId,
                name,
                url,
            })
            .select(`
                *,
                property:Property(id, name)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json(feed);
    } catch (error: any) {
        console.error("Failed to create iCal feed:", error);
        return NextResponse.json(
            { error: error.message || "Database Error" },
            { status: 500 }
        );
    }
}

// DELETE — Remove a saved feed
export async function DELETE(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const { searchParams } = new URL(req.url);
        const feedId = searchParams.get("id");

        if (!feedId) {
            return NextResponse.json({ error: "Feed ID required" }, { status: 400 });
        }

        // Ensure user owns this feed
        const { error } = await supabase
            .from("ICalFeed")
            .delete()
            .eq("id", feedId)
            .eq("userId", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete iCal feed:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
