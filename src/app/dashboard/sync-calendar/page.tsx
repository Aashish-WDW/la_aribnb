"use client";

import { useEffect, useState, useCallback } from "react";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { RefreshCw } from "lucide-react";

export default function SyncCalendarPage() {
    const [listings, setListings] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all independent listings
            const listRes = await fetch("/api/listings");
            if (!listRes.ok) throw new Error("Failed to fetch listings");

            const listData = await listRes.json();
            setListings(listData);

            const uniquePropertyIds = Array.from(new Set(listData.map((l: any) => l.propertyId)));

            if (uniquePropertyIds.length > 0) {
                // Fetch bookings for the first property
                const bookRes = await fetch(`/api/bookings?propertyId=${uniquePropertyIds[0]}`);
                if (!bookRes.ok) throw new Error("Failed to fetch bookings");

                const { bookings: bData, blocks: blData } = await bookRes.json();

                // FILTER: Only show iCal bookings
                const icalOnly = bData.filter((b: any) => b.source === 'ICAL');

                setBookings(icalOnly);
                setBlocks(blData); // Blocks are usually manual, but we keep them for context or hide them
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setError(error instanceof Error ? error.message : "Failed to load sync calendar");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <LoadingState message="Loading sync calendar..." />;

    if (error) {
        return (
            <ErrorState
                title="Failed to load sync calendar"
                message={error}
                retry={fetchData}
            />
        );
    }

    if (bookings.length === 0) {
        return (
            <EmptyState
                icon={RefreshCw}
                title="No synced data yet"
                description="Import your first iCal feed to see bookings here."
                action={{
                    label: "Go to iCal Sync",
                    onClick: () => window.location.href = "/dashboard/ical"
                }}
            />
        );
    }

    return (
        <ErrorBoundary>
            <div className="h-full space-y-8 flex flex-col">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Sync Calendar</h1>
                        <p className="text-foreground/60">View only your Airbnb & platform synced bookings.</p>
                    </div>
                </header>

                <div className="flex-1">
                    <CalendarGrid
                        listings={listings}
                        bookings={bookings}
                        blocks={blocks}
                        onRefresh={fetchData}
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
}
