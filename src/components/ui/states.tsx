import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4"
    };

    return (
        <div className={cn(
            "border-brand-500/20 border-t-brand-500 rounded-full animate-spin",
            sizeClasses[size],
            className
        )} />
    );
}

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
}

export function LoadingState({ message = "Loading...", fullScreen = false }: LoadingStateProps) {
    const containerClass = fullScreen
        ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
        : "flex items-center justify-center h-[60vh]";

    return (
        <div className={containerClass}>
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                {message && <p className="text-foreground/60 text-sm">{message}</p>}
            </div>
        </div>
    );
}

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="glass rounded-[2.5rem] p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <Icon className="w-10 h-10 text-foreground/20" />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-foreground/60 mb-6">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

interface ErrorStateProps {
    title?: string;
    message: string;
    retry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, retry }: ErrorStateProps) {
    return (
        <div className="glass rounded-[2.5rem] p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-foreground/60 mb-6">{message}</p>
            {retry && (
                <button
                    onClick={retry}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-all"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
