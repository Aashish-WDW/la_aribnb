"use client";

import { useState } from "react";
import { X, DollarSign, Calendar as CalendarIcon, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Property {
    id: string;
    name: string;
}

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    properties: Property[];
}

const CATEGORIES = [
    "Cleaning",
    "Maintenance",
    "Utilities",
    "PlatformFees",
    "Staff",
    "Supplies",
    "Other"
];

export default function ExpenseModal({ isOpen, onClose, onSuccess, properties }: ExpenseModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Maintenance");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [propertyId, setPropertyId] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    amount,
                    category,
                    date,
                    propertyId
                })
            });

            if (!res.ok) throw new Error("Failed");

            onSuccess();
            onClose();
            // Reset form
            setDescription("");
            setAmount("");
        } catch (error) {
            console.error(error);
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
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-md glass rounded-[2rem] border border-white/10 p-8 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Add Expense</h2>
                            <button onClick={onClose}><X className="w-6 h-6 text-foreground/40 hover:text-white" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Property</label>
                                <select
                                    value={propertyId}
                                    onChange={e => setPropertyId(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 mt-1 [&>option]:bg-zinc-900"
                                >
                                    <option value="">Select Property</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Amount</label>
                                    <div className="relative mt-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-4"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Category</label>
                                <div className="relative mt-1">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-4 [&>option]:bg-zinc-900"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-foreground/40 ml-1">Description</label>
                                <input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    placeholder="e.g. Broken faucet repair"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 mt-1"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-premium mt-4"
                            >
                                {loading ? "Saving..." : "Record Expense"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
