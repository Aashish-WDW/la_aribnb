import { getServiceSupabase } from './supabase-server';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    created_at: string;
    data?: any;
}

/**
 * Send a notification to a specific user
 * This should be called from API routes or server components
 */
export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    data?: any
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getServiceSupabase();

        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                data,
            });

        if (error) {
            console.error('Error sending notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Failed to send notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
        const supabase = getServiceSupabase();

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
        const supabase = getServiceSupabase();

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        return false;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
    try {
        const supabase = getServiceSupabase();

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('Error deleting notification:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to delete notification:', error);
        return false;
    }
}
