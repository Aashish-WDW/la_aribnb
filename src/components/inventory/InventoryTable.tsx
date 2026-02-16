"use client";

import { useState } from "react";
import { Edit2, Trash2, ExternalLink, Image as ImageIcon, Plus, Minus } from "lucide-react";
import { toast } from "react-hot-toast";

interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    description?: string;
    link?: string;
    imageUrl?: string;
    propertyId?: string;
    property?: { name: string };
    lowStockThreshold?: number;
    reminderEnabled?: boolean;
    nextReminderDate?: string;
}

interface InventoryTableProps {
    items: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
    onQuantityChange?: (itemId: string, newQuantity: number) => void;
}

export default function InventoryTable({ items, onEdit, onDelete, onQuantityChange }: InventoryTableProps) {
    const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

    const updateQuantity = async (item: InventoryItem, action: 'increment' | 'decrement') => {
        const newQuantity = action === 'increment' ? item.quantity + 1 : item.quantity - 1;

        if (newQuantity < 0) {
            toast.error("Quantity cannot be negative");
            return;
        }

        setLoadingItems(prev => new Set(prev).add(item.id));

        try {
            const response = await fetch(`/api/inventory/${item.id}/quantity`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (!response.ok) throw new Error('Failed to update quantity');

            const data = await response.json();

            // Optimistic UI update via callback
            if (onQuantityChange) {
                onQuantityChange(item.id, data.quantity);
            }

            toast.success(`Updated ${item.name} quantity to ${data.quantity}`);
        } catch (error) {
            console.error('Failed to update quantity:', error);
            toast.error('Failed to update quantity');
        } finally {
            setLoadingItems(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/10">
                <p className="text-foreground/40">No inventory items found.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-[2.5rem] border border-white/10 bg-white/5">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/10 text-left text-xs font-bold uppercase text-foreground/40">
                        <th className="p-6">Item</th>
                        <th className="p-6">Property</th>
                        <th className="p-6 text-center">Qty</th>
                        <th className="p-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {items.map((item) => {
                        const isLowStock = item.lowStockThreshold && item.quantity <= item.lowStockThreshold;
                        const isLoading = loadingItems.has(item.id);

                        return (
                            <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-foreground/20" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold">{item.name}</div>
                                            {item.description && (
                                                <div className="text-xs text-foreground/40 line-clamp-1 max-w-[200px]">{item.description}</div>
                                            )}
                                            {item.link && (
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 mt-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>View Product</span>
                                                </a>
                                            )}
                                            {isLowStock && (
                                                <div className="mt-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400 inline-block">
                                                    ⚠️ Low Stock
                                                </div>
                                            )}
                                            {item.reminderEnabled && item.nextReminderDate && (
                                                <div className="mt-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 inline-block">
                                                    📅 Reminder on {new Date(item.nextReminderDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    {item.property ? (
                                        <span className="px-3 py-1 rounded-lg bg-white/5 text-xs font-medium border border-white/5">
                                            {item.property.name}
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-medium border border-brand-500/20">
                                            Global
                                        </span>
                                    )}
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item, 'decrement')}
                                            disabled={isLoading || item.quantity <= 0}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                                            title="Decrease quantity"
                                        >
                                            <Minus className="w-4 h-4 text-foreground/60 group-hover/btn:text-red-400" />
                                        </button>
                                        <span className={`font-mono font-bold min-w-[3ch] text-center ${isLowStock ? 'text-yellow-400' :
                                                item.quantity < 5 ? 'text-orange-400' :
                                                    'text-foreground'
                                            }`}>
                                            {isLoading ? '...' : item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item, 'increment')}
                                            disabled={isLoading}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                                            title="Increase quantity"
                                        >
                                            <Plus className="w-4 h-4 text-foreground/60 group-hover/btn:text-green-400" />
                                        </button>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-foreground/60" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(item)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
