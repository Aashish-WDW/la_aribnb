import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase-server";
import { markNotificationAsRead } from "@/lib/notifications";

export async function POST(req: Request) {
    try {
        const supabase = await createClientServer();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { notificationId } = await req.json();

        if (!notificationId) {
            return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
        }

        const success = await markNotificationAsRead(notificationId);

        if (!success) {
            return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in mark-read API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
