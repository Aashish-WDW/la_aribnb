import { areIntervalsOverlapping } from "date-fns";

export type ConflictType = 'DIRECT' | 'PARENT_BLOCKED' | 'CHILD_BLOCKED';

export interface BookingInterval {
    start: Date;
    end: Date;
    roomId?: string;
    isEntireProperty?: boolean;
    listingName?: string;
}

/**
 * Checks if a new booking interval conflicts with existing bookings.
 * 
 * Logic:
 * 1. If the new booking is for the "Entire Property":
 *    - Conflicts with ANY booking in that property (including all rooms).
 * 2. If the new booking is for a "Specific Room":
 *    - Conflicts with ANY "Entire Property" booking in its parent property.
 *    - Conflicts with bookings in the SAME room.
 */
export function checkBookingConflict(
    newBooking: BookingInterval,
    existingBookings: BookingInterval[]
): { hasConflict: boolean; type?: ConflictType; conflictingBooking?: BookingInterval } {
    for (const existing of existingBookings) {
        // Standard overlap check
        const isOverlapping = areIntervalsOverlapping(
            { start: newBooking.start, end: newBooking.end },
            { start: existing.start, end: existing.end },
            { inclusive: false }
        );

        if (isOverlapping) {
            // Case 1: Both are the same target
            if (newBooking.roomId === existing.roomId && newBooking.isEntireProperty === existing.isEntireProperty) {
                return { hasConflict: true, type: 'DIRECT', conflictingBooking: existing };
            }

            // Case 2: New Booking is for Entire Property, but a Room is already booked
            if (newBooking.isEntireProperty && existing.roomId) {
                return { hasConflict: true, type: 'CHILD_BLOCKED', conflictingBooking: existing };
            }

            // Case 3: New Booking is for a Room, but the Entire Property is already booked
            if (newBooking.roomId && existing.isEntireProperty) {
                return { hasConflict: true, type: 'PARENT_BLOCKED', conflictingBooking: existing };
            }
        }
    }

    return { hasConflict: false };
}
