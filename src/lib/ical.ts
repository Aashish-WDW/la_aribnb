import { format } from "date-fns";

export interface ICalEvent {
    uid: string;
    summary: string;
    dtstart: Date;
    dtend: Date;
    description?: string;
}

/**
 * Parse raw .ics text into an array of events.
 * Handles the VCALENDAR/VEVENT format used by Airbnb, Booking.com, etc.
 */
export function parseICalFeed(icsText: string): ICalEvent[] {
    const events: ICalEvent[] = [];
    const lines = icsText.replace(/\r\n /g, "").split(/\r?\n/);

    let inEvent = false;
    let current: Partial<ICalEvent> = {};

    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            inEvent = true;
            current = {};
        } else if (line === "END:VEVENT") {
            inEvent = false;
            if (current.uid && current.dtstart && current.dtend) {
                events.push({
                    uid: current.uid,
                    summary: current.summary || "Blocked",
                    dtstart: current.dtstart,
                    dtend: current.dtend,
                    description: current.description,
                });
            }
        } else if (inEvent) {
            const colonIndex = line.indexOf(":");
            if (colonIndex === -1) continue;

            const key = line.substring(0, colonIndex).split(";")[0]; // strip params like ;VALUE=DATE
            const value = line.substring(colonIndex + 1);

            switch (key) {
                case "UID":
                    current.uid = value;
                    break;
                case "SUMMARY":
                    current.summary = value;
                    break;
                case "DTSTART":
                    current.dtstart = parseICalDate(value);
                    break;
                case "DTEND":
                    current.dtend = parseICalDate(value);
                    break;
                case "DESCRIPTION":
                    current.description = value;
                    break;
            }
        }
    }

    return events;
}

/**
 * Parse an iCal date string (YYYYMMDD or YYYYMMDDTHHmmssZ) into a Date.
 */
function parseICalDate(value: string): Date {
    // Date-only format: 20250215
    if (value.length === 8) {
        const y = parseInt(value.slice(0, 4));
        const m = parseInt(value.slice(4, 6)) - 1;
        const d = parseInt(value.slice(6, 8));
        return new Date(y, m, d);
    }
    // DateTime format: 20250215T120000Z
    const y = parseInt(value.slice(0, 4));
    const m = parseInt(value.slice(4, 6)) - 1;
    const d = parseInt(value.slice(6, 8));
    const h = parseInt(value.slice(9, 11)) || 0;
    const min = parseInt(value.slice(11, 13)) || 0;
    const s = parseInt(value.slice(13, 15)) || 0;

    if (value.endsWith("Z")) {
        return new Date(Date.UTC(y, m, d, h, min, s));
    }
    return new Date(y, m, d, h, min, s);
}

/**
 * Format a Date to iCal date string (YYYYMMDD).
 */
function formatICalDate(date: Date): string {
    return format(date, "yyyyMMdd");
}

/**
 * Generate a valid .ics calendar file from bookings.
 */
export function generateICalFeed(
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
    const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LookAround//Export//EN",
        `X-WR-CALNAME:${calendarName}`,
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ];

    for (const booking of bookings) {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${booking.id}@lookaround.app`);
        lines.push(`DTSTART;VALUE=DATE:${formatICalDate(checkIn)}`);
        lines.push(`DTEND;VALUE=DATE:${formatICalDate(checkOut)}`);
        lines.push(`SUMMARY:${booking.customerName}`);
        if (booking.notes) {
            lines.push(`DESCRIPTION:${booking.notes.replace(/\n/g, "\\n")}`);
        }
        lines.push(`STATUS:CONFIRMED`);
        lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
}
