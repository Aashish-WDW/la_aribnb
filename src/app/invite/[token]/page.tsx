"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, CheckCircle2, XCircle, UserPlus } from "lucide-react";

export default function InvitePage({ params }: { params: { token: string } }) {
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'redirect'>('loading');
    const [message, setMessage] = useState('');
    const [propertyName, setPropertyName] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        checkAuthAndAccept();
    }, []);

    const checkAuthAndAccept = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not authenticated, redirect to login with return path
                setStatus('redirect');
                setMessage('Redirecting to login...');
                router.push(`/login?redirect=${encodeURIComponent(`/invite/${params.token}`)}`);
                return;
            }

            // User is authenticated, accept the invitation
            const response = await fetch(`/api/invitations/${params.token}/accept`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
            }

            setStatus('success');
            setMessage('Invitation accepted successfully!');
            setPropertyName(data.propertyName || '');

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (error: any) {
            console.error('Error accepting invitation:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to accept invitation');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Processing Invitation</h1>
                            <p className="text-slate-400">Please wait while we confirm your invitation...</p>
                        </>
                    )}

                    {status === 'redirect' && (
                        <>
                            <UserPlus className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
                            <p className="text-slate-400 mb-4">{message}</p>
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Success!</h1>
                            <p className="text-slate-400 mb-2">{message}</p>
                            {propertyName && (
                                <p className="text-blue-400 font-medium">
                                    You now have access to: {propertyName}
                                </p>
                            )}
                            <p className="text-slate-500 text-sm mt-4">Redirecting to dashboard...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                            <p className="text-red-400 mb-4">{message}</p>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
                            >
                                Go to Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
