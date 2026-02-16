"use client";

import { useState, useEffect } from "react";
import { Plus, Download, Filter } from "lucide-react";
import InventoryTable from "@/components/inventory/InventoryTable";
import AddInventoryModal from "@/components/inventory/AddInventoryModal";
import { downloadExcel, downloadPDF } from "@/lib/export";

interface Property {
    id: string;
    name: string;
}

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        fetchProperties();
        fetchInventory();
    }, [selectedPropertyId]);

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            if (res.ok) setProperties(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // For the API, if "all", we don't send propertyId to get everything (owned by user)
            // If specific, we send ID.
            // However, the user might want Global + Specific Property. 
            // Our API current implementation: ?propertyId=X returns ONLY items linked to X. 
            // It might miss "Global" items unless we handle logic.
            // For this UI, let's just fetch ALL (no filter) and filter client side for better UX 
            // or modify API.
            // Let's fetch all (owned by user) and filter in UI for instant switching.

            const res = await fetch("/api/inventory");
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredItems = items.filter(item => {
        if (selectedPropertyId === "all") return true;
        // Show items assigned to this property OR global items
        return item.propertyId === selectedPropertyId || item.propertyId === null;
    });

    const handleExport = (type: 'excel' | 'pdf') => {
        const exportData = filteredItems.map(item => ({
            Name: item.name,
            Quantity: item.quantity,
            Property: item.property?.name || "Global",
            Description: item.description || "",
            Link: item.link || ""
        }));

        const filename = `Inventory_${selectedPropertyId === 'all' ? 'All' : properties.find(p => p.id === selectedPropertyId)?.name || 'Property'}_${new Date().toISOString().split('T')[0]}`;

        if (type === 'excel') downloadExcel(exportData, filename);
        if (type === 'pdf') downloadPDF(exportData, filename, "Inventory Report");
    };

    const handleDelete = async (item: any) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
            fetchInventory();
        } catch (error) {
            console.error(error);
        }
    };

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    return (
        <div className="space-y-8">
            <AddInventoryModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                onSuccess={fetchInventory}
                itemToEdit={editingItem}
                properties={properties}
            />

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Inventory</h1>
                    <p className="text-foreground/60">Track supplies and assets across your properties</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                        className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-premium flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Item
                    </button>
                </div>
            </header>

            {/* Controls Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Filter className="w-5 h-5 text-foreground/40" />
                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 font-medium text-foreground [&>option]:bg-zinc-900"
                    >
                        <option value="all">All Properties</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => handleExport('excel')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Excel
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-foreground/40">Loading inventory...</div>
            ) : (
                <InventoryTable
                    items={filteredItems}
                    onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                    onQuantityChange={handleQuantityChange}
                />
            )}
        </div>
    );
}
