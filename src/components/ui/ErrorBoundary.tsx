"use client";

import React from "react";
import { ErrorState } from "./states";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorState
                    title="Oops! Something went wrong"
                    message={this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
                    retry={() => {
                        this.setState({ hasError: false, error: undefined });
                        window.location.reload();
                    }}
                />
            );
        }

        return this.props.children;
    }
}
