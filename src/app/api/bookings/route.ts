import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";
import { checkBookingConflict } from "@/lib/bookings";
import { parseISO } from "date-fns";
import { sendTelegramNotification, formatBookingNotification } from "@/lib/telegram";
import { sendNotification } from "@/lib/notifications";

export async function GET(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const supabase = getServiceSupabase();

    try {
        let bookings;
        let blocks;

        if (propertyId) {
            // Fetch for specific property
            const { data, error } = await supabase
                .from('Booking')
                .select(`
                    *,
                    room:Room(*),
                    property:Property(name)
                `)
                .eq('propertyId', propertyId);
            if (error) throw error;
            bookings = data;

            const { data: bData, error: bError } = await supabase
                .from('Block')
                .select('*')
                .eq('propertyId', propertyId);
            if (bError) throw bError;
            blocks = bData;
        } else {
            // Fetch for all properties owned by user
            const { data: userProperties } = await supabase
                .from('Property')
                .select('id')
                .eq('ownerId', userId);

            const userPropIds = userProperties?.map(p => p.id) || [];

            const { data, error } = await supabase
                .from('Booking')
                .select(`
                    *,
                    room:Room(*),
                    property:Property(name)
                `)
                .in('propertyId', userPropIds)
                .order('checkIn', { ascending: true });

            if (error) throw error;
            bookings = data;

            const { data: bData, error: bError } = await supabase
                .from('Block')
                .select('*')
                .in('propertyId', userPropIds);

            if (bError) throw bError;
            blocks = bData;
        }

        return NextResponse.json({
            bookings: bookings || [],
            blocks: blocks || []
        }, {
            headers: {
                'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
            }
        });
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const body = await req.json();
        const {
            propertyId,
            roomId,
            customerName,
            checkIn,
            checkOut,
            price,
            source,
            guestRequests,
            override,
            guestCount,
            advanceAmount,
            status,
            notes
        } = body;

        // Basic validation
        if (!propertyId || !customerName || !checkIn || !checkOut || !price) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const checkInDate = parseISO(checkIn);
        const checkOutDate = parseISO(checkOut);

        // 1. Fetch existing bookings and blocks for conflict checking
        const { data: existingBookings, error: bookingError } = await supabase
            .from('Booking')
            .select('checkIn, checkOut, roomId')
            .eq('propertyId', propertyId)
            .neq('status', 'CANCELLED'); // Ignore cancelled bookings

        if (bookingError) throw bookingError;

        const { data: existingBlocks, error: blockError } = await supabase
            .from('Block')
            .select('startDate, endDate, roomId')
            .eq('propertyId', propertyId);

        if (blockError) throw blockError;

        // Format for conflict checker
        const allIntervals = [
            ...(existingBookings || []).map((b: any) => ({
                start: new Date(b.checkIn),
                end: new Date(b.checkOut),
                roomId: b.roomId || undefined,
                isEntireProperty: !b.roomId
            })),
            ...(existingBlocks || []).map((b: any) => ({
                start: new Date(b.startDate),
                end: new Date(b.endDate),
                roomId: b.roomId || undefined,
                isEntireProperty: !b.roomId
            }))
        ];

        // 2. Check for conflicts
        const newInterval = {
            start: checkInDate,
            end: checkOutDate,
            roomId: roomId || undefined,
            isEntireProperty: !roomId
        };

        const conflictResult = checkBookingConflict(newInterval, allIntervals);

        if (conflictResult.hasConflict && !override) {
            return NextResponse.json({
                error: "CONFLICT",
                message: "This date range is already booked or blocked.",
                conflictingBooking: conflictResult.conflictingBooking
            }, { status: 409 });
        }

        // 3. Create booking
        const { data: booking, error: createError } = await supabase
            .from('Booking')
            .insert({
                propertyId,
                roomId: roomId || null,
                customerName,
                checkIn: checkInDate.toISOString(),
                checkOut: checkOutDate.toISOString(),
                price: parseFloat(price),
                source: source || 'DIRECT',
                guestRequests,
                guestCount: guestCount || 1,
                advanceAmount: advanceAmount || 0,
                status: status || 'CONFIRMED',
                notes,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

        // Send notification
        if (booking && booking.length > 0) {
            await sendNotification(
                userId,
                'New Booking Created',
                `Booking for ${customerName} from ${checkInDate.toLocaleDateString()} to ${checkOutDate.toLocaleDateString()} has been created successfully.`,
                'success',
                { bookingId: booking[0].id }
            );
        }

        // Send Telegram notification
        try {
            const { data: telegramSettings } = await supabase
                .from('TelegramSettings')
                .select('*')
                .eq('userId', userId)
                .eq('enabled', true)
                .single();

            if (telegramSettings?.botToken && telegramSettings?.chatId) {
                // Fetch property and room names for notification
                const { data: property } = await supabase
                    .from('Property')
                    .select('name')
                    .eq('id', propertyId)
                    .single();

                let roomName = undefined;
                if (roomId) {
                    const { data: room } = await supabase
                        .from('Room')
                        .select('name')
                        .eq('id', roomId)
                        .single();
                    roomName = room?.name;
                }

                const message = formatBookingNotification({
                    customerName,
                    checkIn,
                    checkOut,
                    propertyName: property?.name,
                    roomName,
                    price
                });

                await sendTelegramNotification(
                    telegramSettings.botToken,
                    telegramSettings.chatId,
                    message
                );
            }
        } catch (notifError) {
            // Don't fail the booking if notification fails
            console.error('Failed to send Telegram notification:', notifError);
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Failed to create booking:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
