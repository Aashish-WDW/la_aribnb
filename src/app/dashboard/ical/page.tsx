"use client";

import { useEffect, useState, useCallback } from "react";
import {
    RefreshCw,
    Plus,
    Trash2,
    Copy,
    Download,
    ExternalLink,
    Link2,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useProperty } from "@/context/PropertyContext";

interface ICalFeed {
    id: string;
    name: string;
    url: string;
    propertyId: string;
    lastSynced: string | null;
    createdAt: string;
    property: { id: string; name: string } | null;
}

export default function ICalPage() {
    const { activePropertyId, activeProperty, loading: propLoading } = useProperty();

    const [feeds, setFeeds] = useState<ICalFeed[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form state — only name and URL now
    const [newName, setNewName] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchFeeds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ical");
            if (res.ok) {
                const allFeeds: ICalFeed[] = await res.json();
                // Filter to only show feeds for the active property
                if (activePropertyId) {
                    setFeeds(allFeeds.filter((f) => f.propertyId === activePropertyId));
                } else {
                    setFeeds(allFeeds);
                }
            }
        } catch (error) {
            console.error("Failed to fetch feeds:", error);
        } finally {
            setLoading(false);
        }
    }, [activePropertyId]);

    useEffect(() => {
        if (!propLoading) fetchFeeds();
    }, [fetchFeeds, propLoading]);

    const handleAddFeed = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activePropertyId) {
            toast.error("No property selected. Please select a property in the header.");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/ical", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    url: newUrl,
                    propertyId: activePropertyId,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add feed");
            }

            toast.success("Feed added successfully!");
            setNewName("");
            setNewUrl("");
            setShowAddForm(false);
            fetchFeeds();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSync = async (feedId: string) => {
        setSyncing(feedId);
        try {
            const res = await fetch("/api/ical/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Sync failed");
            }

            toast.success(data.message);
            fetchFeeds();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSyncing(null);
        }
    };

    const handleDelete = async (feedId: string) => {
        if (!confirm("Remove this feed? Imported bookings will not be deleted.")) return;

        try {
            const res = await fetch(`/api/ical?id=${feedId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete feed");

            toast.success("Feed removed");
            fetchFeeds();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleCopyExportUrl = async () => {
        if (!activePropertyId) return;
        const url = `${window.location.origin}/api/ical/export?propertyId=${activePropertyId}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(activePropertyId);
        toast.success("Export URL copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDownloadIcs = () => {
        if (!activePropertyId) return;
        window.open(`/api/ical/export?propertyId=${activePropertyId}`, "_blank");
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        return new Date(dateStr).toLocaleString();
    };

    if (loading || propLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <header>
                <h1 className="text-3xl font-bold mb-2">iCal Sync</h1>
                <p className="text-foreground/60">
                    Import calendars from Airbnb, Booking.com, or other platforms. Export your bookings as an iCal feed.
                </p>
                {activeProperty && (
                    <p className="text-sm text-brand-400 mt-1 font-medium">
                        Showing feeds for: {activeProperty.name}
                    </p>
                )}
            </header>

            {/* ─── IMPORT SECTION ─── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-400" />
                        Import Feeds
                    </h2>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showAddForm ? "Cancel" : "Add Feed"}
                    </button>
                </div>

                {/* Add Feed Form — simplified: only name + URL */}
                {showAddForm && (
                    <form
                        onSubmit={handleAddFeed}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 space-y-4"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Feed Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Airbnb - Villa Rosa"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    iCal URL
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://www.airbnb.com/calendar/ical/..."
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            The feed will be linked to <span className="text-brand-400 font-semibold">{activeProperty?.name || "the selected property"}</span> automatically.
                        </p>

                        <button
                            type="submit"
                            disabled={submitting || !activePropertyId}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            Add Feed
                        </button>
                    </form>
                )}

                {/* Feeds List */}
                {feeds.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <Link2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No import feeds yet</p>
                        <p className="text-slate-500 text-sm mt-1">
                            Add an iCal URL from Airbnb or another platform to start syncing.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {feeds.map((feed) => (
                            <div
                                key={feed.id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-white truncate">
                                            {feed.name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono truncate">
                                        {feed.url}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        {feed.lastSynced ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                                Last synced: {formatDate(feed.lastSynced)}
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                                Never synced
                                            </>
                                        )}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleSync(feed.id)}
                                        disabled={syncing === feed.id}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            className={`w-3.5 h-3.5 ${syncing === feed.id ? "animate-spin" : ""}`}
                                        />
                                        Sync
                                    </button>
                                    <button
                                        onClick={() => handleDelete(feed.id)}
                                        className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ─── EXPORT SECTION ─── */}
            {activeProperty && (
                <section>
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <ExternalLink className="w-5 h-5 text-cyan-400" />
                        Export Your Calendar
                    </h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Share this link with Airbnb, Booking.com, or any platform that supports iCal imports.
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white">
                                {activeProperty.name}
                            </span>
                            <p className="text-xs text-slate-500 font-mono truncate mt-1">
                                {typeof window !== "undefined"
                                    ? `${window.location.origin}/api/ical/export?propertyId=${activePropertyId}`
                                    : `/api/ical/export?propertyId=${activePropertyId}`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleCopyExportUrl}
                                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/20 text-cyan-400 rounded-xl text-xs font-semibold transition-all"
                            >
                                {copiedId === activePropertyId ? (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                )}
                                {copiedId === activePropertyId ? "Copied!" : "Copy Link"}
                            </button>
                            <button
                                onClick={handleDownloadIcs}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
