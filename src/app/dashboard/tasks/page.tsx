"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    property?: { name: string };
    room?: { name: string };
    booking?: { customerName: string };
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tasks");
            if (res.ok) {
                setTasks(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            OPEN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            IN_PROGRESS: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20"
        };
        return (
            <span className={cn("px-2 py-1 rounded-md text-[10px] uppercase font-bold border", styles[status as keyof typeof styles])}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const PriorityBadge = ({ priority }: { priority: string }) => {
        const styles = {
            LOW: "text-foreground/40",
            MEDIUM: "text-yellow-400",
            HIGH: "text-red-400"
        };
        return (
            <span className={cn("text-[10px] font-bold uppercase flex items-center gap-1", styles[priority as keyof typeof styles])}>
                <AlertCircle className="w-3 h-3" />
                {priority}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Tasks & Events</h1>
                    <p className="text-foreground/60">Manage maintenance, cleaning, and guest requests.</p>
                </div>
                <button className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-premium flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['OPEN', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                    <div key={status} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col h-[70vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold capitalize">{status.replace('_', ' ').toLowerCase()}</h2>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-foreground/40">
                                {tasks.filter(t => t.status === status).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                            {tasks.filter(t => t.status === status).map(task => (
                                <div key={task.id} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <StatusBadge status={task.status} />
                                        <PriorityBadge priority={task.priority} />
                                    </div>
                                    <h3 className="font-bold mb-1">{task.title}</h3>
                                    {task.description && <p className="text-xs text-foreground/60 line-clamp-2 mb-3">{task.description}</p>}

                                    <div className="flex flex-wrap gap-2 text-[10px] font-medium text-foreground/40">
                                        {task.property && (
                                            <span className="px-2 py-1 bg-white/5 rounded-md flex items-center gap-1">
                                                🏠 {task.property.name}
                                            </span>
                                        )}
                                        {task.room && (
                                            <span className="px-2 py-1 bg-white/5 rounded-md flex items-center gap-1">
                                                🛏️ {task.room.name}
                                            </span>
                                        )}
                                        {task.dueDate && (
                                            <span className={cn("px-2 py-1 bg-white/5 rounded-md flex items-center gap-1",
                                                new Date(task.dueDate) < new Date() && status !== 'COMPLETED' ? "text-red-400 bg-red-500/10" : ""
                                            )}>
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(task.dueDate), "MMM d")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {tasks.filter(t => t.status === status).length === 0 && (
                                <div className="text-center py-10 opacity-30 text-sm">No tasks</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
