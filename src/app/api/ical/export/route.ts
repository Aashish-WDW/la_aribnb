import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";
import { generateICalFeed } from "@/lib/ical";

// GET ?propertyId=xxx — Export bookings for a property as .ics
// This route is PUBLIC (no auth) so external platforms like Airbnb can fetch it.
// Security: the propertyId UUID acts as the secret token.
export async function GET(req: Request) {
    const supabase = getServiceSupabase();

    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");

        if (!propertyId) {
            return NextResponse.json(
                { error: "propertyId is required" },
                { status: 400 }
            );
        }

        // Fetch property (no ownership check — this is a public feed URL)
        const { data: property, error: propError } = await supabase
            .from("Property")
            .select("id, name")
            .eq("id", propertyId)
            .single();

        if (propError || !property) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        // Fetch all non-cancelled bookings for this property
        const { data: bookings, error: bookError } = await supabase
            .from("Booking")
            .select("id, customerName, checkIn, checkOut, source, notes")
            .eq("propertyId", propertyId)
            .neq("status", "CANCELLED")
            .order("checkIn", { ascending: true });

        if (bookError) throw bookError;

        const icsContent = generateICalFeed(bookings || [], property.name);

        return new NextResponse(icsContent, {
            status: 200,
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="${property.name.replace(/[^a-zA-Z0-9]/g, "_")}_calendar.ics"`,
                // Allow caching for 5 minutes so Airbnb doesn't hammer the endpoint
                "Cache-Control": "public, max-age=300, s-maxage=300",
            },
        });
    } catch (error) {
        console.error("Failed to export iCal:", error);
        return new NextResponse("Export Error", { status: 500 });
    }
}
