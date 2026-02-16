import { createClient } from "@supabase/supabase-js";

// GET ?propertyId=xxx — Export bookings for a property as .ics
// This route is PUBLIC (no auth) so external platforms like Airbnb can fetch it.
// Security: the propertyId UUID acts as the secret token.
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("propertyId");

        if (!propertyId) {
            return icsError("propertyId query parameter is required");
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            console.error("Missing Supabase env vars for iCal export");
            return icsError("Server configuration error");
        }

        const supabase = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        // Fetch property
        const { data: property, error: propError } = await supabase
            .from("Property")
            .select("id, name")
            .eq("id", propertyId)
            .single();

        if (propError || !property) {
            return icsEmpty("Unknown Property");
        }

        // Fetch all non-cancelled bookings for this property
        const { data: bookings, error: bookError } = await supabase
            .from("Booking")
            .select("id, customerName, checkIn, checkOut, source, notes")
            .eq("propertyId", propertyId)
            .neq("status", "CANCELLED")
            .order("checkIn", { ascending: true });

        if (bookError) {
            console.error("iCal export booking fetch error:", bookError);
            return icsEmpty(property.name);
        }

        const icsContent = buildICS(bookings || [], property.name);

        return new Response(icsContent, {
            status: 200,
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="${safeName(property.name)}_calendar.ics"`,
                "Cache-Control": "public, max-age=300, s-maxage=300",
            },
        });
    } catch (error) {
        console.error("iCal export unhandled error:", error);
        return icsEmpty("Calendar");
    }
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Return an empty but valid .ics so Airbnb never sees HTML */
function icsEmpty(calName: string): Response {
    const now = toICalUTC(new Date());
    const body = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LookAround//Export//EN",
        `X-WR-CALNAME:${calName}`,
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        // RFC 5545 requires at least one component
        "BEGIN:VEVENT",
        `UID:placeholder@lookaround.app`,
        `DTSTAMP:${now}`,
        `DTSTART:${now}`,
        `DTEND:${now}`,
        "SUMMARY:No bookings",
        "STATUS:CANCELLED",
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");

    return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
}

/** Return an error wrapped inside a valid .ics file */
function icsError(message: string): Response {
    const now = toICalUTC(new Date());
    const body = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LookAround//Export//EN",
        `X-WR-CALNAME:Error - ${message}`,
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        // RFC 5545 requires at least one component
        "BEGIN:VEVENT",
        `UID:error@lookaround.app`,
        `DTSTAMP:${now}`,
        `DTSTART:${now}`,
        `DTEND:${now}`,
        `SUMMARY:${escapeICalText(message)}`,
        "STATUS:CANCELLED",
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");

    return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
}

/** Build a valid .ics string with UTC datetimes */
function buildICS(
    bookings: Array<{
        id: string;
        customerName: string;
        checkIn: string;
        checkOut: string;
        source?: string;
        notes?: string;
    }>,
    calendarName: string
): string {
    const now = toICalUTC(new Date());

    const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LookAround//Export//EN",
        `X-WR-CALNAME:${calendarName}`,
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ];

    // RFC 5545 requires at least one component — add placeholder if no bookings
    if (bookings.length === 0) {
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:empty-${calendarName.replace(/\s/g, "-")}@lookaround.app`);
        lines.push(`DTSTAMP:${now}`);
        lines.push(`DTSTART:${now}`);
        lines.push(`DTEND:${now}`);
        lines.push("SUMMARY:No bookings");
        lines.push("STATUS:CANCELLED");
        lines.push("TRANSP:TRANSPARENT");
        lines.push("END:VEVENT");
    }

    for (const b of bookings) {
        const dtstart = toICalUTC(new Date(b.checkIn));
        const dtend = toICalUTC(new Date(b.checkOut));

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${b.id}@lookaround.app`);
        lines.push(`DTSTAMP:${now}`);
        lines.push(`DTSTART:${dtstart}`);
        lines.push(`DTEND:${dtend}`);
        lines.push(`SUMMARY:${escapeICalText(b.customerName)}`);
        if (b.notes) {
            lines.push(`DESCRIPTION:${escapeICalText(b.notes)}`);
        }
        lines.push("STATUS:CONFIRMED");
        lines.push("TRANSP:OPAQUE");
        lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
}

/** Format a Date to iCal UTC: 20260220T120000Z */
function toICalUTC(date: Date): string {
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const h = pad(date.getUTCHours());
    const min = pad(date.getUTCMinutes());
    const s = pad(date.getUTCSeconds());
    return `${y}${m}${d}T${h}${min}${s}Z`;
}

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

/** Escape special characters for iCal text values */
function escapeICalText(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

/** Make a filename-safe string */
function safeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
