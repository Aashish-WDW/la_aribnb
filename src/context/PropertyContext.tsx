"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface Property {
    id: string;
    name: string;
}

interface PropertyContextType {
    properties: Property[];
    activePropertyId: string | null;
    activeProperty: Property | null;
    setActivePropertyId: (id: string) => void;
    loading: boolean;
}

const PropertyContext = createContext<PropertyContextType>({
    properties: [],
    activePropertyId: null,
    activeProperty: null,
    setActivePropertyId: () => { },
    loading: true,
});

export function useProperty() {
    return useContext(PropertyContext);
}

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string) {
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365}`;
}

export function PropertyProvider({ children }: { children: ReactNode }) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [activePropertyId, setActivePropertyIdState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch("/api/properties");
                if (res.ok) {
                    const data = await res.json();
                    const props: Property[] = data.map((p: any) => ({ id: p.id, name: p.name }));
                    setProperties(props);

                    // Restore from cookie or default to first property
                    const saved = getCookie("activePropertyId");
                    if (saved && props.some((p) => p.id === saved)) {
                        setActivePropertyIdState(saved);
                    } else if (props.length > 0) {
                        setActivePropertyIdState(props[0].id);
                        setCookie("activePropertyId", props[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch properties for context:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    const setActivePropertyId = useCallback(
        (id: string) => {
            setActivePropertyIdState(id);
            setCookie("activePropertyId", id);
        },
        []
    );

    const activeProperty = properties.find((p) => p.id === activePropertyId) || null;

    return (
        <PropertyContext.Provider
            value={{ properties, activePropertyId, activeProperty, setActivePropertyId, loading }}
        >
            {children}
        </PropertyContext.Provider>
    );
}
