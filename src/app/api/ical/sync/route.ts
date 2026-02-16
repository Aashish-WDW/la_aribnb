import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";
import { parseICalFeed } from "@/lib/ical";

// POST — Fetch external iCal URL, parse events, and create bookings
export async function POST(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const { feedId } = await req.json();

        if (!feedId) {
            return NextResponse.json({ error: "Feed ID required" }, { status: 400 });
        }

        // 1. Get the feed details
        const { data: feed, error: feedError } = await supabase
            .from("ICalFeed")
            .select("*")
            .eq("id", feedId)
            .eq("userId", user.id)
            .single();

        if (feedError || !feed) {
            return NextResponse.json({ error: "Feed not found" }, { status: 404 });
        }

        // 2. Fetch the external iCal URL
        let icsText: string;
        try {
            const response = await fetch(feed.url, {
                headers: { "User-Agent": "LookAround/1.0" },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            icsText = await response.text();
        } catch (fetchError: any) {
            return NextResponse.json(
                { error: `Failed to fetch iCal feed: ${fetchError.message}` },
                { status: 502 }
            );
        }

        // 3. Parse the iCal data
        const events = parseICalFeed(icsText);

        if (events.length === 0) {
            // Update lastSynced even if no events
            await supabase
                .from("ICalFeed")
                .update({ lastSynced: new Date().toISOString() })
                .eq("id", feedId);

            return NextResponse.json({
                imported: 0,
                skipped: 0,
                message: "No events found in feed",
            });
        }

        // 4. Get existing iCal-sourced bookings for this property to avoid duplicates
        const { data: existingBookings } = await supabase
            .from("Booking")
            .select("icalUid")
            .eq("propertyId", feed.propertyId)
            .eq("source", "ICAL")
            .not("icalUid", "is", null);

        const existingUids = new Set(
            (existingBookings || []).map((b: any) => b.icalUid)
        );

        // 5. Create new bookings for events that don't already exist
        let imported = 0;
        let skipped = 0;

        for (const event of events) {
            if (existingUids.has(event.uid)) {
                skipped++;
                continue;
            }

            const { error: insertError } = await supabase
                .from("Booking")
                .insert({
                    propertyId: feed.propertyId,
                    customerName: event.summary || "iCal Import",
                    checkIn: event.dtstart.toISOString(),
                    checkOut: event.dtend.toISOString(),
                    price: 0,
                    source: "ICAL",
                    icalUid: event.uid,
                    notes: event.description || `Imported from: ${feed.name}`,
                    status: "CONFIRMED",
                    guestCount: 1,
                    updatedAt: new Date().toISOString(),
                });

            if (!insertError) {
                imported++;
            } else {
                console.error("Failed to insert iCal booking:", insertError);
                skipped++;
            }
        }

        // 6. Update lastSynced
        await supabase
            .from("ICalFeed")
            .update({ lastSynced: new Date().toISOString() })
            .eq("id", feedId);

        return NextResponse.json({
            imported,
            skipped,
            total: events.length,
            message: `Imported ${imported} events, skipped ${skipped} duplicates`,
        });
    } catch (error: any) {
        console.error("iCal sync failed:", error);
        return NextResponse.json(
            { error: error.message || "Sync failed" },
            { status: 500 }
        );
    }
}
