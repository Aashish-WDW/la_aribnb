"use client";

import { Home, MoreVertical, Bed, Users, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface PropertyCardProps {
    property: {
        id: string;
        name: string;
        description: string;
        rooms: any[];
    };
    onEdit: (id: string) => void;
}

export default function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps & { onDelete: (id: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-[2.5rem] group hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-brand-500/10 rounded-2xl text-brand-400 group-hover:scale-110 transition-transform">
                    <Home className="w-8 h-8" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(property.id)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Pencil className="w-4 h-4 text-foreground/60" />
                    </button>
                    <button
                        onClick={() => onDelete(property.id)}
                        className="p-2.5 bg-red-400/5 hover:bg-red-400/10 rounded-xl transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-xl font-bold group-hover:text-brand-400 transition-colors">{property.name}</h3>
                    <p className="text-sm text-foreground/40 mt-1 line-clamp-2">{property.description}</p>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Bed className="w-4 h-4 text-brand-400/60" />
                        <span className="font-medium">{property.rooms.length} Rooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Users className="w-4 h-4 text-blue-400/60" />
                        <span className="font-medium">12 Max Guests</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
