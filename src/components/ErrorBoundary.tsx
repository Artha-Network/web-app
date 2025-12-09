import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Something went wrong
                        </h1>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            The application encountered an unexpected error.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left overflow-auto max-h-40">
                                <p className="font-mono text-xs text-red-600 dark:text-red-400 break-words">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <Button onClick={this.handleReload} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
