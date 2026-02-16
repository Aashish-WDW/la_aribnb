"use client";

import { motion } from "framer-motion";
import { Users, Mail, Shield, Plus, MoreVertical } from "lucide-react";

const team = [
    { id: 1, name: "Sarah Caretaker", email: "sarah@example.com", role: "CARETAKER", status: "ACTIVE" },
    { id: 2, name: "John Manager", email: "john@example.com", role: "MANAGER", status: "PENDING" },
];

export default function TeamPage() {
    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Team Management</h1>
                    <p className="text-foreground/60">Invite caretakers and managers to help manage your properties.</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-bold transition-all shadow-premium hover:scale-105 active:scale-95 whitespace-nowrap">
                    <Plus className="w-5 h-5" />
                    Invite User
                </button>
            </header>

            {/* Team List */}
            <div className="glass rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold">Collaborators</h2>
                </div>
                <div className="divide-y divide-white/5">
                    {team.map((member, index) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-8 hover:bg-white/2 transition-colors group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-xl font-bold text-brand-400">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-lg">{member.name}</div>
                                    <div className="text-sm text-foreground/40 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" />
                                        {member.email}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12">
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 mb-1">
                                        <Shield className="w-4 h-4 text-brand-400" />
                                        {member.role}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                        member.status === "ACTIVE" ? "bg-emerald-400/10 text-emerald-400" : "bg-brand-500/10 text-brand-400"
                                    )}>
                                        {member.status}
                                    </span>
                                </div>
                                <button className="p-3 hover:bg-white/5 rounded-xl transition-colors text-foreground/20 hover:text-white">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Simple cn helper since this is a new file
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
