"use client";

import { useProperty } from "@/context/PropertyContext";
import { ChevronDown, Home } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function PropertySwitcher() {
    const { properties, activePropertyId, activeProperty, setActivePropertyId, loading } = useProperty();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (loading || properties.length === 0) return null;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
            >
                <Home className="w-4 h-4 text-brand-400" />
                <span className="truncate max-w-[140px]">
                    {activeProperty?.name || "Select Property"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 w-56 py-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50">
                    {properties.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => {
                                setActivePropertyId(p.id);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all ${p.id === activePropertyId
                                    ? "bg-brand-500/10 text-brand-400 font-semibold"
                                    : "text-foreground/60 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
