import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase-server";
import { markAllNotificationsAsRead } from "@/lib/notifications";

export async function POST() {
    try {
        const supabase = await createClientServer();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const success = await markAllNotificationsAsRead(user.id);

        if (!success) {
            return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in mark-all-read API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
