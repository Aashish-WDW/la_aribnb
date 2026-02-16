"use client";

import { useState, useEffect } from "react";
import { X, Package, Box, Link as LinkIcon, Image as ImageIcon, Bell, Clock, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Property {
    id: string;
    name: string;
}

interface InventoryItem {
    id?: string;
    name: string;
    quantity: number;
    description?: string;
    link?: string;
    imageUrl?: string;
    propertyId?: string | null;
    notifyEnabled?: boolean;
    notifyThreshold?: number;
    notifyTime?: string;
    notifyDate?: string;
}

interface AddInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    itemToEdit?: InventoryItem;
    properties: Property[];
}

export default function AddInventoryModal({ isOpen, onClose, onSuccess, itemToEdit, properties }: AddInventoryModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [propertyId, setPropertyId] = useState<string>("global"); // "global" means null
    const [notifyEnabled, setNotifyEnabled] = useState(false);
    const [notifyThreshold, setNotifyThreshold] = useState("5");
    const [notifyTime, setNotifyTime] = useState("09:00");
    const [notifyDate, setNotifyDate] = useState("");

    useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setQuantity(itemToEdit.quantity.toString());
            setDescription(itemToEdit.description || "");
            setLink(itemToEdit.link || "");
            setImageUrl(itemToEdit.imageUrl || "");
            setPropertyId(itemToEdit.propertyId || "global");
            setNotifyEnabled(itemToEdit.notifyEnabled || false);
            setNotifyThreshold((itemToEdit.notifyThreshold || 5).toString());
            setNotifyTime(itemToEdit.notifyTime || "09:00");
            setNotifyDate(itemToEdit.notifyDate || "");
        } else {
            setName("");
            setQuantity("1");
            setDescription("");
            setLink("");
            setImageUrl("");
            setPropertyId("global");
        }
        setError(null);
    }, [itemToEdit, isOpen]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = itemToEdit ? `/api/inventory/${itemToEdit.id}` : "/api/inventory";
            const method = itemToEdit ? "PATCH" : "POST";

            const payload = {
                name,
                quantity: parseInt(quantity),
                description,
                link,
                imageUrl,
                propertyId: propertyId === "global" ? null : propertyId,
                notifyEnabled,
                notifyThreshold: parseInt(notifyThreshold),
                notifyTime,
                notifyDate: notifyDate || null
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save item");
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
                        <div className="p-8 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <h2 className="text-2xl font-bold">{itemToEdit ? "Edit Item" : "Add Item"}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Item Name</label>
                                    <div className="relative mt-1">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g. Towels"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Quantity</label>
                                        <div className="relative mt-1">
                                            <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={e => setQuantity(e.target.value)}
                                                required
                                                min="0"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Property</label>
                                        <div className="relative mt-1">
                                            <select
                                                value={propertyId}
                                                onChange={e => setPropertyId(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pr-10 focus:outline-none focus:border-brand-500/50 transition-all text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="global" className="bg-zinc-900">All Properties (Global)</option>
                                                {properties.map(p => (
                                                    <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Description (Optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={2}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 mt-1 focus:outline-none focus:border-brand-500/50 transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Image URL</label>
                                    <div className="relative mt-1">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input
                                            value={imageUrl}
                                            onChange={e => setImageUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Product Link (Amazon, etc.)</label>
                                    <div className="relative mt-1">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input
                                            value={link}
                                            onChange={e => setLink(e.target.value)}
                                            type="url"
                                            placeholder="https://amazon.com/..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Notification Settings */}
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-brand-400" />
                                            <label className="text-sm font-bold">Low Stock Notifications</label>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNotifyEnabled(!notifyEnabled)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${notifyEnabled ? 'bg-brand-500' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifyEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {notifyEnabled && (
                                        <div className="space-y-4 pt-2">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Notify When Below</label>
                                                <input
                                                    type="number"
                                                    value={notifyThreshold}
                                                    onChange={e => setNotifyThreshold(e.target.value)}
                                                    min="1"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 mt-1 focus:outline-none focus:border-brand-500/50 transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Check Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={notifyTime}
                                                        onChange={e => setNotifyTime(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 mt-1 focus:outline-none focus:border-brand-500/50 transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1 flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        Next Check
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={notifyDate}
                                                        onChange={e => setNotifyDate(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 mt-1 focus:outline-none focus:border-brand-500/50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <p className="text-xs text-foreground/40">
                                                You'll receive a Telegram notification when stock falls below the threshold. Checks run daily at the specified time.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={onClose} className="flex-1 py-4 px-6 border border-white/10 rounded-2xl font-bold hover:bg-white/5">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 py-4 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold shadow-premium">
                                    {loading ? "Saving..." : (itemToEdit ? "Update Item" : "Create Item")}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
