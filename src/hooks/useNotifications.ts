"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Notification } from '@/lib/notifications';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        // Fetch initial notifications
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
            } else if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }

            setLoading(false);
        };

        fetchNotifications();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => [payload.new as Notification, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev =>
                            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
                        );
                        setUnreadCount(prev => {
                            const updated = payload.new as Notification;
                            const old = notifications.find(n => n.id === updated.id);
                            if (old && !old.read && updated.read) {
                                return Math.max(0, prev - 1);
                            }
                            return prev;
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                        const deleted = notifications.find(n => n.id === payload.old.id);
                        if (deleted && !deleted.read) {
                            setUnreadCount(prev => Math.max(0, prev - 1));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (notificationId: string) => {
        const response = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId }),
        });

        if (response.ok) {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        const response = await fetch('/api/notifications/mark-all-read', {
            method: 'POST',
        });

        if (response.ok) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        const response = await fetch('/api/notifications/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId }),
        });

        if (response.ok) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };
}
