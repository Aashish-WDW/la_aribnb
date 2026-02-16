"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import PropertyCard from "@/components/dashboard/PropertyCard";
import AddPropertyModal from "@/components/dashboard/AddPropertyModal";
import { Plus, Search, Filter, Home, DoorOpen, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Listing } from "@/types/listing";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function PropertiesPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [filterType, setFilterType] = useState<'all' | 'PROPERTY' | 'ROOM'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleEdit = (listing: Listing) => {
        setSelectedProperty({ id: listing.propertyId });
        setIsModalOpen(true);
    };

    const handleDelete = async (listing: Listing) => {
        if (!confirm(`Are you sure you want to delete "${listing.name}"? This action cannot be undone.`)) return;

        // Optimistic update
        setDeletingId(listing.id);
        const previousListings = [...listings];
        setListings(listings.filter(l => l.id !== listing.id));

        try {
            const endpoint = listing.type === 'PROPERTY'
                ? `/api/properties/${listing.id}`
                : `/api/rooms/${listing.roomId}`;

            const res = await fetch(endpoint, { method: "DELETE" });

            if (!res.ok) {
                // Rollback on error
                setListings(previousListings);
                alert("Failed to delete listing");
            }
        } catch (error) {
            // Rollback on error
            setListings(previousListings);
            console.error("Failed to delete", error);
            alert("An error occurred while deleting");
        } finally {
            setDeletingId(null);
        }
    };

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/listings");
            if (!res.ok) {
                throw new Error("Failed to fetch listings");
            }
            const data = await res.json();
            setListings(data);
        } catch (error) {
            console.error("Failed to fetch listings:", error);
            setError(error instanceof Error ? error.message : "Failed to load listings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    // Memoized filtered and searched listings
    const filteredListings = useMemo(() => {
        let result = listings;

        // Apply type filter
        if (filterType !== 'all') {
            result = result.filter(l => l.type === filterType);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.name.toLowerCase().includes(query) ||
                l.description?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [listings, filterType, searchQuery]);

    // Debounced search handler
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    if (loading) {
        return <LoadingState message="Loading listings..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to load listings"
                message={error}
                retry={fetchListings}
            />
        );
    }

    return (
        <ErrorBoundary>
            <div className="space-y-10">
                <AddPropertyModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProperty(null);
                    }}
                    onSuccess={fetchListings}
                    propertyToEdit={selectedProperty}
                />

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Independent Listings</h1>
                        <p className="text-foreground/60">Manage each property and room as a separate listing with connected availability.</p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedProperty(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-bold transition-all shadow-premium hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Property
                    </button>
                </header>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-brand-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all"
                        />
                    </div>

                    {/* Listing Type Filter */}
                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'all'
                                ? 'bg-brand-500 text-white'
                                : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            All ({listings.length})
                        </button>
                        <button
                            onClick={() => setFilterType('PROPERTY')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'PROPERTY'
                                ? 'bg-brand-500 text-white'
                                : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            <Home className="w-4 h-4" />
                            Entire Places ({listings.filter(l => l.type === 'PROPERTY').length})
                        </button>
                        <button
                            onClick={() => setFilterType('ROOM')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'ROOM'
                                ? 'bg-brand-500 text-white'
                                : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            <DoorOpen className="w-4 h-4" />
                            Rooms ({listings.filter(l => l.type === 'ROOM').length})
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                {filteredListings.length === 0 && !loading ? (
                    <EmptyState
                        icon={Inbox}
                        title={searchQuery ? "No listings found" : "No listings yet"}
                        description={searchQuery ? `No listings match "${searchQuery}". Try a different search term.` : "Get started by adding your first property or room listing."}
                        action={!searchQuery ? {
                            label: "Add Your First Listing",
                            onClick: () => {
                                setSelectedProperty(null);
                                setIsModalOpen(true);
                            }
                        } : undefined}
                    />
                ) : (
                    /* Listings Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredListings.map((listing) => (
                                <motion.div
                                    key={listing.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: deletingId === listing.id ? 0.5 : 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="glass rounded-[2.5rem] p-6 hover:shadow-premium transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-2xl ${listing.type === 'PROPERTY'
                                                ? 'bg-brand-500/10 text-brand-400'
                                                : 'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                {listing.type === 'PROPERTY' ? (
                                                    <Home className="w-5 h-5" />
                                                ) : (
                                                    <DoorOpen className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{listing.name}</h3>
                                                <p className="text-xs text-foreground/40 uppercase font-bold tracking-wider">
                                                    {listing.type === 'PROPERTY' ? 'Entire Place' : 'Individual Room'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {listing.description && (
                                        <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                                            {listing.description}
                                        </p>
                                    )}

                                    {listing.basePrice && (
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-2xl font-bold text-brand-400">${listing.basePrice}</span>
                                            <span className="text-sm text-foreground/40">/ night</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-white/10">
                                        <button
                                            onClick={() => handleEdit(listing)}
                                            disabled={deletingId === listing.id}
                                            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(listing)}
                                            disabled={deletingId === listing.id}
                                            className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {deletingId === listing.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Add New Placeholder */}
                            {filteredListings.length > 0 && (
                                <motion.button
                                    key="add-new"
                                    onClick={() => {
                                        setSelectedProperty(null);
                                        setIsModalOpen(true);
                                    }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-[2.5rem] hover:border-brand-500/30 hover:bg-brand-500/5 transition-all group"
                                >
                                    <div className="p-4 bg-white/5 rounded-2xl text-foreground/20 group-hover:text-brand-400 transition-colors mb-4">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <span className="font-bold text-foreground/40 group-hover:text-foreground/60">Add another listing</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}
