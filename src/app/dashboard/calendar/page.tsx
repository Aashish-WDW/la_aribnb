"use client";

import { useEffect, useState, useCallback } from "react";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Calendar as CalendarIcon } from "lucide-react";

export default function CalendarPage() {
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
            if (!listRes.ok) {
                throw new Error("Failed to fetch listings");
            }

            const listData = await listRes.json();
            setListings(listData);

            // For the calendar, we still need to fetch bookings.
            // Since we want connected logic, we usually fetch by Property (the parent group).
            // If we have listings, we can get unique property IDs.
            const uniquePropertyIds = Array.from(new Set(listData.map((l: any) => l.propertyId)));

            if (uniquePropertyIds.length > 0) {
                // Fetch all relevant data for the first property group
                // In a more complex app, we might fetch for ALL or use a filter.
                const bookRes = await fetch(`/api/bookings?propertyId=${uniquePropertyIds[0]}`);
                if (!bookRes.ok) {
                    throw new Error("Failed to fetch bookings");
                }

                const { bookings: bData, blocks: blData } = await bookRes.json();
                setBookings(bData);
                setBlocks(blData);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setError(error instanceof Error ? error.message : "Failed to load calendar data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <LoadingState message="Loading calendar..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to load calendar"
                message={error}
                retry={fetchData}
            />
        );
    }

    if (listings.length === 0) {
        return (
            <EmptyState
                icon={CalendarIcon}
                title="No listings to display"
                description="Add your first property to start managing your calendar."
                action={{
                    label: "Go to Properties",
                    onClick: () => window.location.href = "/dashboard/properties"
                }}
            />
        );
    }

    return (
        <ErrorBoundary>
            <div className="h-full space-y-8 flex flex-col">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Availability Calendar</h1>
                        <p className="text-foreground/60">Independent listings with connected availability.</p>
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
