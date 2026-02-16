import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const { data: tasks, error } = await supabase
            .from('Task')
            .select(`
                *,
                property:Property(name),
                room:Room(name),
                booking:Booking(customerName)
            `)
            .eq('ownerId', userId)
            .order('dueDate', { ascending: true });

        if (error) throw error;

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
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
        const { title, description, status, priority, dueDate, assignedTo, propertyId, roomId, bookingId } = body;

        if (!title || !propertyId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const { data: task, error } = await supabase
            .from('Task')
            .insert({
                title,
                description,
                status,
                priority,
                dueDate,
                assignedTo,
                propertyId,
                roomId: roomId || null,
                bookingId: bookingId || null,
                ownerId: userId
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(task);
    } catch (error) {
        console.error("Failed to create task:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
