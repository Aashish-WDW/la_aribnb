"use client";

import { useEffect, useState } from "react";
import { Mail, UserPlus, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import InviteUserModal from "@/components/dashboard/InviteUserModal";
import { LoadingState, EmptyState } from "@/components/ui/states";

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    property: { id: string; name: string };
}

export default function InvitationsPage() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    async function fetchInvitations() {
        setLoading(true);
        try {
            const res = await fetch("/api/invitations");
            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (error) {
            console.error("Failed to fetch invitations:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchInvitations();
    }, []);

    function getStatusBadge(status: string) {
        const styles = {
            PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            ACCEPTED: "bg-green-500/10 text-green-400 border-green-500/20",
            EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20"
        };

        const icons = {
            PENDING: Clock,
            ACCEPTED: CheckCircle,
            EXPIRED: XCircle
        };

        const Icon = icons[status as keyof typeof icons] || Clock;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    }

    function getRoleBadge(role: string) {
        const styles = {
            OWNER: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            MANAGER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            VIEWER: "bg-gray-500/10 text-gray-400 border-gray-500/20"
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[role as keyof typeof styles]}`}>
                {role}
            </span>
        );
    }

    if (loading) {
        return <LoadingState message="Loading invitations..." />;
    }

    return (
        <div className="space-y-8">
            <InviteUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchInvitations}
            />

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Team Invitations</h1>
                    <p className="text-foreground/60">Manage access to your properties by inviting team members.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-bold transition-all shadow-premium hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                    <UserPlus className="w-5 h-5" />
                    Invite User
                </button>
            </header>

            {invitations.length === 0 ? (
                <EmptyState
                    icon={Mail}
                    title="No invitations yet"
                    description="Start collaborating by inviting team members to your properties."
                    action={{
                        label: "Send Your First Invitation",
                        onClick: () => setIsModalOpen(true)
                    }}
                />
            ) : (
                <div className="glass rounded-[2.5rem] overflow-hidden">
                    {/* Mobile: Show scroll hint */}
                    <div className="md:hidden px-6 py-3 bg-white/5 border-b border-white/10 text-xs text-foreground/60 text-center">
                        Scroll horizontally to view all columns →
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/60">Email</th>
                                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/60">Property</th>
                                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/60">Role</th>
                                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/60">Status</th>
                                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/60">Sent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {invitations.map((invitation) => (
                                    <tr key={invitation.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-foreground/40 flex-shrink-0" />
                                                <span className="font-medium truncate max-w-[200px]">{invitation.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-foreground/80">{invitation.property.name}</td>
                                        <td className="px-4 md:px-6 py-4">{getRoleBadge(invitation.role)}</td>
                                        <td className="px-4 md:px-6 py-4">{getStatusBadge(invitation.status)}</td>
                                        <td className="px-4 md:px-6 py-4 text-sm text-foreground/60 whitespace-nowrap">
                                            {new Date(invitation.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
