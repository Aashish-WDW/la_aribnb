// Telegram notification service
interface TelegramMessage {
    text: string;
    parse_mode?: 'HTML' | 'Markdown';
}

export async function sendTelegramNotification(
    botToken: string,
    chatId: string,
    message: string
): Promise<boolean> {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        if (!response.ok) {
            console.error('Telegram API error:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
        return false;
    }
}

// Format booking notification
export function formatBookingNotification(booking: {
    customerName: string;
    checkIn: string;
    checkOut: string;
    propertyName?: string;
    roomName?: string;
    price: number;
}): string {
    const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();
    const location = booking.roomName
        ? `${booking.propertyName} - ${booking.roomName}`
        : booking.propertyName || 'Property';

    return `🏠 <b>New Booking</b>

👤 Guest: ${booking.customerName}
📍 Location: ${location}
📅 Check-in: ${checkIn}
📅 Check-out: ${checkOut}
💰 Price: $${booking.price}`;
}

// Format inventory notification
export function formatInventoryNotification(item: {
    name: string;
    quantity: number;
    threshold: number;
    propertyName?: string;
}): string {
    const location = item.propertyName || 'All Properties';

    return `📦 <b>Low Inventory Alert</b>

📝 Item: ${item.name}
📍 Location: ${location}
📊 Current: ${item.quantity} (Threshold: ${item.threshold})
⚠️ Please restock soon!`;
}

// Format task notification
export function formatTaskNotification(task: {
    title: string;
    description?: string;
    priority: string;
    dueDate?: string;
    propertyName?: string;
}): string {
    const priority = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢';
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    const location = task.propertyName || 'General';

    return `✅ <b>Task Update</b>

${priority} ${task.title}
📍 Location: ${location}
📅 Due: ${dueDate}
${task.description ? `📝 ${task.description}` : ''}`;
}
