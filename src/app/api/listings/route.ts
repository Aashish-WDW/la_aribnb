import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";
import { Listing } from "@/types/listing";

export async function GET() {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        // Fetch properties and their rooms
        const { data: properties, error } = await supabase
            .from('Property')
            .select(`
                *,
                rooms:Room(*)
            `)
            .eq('ownerId', userId);

        if (error) throw error;

        const listings: Listing[] = [];

        properties.forEach((prop: any) => {
            // 1. Add the Property itself as an "Entire Place" listing
            listings.push({
                id: prop.id,
                name: `${prop.name} (Entire Place)`,
                description: prop.description,
                type: 'PROPERTY',
                propertyId: prop.id,
                basePrice: prop.basePrice // Assuming we might add this to Property too
            });

            // 2. Add each Room as a separate listing
            if (prop.rooms) {
                prop.rooms.forEach((room: any) => {
                    listings.push({
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        type: 'ROOM',
                        propertyId: prop.id,
                        roomId: room.id,
                        basePrice: room.basePrice
                    });
                });
            }
        });

        return NextResponse.json(listings, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error("Failed to fetch listings:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
