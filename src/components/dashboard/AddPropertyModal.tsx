"use client";

import { useState, useEffect } from "react";
import { X, Home, Plus, Trash2, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    propertyToEdit?: any; // If provided, we are in Edit mode
}

export default function AddPropertyModal({ isOpen, onClose, onSuccess, propertyToEdit }: PropertyModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Initialize form state
    const [rooms, setRooms] = useState([{ name: "", price: "" }]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [totalPrice, setTotalPrice] = useState(""); // Price for entire property

    useEffect(() => {
        if (propertyToEdit) {
            setName(propertyToEdit.name || "");
            setDescription(propertyToEdit.description || "");
            setTotalPrice(propertyToEdit.totalPrice?.toString() || "");
            if (propertyToEdit.rooms && propertyToEdit.rooms.length > 0) {
                setRooms(propertyToEdit.rooms.map((r: any) => ({
                    id: r.id, // Keep ID for updates
                    name: r.name,
                    price: r.basePrice?.toString() || ""
                })));
            } else {
                setRooms([{ name: "", price: "" }]);
            }
        } else {
            // Reset for add mode
            setName("");
            setDescription("");
            setTotalPrice("");
            setRooms([{ name: "", price: "" }]);
        }
    }, [propertyToEdit, isOpen]);

    const addRoom = () => setRooms([...rooms, { name: "", price: "" }]);

    const removeRoom = (index: number) => setRooms(rooms.filter((_, i) => i !== index));

    const updateRoom = (index: number, field: "name" | "price", value: string) => {
        const newRooms = [...rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setRooms(newRooms);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data = {
            name,
            description,
            totalPrice: totalPrice ? parseFloat(totalPrice) : null,
            rooms: rooms.map(r => ({
                id: (r as any).id, // Include ID if it exists
                name: r.name,
                price: r.price
            })),
        };

        try {
            const url = propertyToEdit ? `/api/properties/${propertyToEdit.id}` : "/api/properties";
            const method = propertyToEdit ? "PATCH" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errorText = await res.text();
                console.error("API Error:", res.status, errorText);
                try {
                    // Try to parse as JSON if possible
                    const errorJson = JSON.parse(errorText);
                    setError(errorJson.message || `Error ${res.status}: ${errorJson.error || "Failed to save property"}`);
                } catch {
                    // Fallback to text
                    setError(`Error ${res.status}: ${errorText || "Failed to save property"}`);
                }
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
                        className="relative w-full max-w-2xl glass rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
                    >
                        <div className="p-8 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <h2 className="text-2xl font-bold">{propertyToEdit ? "Edit Property" : "Add Property"}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl text-brand-400 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Property Name</label>
                                    <div className="relative">
                                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input
                                            name="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            type="text"
                                            placeholder="e.g. Villa Azure"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        placeholder="Short overview of the property..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand-500/50 transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Total Property Price (Optional)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input
                                            name="totalPrice"
                                            value={totalPrice}
                                            onChange={(e) => setTotalPrice(e.target.value)}
                                            type="number"
                                            step="0.01"
                                            placeholder="Price for booking entire property"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-foreground/40 ml-1">Use this for whole-property bookings. Room prices below are for individual room reservations.</p>
                                </div>

                                <div className="pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Rooms & Pricing</label>
                                        <button
                                            type="button"
                                            onClick={addRoom}
                                            className="flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" /> Add Room
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {rooms.map((room, index) => (
                                            <div key={index} className="flex gap-3 group">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={room.name}
                                                        onChange={(e) => updateRoom(index, "name", e.target.value)}
                                                        placeholder="Room Name"
                                                        required
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-500/50 transition-all text-sm"
                                                    />
                                                </div>
                                                <div className="w-32 relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                                                    <input
                                                        type="number"
                                                        value={room.price}
                                                        onChange={(e) => updateRoom(index, "price", e.target.value)}
                                                        placeholder="Price"
                                                        required
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-8 pr-4 focus:outline-none focus:border-brand-500/50 transition-all text-sm"
                                                    />
                                                </div>
                                                {rooms.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRoom(index)}
                                                        className="p-2.5 text-foreground/20 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
                                    {loading ? "Saving..." : (propertyToEdit ? "Update Property" : "Create Property")}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
