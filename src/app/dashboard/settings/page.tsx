"use client";

import { useState, useEffect } from "react";
import { Send, MessageSquare, Check, X } from "lucide-react";
import { LoadingState } from "@/components/ui/states";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [botToken, setBotToken] = useState("");
    const [chatId, setChatId] = useState("");
    const [enabled, setEnabled] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/telegram");
            if (res.ok) {
                const data = await res.json();
                setBotToken(data.botToken || "");
                setChatId(data.chatId || "");
                setEnabled(data.enabled || false);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ botToken, chatId, enabled })
            });

            if (!res.ok) throw new Error("Failed to save settings");

            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    }

    async function handleTest() {
        if (!botToken || !chatId) {
            setMessage({ type: 'error', text: 'Please enter both Bot Token and Chat ID' });
            return;
        }

        setTesting(true);
        setMessage(null);
        try {
            const testMessage = `🔔 <b>Test Notification</b>\n\nYour Telegram integration is working correctly!\n\n✅ LookAround Property Management`;

            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: testMessage,
                    parse_mode: 'HTML'
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.description || 'Failed to send test message');
            }

            setMessage({ type: 'success', text: 'Test notification sent! Check your Telegram.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to send test notification' });
        } finally {
            setTesting(false);
        }
    }

    if (loading) {
        return <LoadingState message="Loading settings..." />;
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-bold mb-2">Settings</h1>
                <p className="text-foreground/60">Configure your notification preferences</p>
            </header>

            <div className="glass rounded-[2.5rem] p-8 max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-500/10 rounded-2xl">
                        <MessageSquare className="w-6 h-6 text-brand-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Telegram Notifications</h2>
                        <p className="text-sm text-foreground/60">Get notified about bookings, inventory, and tasks</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        <div className="flex items-center gap-2">
                            {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            <span>{message.text}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <h3 className="font-bold">Enable Telegram Notifications</h3>
                            <p className="text-sm text-foreground/60">Receive notifications via Telegram</p>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`relative w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-brand-500' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Bot Token */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Bot Token</label>
                        <input
                            type="text"
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-500/50 transition-all"
                        />
                        <p className="text-xs text-foreground/40 mt-2">
                            Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">@BotFather</a>
                        </p>
                    </div>

                    {/* Chat ID */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Chat ID</label>
                        <input
                            type="text"
                            value={chatId}
                            onChange={(e) => setChatId(e.target.value)}
                            placeholder="123456789"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-brand-500/50 transition-all"
                        />
                        <p className="text-xs text-foreground/40 mt-2">
                            Get your chat ID from <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">@userinfobot</a>
                        </p>
                    </div>

                    {/* Notification Types */}
                    <div className="p-4 bg-white/5 rounded-xl space-y-3">
                        <h3 className="font-bold mb-3">You will receive notifications for:</h3>
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-400" />
                            <span>New bookings</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-400" />
                            <span>Low inventory alerts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-400" />
                            <span>Task updates and reminders</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleTest}
                            disabled={testing || !botToken || !chatId}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                            {testing ? "Sending..." : "Send Test"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
