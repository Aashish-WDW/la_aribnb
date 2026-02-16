"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Calendar as CalendarIcon, User, DollarSign, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selection: {
        startDate: Date;
        propertyId: string;
        roomId?: string;
        propertyName: string;
        roomName?: string;
    } | null;
    onSuccess: () => void;
}

const SOURCES = ["AIRBNB", "BOOKING_COM", "DIRECT", "WHATSAPP", "OFFLINE", "OTHER"];

export default function BookingModal({ isOpen, onClose, selection, onSuccess }: BookingModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!selection) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selection) return;

        const formData = new FormData(e.currentTarget);
        const data = {
            propertyId: selection.propertyId,
            roomId: selection.roomId,
            customerName: formData.get("customerName"),
            source: formData.get("source"),
            checkIn: selection.startDate.toISOString(),
            checkOut: formData.get("checkOut"),
            price: formData.get("price"),
            guestRequests: formData.get("guestRequests"),
            guestCount: formData.get("guestCount"),
            advanceAmount: formData.get("advanceAmount"),
            notes: formData.get("notes"),
        };

        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                body: JSON.stringify(data),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errData = await res.json();
                setError(errData.message || "Failed to create booking");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg glass rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">New Booking</h2>
                                <p className="text-sm text-foreground/60">{selection.propertyName} {selection.roomName ? `• ${selection.roomName}` : ""}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl text-red-400 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Dates Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Check In</label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                            <input
                                                type="date"
                                                readOnly
                                                defaultValue={format(selection.startDate, "yyyy-MM-dd")}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all cursor-not-allowed opacity-60"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Check Out</label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                            <input
                                                name="checkOut"
                                                type="date"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Row */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Customer Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input
                                            name="customerName"
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Price Row */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Total Price</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                            <input
                                                name="price"
                                                type="number"
                                                step="0.01"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {/* Source Row */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Booking Source</label>
                                        <select
                                            name="source"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand-500/50 transition-all appearance-none"
                                        >
                                            {SOURCES.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Requests Row */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Guest Requests</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-foreground/40" />
                                        <textarea
                                            name="guestRequests"
                                            rows={2}
                                            placeholder="Late check-in, allergy info, etc."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Extended Details Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Guests</label>
                                        <input
                                            name="guestCount"
                                            type="number"
                                            min="1"
                                            defaultValue="1"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Advance Paid</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                            <input
                                                name="advanceAmount"
                                                type="number"
                                                min="0"
                                                defaultValue="0"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Internal Notes</label>
                                    <textarea
                                        name="notes"
                                        rows={2}
                                        placeholder="Private notes for staff..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand-500/50 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 px-6 border border-white/10 rounded-2xl font-bold hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 px-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-premium"
                                >
                                    {loading ? "Saving..." : "Create Booking"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
