"use client";

import { useState } from "react";
import {
    format,
    addDays,
    eachDayOfInterval,
    isToday,
    startOfToday,
    isSameDay,
    parseISO,
    isWeekend
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import BookingModal from "./BookingModal";

import { Listing } from "@/types/listing";

interface Booking {
    id: string;
    propertyId: string;
    roomId?: string;
    customerName: string;
    checkIn: string;
    checkOut: string;
    source: string;
}

interface Block {
    id: string;
    propertyId: string;
    roomId?: string;
    startDate: string;
    endDate: string;
    reason?: string;
}

export default function CalendarGrid({
    listings,
    bookings,
    blocks,
    onRefresh
}: {
    listings: Listing[],
    bookings: Booking[],
    blocks: Block[],
    onRefresh: () => void
}) {
    const [viewDate, setViewDate] = useState(startOfToday());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selection, setSelection] = useState<any>(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | "all">("all");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [daysToShow, setDaysToShow] = useState(7); // Responsive: 7 days default

    const days = eachDayOfInterval({
        start: viewDate,
        end: addDays(viewDate, daysToShow - 1),
    });

    const handleCellClick = (listing: Listing, date: Date) => {
        setSelection({
            startDate: date,
            propertyId: listing.propertyId,
            propertyName: listing.name,
            roomId: listing.roomId,
            listingType: listing.type
        });
        setIsModalOpen(true);
    };

    const toggleRowExpansion = (listingId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(listingId)) {
            newExpanded.delete(listingId);
        } else {
            newExpanded.add(listingId);
        }
        setExpandedRows(newExpanded);
    };

    const getBookingForCell = (listing: Listing, day: Date) => {
        // 1. Check for DIRECT Booking on this listing
        const directBooking = bookings.find(b => {
            const start = parseISO(b.checkIn);
            const isCorrectListing = listing.type === 'PROPERTY'
                ? (!b.roomId && b.propertyId === listing.id)
                : (b.roomId === listing.roomId);
            return isCorrectListing && isSameDay(day, start);
        });

        if (directBooking) return { type: 'booking', data: directBooking };

        // 2. Check for DIRECT Block on this listing
        const directBlock = blocks.find(b => {
            const start = parseISO(b.startDate);
            const isCorrectListing = listing.type === 'PROPERTY'
                ? (!b.roomId && b.propertyId === listing.id)
                : (b.roomId === listing.roomId);
            return isCorrectListing && isSameDay(day, start);
        });

        if (directBlock) return { type: 'block', data: directBlock };

        // 3. LOGICAL CONNECTION: Cross-Blocking

        // If it's a ROOM listing, check if PARENT is booked/blocked
        if (listing.type === 'ROOM') {
            const parentBooking = bookings.find(b => {
                const start = parseISO(b.checkIn);
                return !b.roomId && b.propertyId === listing.propertyId && isSameDay(day, start);
            });
            if (parentBooking) return { type: 'blocked_by_parent', data: parentBooking };

            const parentBlock = blocks.find(b => {
                const start = parseISO(b.startDate);
                return !b.roomId && b.propertyId === listing.propertyId && isSameDay(day, start);
            });
            if (parentBlock) return { type: 'blocked_by_parent', data: parentBlock };
        }

        // If it's a PROPERTY listing, check if ANY CHILD room is booked/blocked
        if (listing.type === 'PROPERTY') {
            const childBooking = bookings.find(b => {
                const start = parseISO(b.checkIn);
                return b.roomId && b.propertyId === listing.id && isSameDay(day, start);
            });
            if (childBooking) return { type: 'blocked_by_child', data: childBooking };

            const childBlock = blocks.find(b => {
                const start = parseISO(b.startDate);
                return b.roomId && b.propertyId === listing.id && isSameDay(day, start);
            });
            if (childBlock) return { type: 'blocked_by_child', data: childBlock };
        }

        return null;
    };

    // Filters based on parent property
    const filteredListings = selectedPropertyId === "all"
        ? listings
        : listings.filter(l => l.propertyId === selectedPropertyId);

    const uniqueProperties = Array.from(new Set(listings.map(l => l.propertyId))).map(id => {
        return listings.find(l => l.propertyId === id);
    });

    return (
        <div className="flex flex-col h-full glass rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl">
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selection={selection}
                onSuccess={onRefresh}
            />

            {/* Calendar Navigation & Filters - Enhanced */}
            <div className="flex flex-col gap-4 p-4 lg:p-6 border-b border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-brand-500/20 to-brand-600/10 rounded-2xl border border-brand-500/20">
                            <CalendarIcon className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                {format(viewDate, "MMMM yyyy")}
                            </h2>
                            <p className="text-xs text-white/40 font-medium">Booking Calendar</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Days View Toggle */}
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                            <button
                                onClick={() => setDaysToShow(7)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    daysToShow === 7 ? "bg-brand-500 text-white shadow-lg" : "hover:bg-white/10"
                                )}
                            >
                                7 Days
                            </button>
                            <button
                                onClick={() => setDaysToShow(14)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    daysToShow === 14 ? "bg-brand-500 text-white shadow-lg" : "hover:bg-white/10"
                                )}
                            >
                                14 Days
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                            <button
                                onClick={() => setViewDate(d => addDays(d, -daysToShow))}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all hover:scale-110"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewDate(startOfToday())}
                                className="px-4 text-xs font-bold hover:bg-white/10 rounded-lg transition-all"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setViewDate(d => addDays(d, daysToShow))}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all hover:scale-110"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Property Filter */}
                <div className="relative flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-brand-400" />
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="bg-transparent font-bold text-sm [&>option]:bg-zinc-900 focus:outline-none flex-1 pr-6 appearance-none cursor-pointer"
                    >
                        <option value="all">All Property Groups</option>
                        {uniqueProperties.map(p => p && (
                            <option key={p.propertyId} value={p.propertyId}>{p.name.split(' (')[0]}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Calendar Grid - Fully Responsive */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="min-w-full">
                    {/* Grid Header */}
                    <div className="sticky top-0 z-20 bg-gradient-to-b from-[#030712] to-[#030712]/95 backdrop-blur-xl border-b border-white/10 shadow-xl">
                        <div className="flex">
                            <div className="w-48 lg:w-64 flex-shrink-0 border-r border-white/10 p-3 lg:p-4 font-bold text-sm lg:text-base bg-white/5">
                                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    Properties
                                </span>
                            </div>
                            <div className="flex-1 flex overflow-x-auto custom-scrollbar">
                                {days.map((day) => (
                                    <div
                                        key={day.toISOString()}
                                        className={cn(
                                            "flex-1 min-w-[80px] lg:min-w-[100px] p-2 lg:p-3 text-center border-r border-white/5 flex flex-col items-center justify-center transition-all",
                                            isToday(day)
                                                ? "bg-gradient-to-b from-brand-500/20 to-brand-500/5 border-brand-500/30"
                                                : isWeekend(day)
                                                    ? "bg-white/[0.02]"
                                                    : "hover:bg-white/5"
                                        )}
                                    >
                                        <span className="text-[10px] lg:text-xs uppercase font-bold text-foreground/40 mb-1">
                                            {format(day, "EEE")}
                                        </span>
                                        <span className={cn(
                                            "text-base lg:text-xl font-bold w-7 h-7 lg:w-9 lg:h-9 flex items-center justify-center rounded-full transition-all",
                                            isToday(day)
                                                ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/50 scale-110"
                                                : "text-foreground hover:bg-white/10"
                                        )}>
                                            {format(day, "d")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid Rows */}
                    <div className="divide-y divide-white/5">
                        {filteredListings.map((listing) => {
                            const isExpanded = expandedRows.has(listing.id);
                            return (
                                <div
                                    key={listing.id}
                                    className="group hover:bg-white/[0.02] transition-all duration-200"
                                >
                                    <div className="flex">
                                        {/* Listing Name Column */}
                                        <div
                                            className="w-48 lg:w-64 flex-shrink-0 border-r border-white/10 p-3 lg:p-4 flex items-center gap-2 bg-gradient-to-r from-[#0a0a0a] to-transparent group-hover:from-[#111] transition-all cursor-pointer"
                                            onClick={() => toggleRowExpansion(listing.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs lg:text-sm font-bold truncate text-white">
                                                        {listing.name}
                                                    </span>
                                                    <ChevronDown
                                                        className={cn(
                                                            "w-3 h-3 lg:w-4 lg:h-4 text-white/40 transition-transform flex-shrink-0",
                                                            isExpanded && "rotate-180"
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[9px] lg:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                        listing.type === 'PROPERTY'
                                                            ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                                                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                    )}>
                                                        {listing.type === 'PROPERTY' ? "Entire" : "Room"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Calendar Cells */}
                                        <div className="flex-1 flex overflow-x-auto custom-scrollbar">
                                            {days.map((day) => {
                                                const result = getBookingForCell(listing, day);
                                                return (
                                                    <div
                                                        key={day.toISOString()}
                                                        className={cn(
                                                            "flex-1 min-w-[80px] lg:min-w-[100px] h-16 lg:h-20 border-r border-white/5 relative group/cell transition-all",
                                                            !result && "cursor-pointer hover:bg-white/10",
                                                            isWeekend(day) && "bg-white/[0.01]"
                                                        )}
                                                        onClick={() => !result && handleCellClick(listing, day)}
                                                    >
                                                        {result?.type === 'booking' && (
                                                            <div className="absolute inset-1 lg:inset-2 z-10">
                                                                <div className={cn(
                                                                    "h-full rounded-lg lg:rounded-xl p-1.5 lg:p-2 flex flex-col justify-center shadow-lg transform transition-all hover:scale-105 hover:shadow-xl",
                                                                    listing.type === 'PROPERTY'
                                                                        ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white"
                                                                        : "bg-gradient-to-br from-blue-600/40 to-blue-700/30 border border-blue-500/50 text-blue-100"
                                                                )}>
                                                                    <span className="text-[10px] lg:text-xs font-bold truncate">
                                                                        {'customerName' in result.data ? result.data.customerName : ''}
                                                                    </span>
                                                                    <span className="text-[8px] lg:text-[9px] opacity-70 uppercase font-bold">
                                                                        {'source' in result.data ? result.data.source : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {result?.type === 'block' && (
                                                            <div className="absolute inset-1 lg:inset-2 z-10">
                                                                <div className="h-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-lg lg:rounded-xl p-1.5 lg:p-2 flex flex-col justify-center shadow-lg">
                                                                    <span className="text-[8px] lg:text-[9px] font-bold uppercase text-zinc-400">Blocked</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {result?.type === 'blocked_by_parent' && (
                                                            <div className="absolute inset-1 lg:inset-2 z-10">
                                                                <div className="h-full bg-red-500/5 border border-red-500/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                                    <span className="text-[7px] lg:text-[8px] font-bold text-red-400/60 uppercase tracking-tight">Parent</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {result?.type === 'blocked_by_child' && (
                                                            <div className="absolute inset-1 lg:inset-2 z-10">
                                                                <div className="h-full bg-stripes-white rounded-lg lg:rounded-xl border border-white/5 flex items-center justify-center opacity-30">
                                                                    <span className="text-[7px] lg:text-[8px] font-bold text-white/50 uppercase tracking-tight">Child</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!result && (
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all">
                                                                <div className="p-2 bg-brand-500/20 rounded-full backdrop-blur-sm border border-brand-500/30">
                                                                    <Plus className="w-3 h-3 lg:w-4 lg:h-4 text-brand-400" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Expanded Details (Mobile) */}
                                    {isExpanded && (
                                        <div className="lg:hidden p-4 bg-white/5 border-t border-white/10 space-y-2 animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-white/40">Type:</span>
                                                    <span className="ml-2 font-bold">{listing.type}</span>
                                                </div>
                                                <div>
                                                    <span className="text-white/40">ID:</span>
                                                    <span className="ml-2 font-mono text-[10px]">{listing.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 lg:p-6 border-t border-white/10 bg-gradient-to-t from-white/5 to-transparent">
                <div className="flex flex-wrap gap-3 lg:gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-brand-500 to-brand-600"></div>
                        <span className="text-white/60 font-medium">Property Booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-600/40 to-blue-700/30 border border-blue-500/50"></div>
                        <span className="text-white/60 font-medium">Room Booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10"></div>
                        <span className="text-white/60 font-medium">Blocked</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
