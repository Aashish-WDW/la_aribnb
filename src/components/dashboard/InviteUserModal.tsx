"use client";

import { useState, useEffect } from "react";
import { X, Mail, UserPlus, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<'OWNER' | 'MANAGER' | 'VIEWER'>('VIEWER');
    const [propertyId, setPropertyId] = useState("");
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [invitationUrl, setInvitationUrl] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchProperties();
        }
    }, [isOpen]);

    async function fetchProperties() {
        try {
            const res = await fetch("/api/properties");
            if (res.ok) {
                const data = await res.json();
                setProperties(data);
                if (data.length > 0) {
                    setPropertyId(data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch properties:", error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setInvitationUrl("");
        setLoading(true);

        try {
            const res = await fetch("/api/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role, propertyId })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to send invitation");
            }

            const data = await res.json();
            setInvitationUrl(data.invitationUrl); // For testing/development

            // Reset form
            setEmail("");
            setRole('VIEWER');

            onSuccess();

            // Show success message for a moment before closing
            setTimeout(() => {
                setInvitationUrl("");
                onClose();
            }, 3000);
        } catch (error: any) {
            setError(error.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass rounded-[2.5rem] p-8 w-full max-w-md relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-brand-500/10 rounded-2xl">
                            <UserPlus className="w-6 h-6 text-brand-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Invite User</h2>
                    </div>

                    {invitationUrl ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-green-400 font-medium mb-2">✓ Invitation sent successfully!</p>
                                <p className="text-sm text-foreground/60">
                                    An invitation has been sent to <strong>{email}</strong>
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-xs text-foreground/40 mb-2">Invitation URL (for testing):</p>
                                <code className="text-xs text-brand-400 break-all">{invitationUrl}</code>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Shield className="w-4 h-4 inline mr-2" />
                                    Role
                                </label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all [&>option]:bg-zinc-900 appearance-none cursor-pointer"
                                    >
                                        <option value="VIEWER">Viewer - Can view only</option>
                                        <option value="MANAGER">Manager - Can edit and manage</option>
                                        <option value="OWNER">Owner - Full access</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Property</label>
                                <div className="relative">
                                    <select
                                        value={propertyId}
                                        onChange={(e) => setPropertyId(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all [&>option]:bg-zinc-900 appearance-none cursor-pointer"
                                    >
                                        {properties.map((prop) => (
                                            <option key={prop.id} value={prop.id}>
                                                {prop.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Sending..." : "Send Invitation"}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
