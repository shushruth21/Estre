import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Copy } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      eventId: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = `ERR-${Date.now()}`;

    logger.error(error, {
      componentStack: errorInfo.componentStack,
      source: "ErrorBoundary",
      eventId
    }, "UI_CRASH");

    this.setState({
      error,
      errorInfo,
      eventId
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });
    window.location.href = "/";
  };

  copyErrorDetails = () => {
    if (this.state.error) {
      const details = JSON.stringify({
        message: this.state.error.message,
        eventId: this.state.eventId,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo?.componentStack
      }, null, 2);
      navigator.clipboard.writeText(details);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/20 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold">Application Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">
                We apologize for the inconvenience. A critical error has occurred and the details have been logged.
              </p>

              {this.state.eventId && (
                <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                  Error ID: {this.state.eventId}
                </p>
              )}

              {import.meta.env.DEV && this.state.error && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-left overflow-hidden">
                  <p className="text-xs font-mono text-destructive mb-1 break-words font-semibold">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-[10px] text-muted-foreground cursor-pointer">
                      <summary>Component Stack</summary>
                      <pre className="mt-2 overflow-auto max-h-32 p-2 bg-background rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0">
              <div className="flex gap-2 w-full">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  <Home className="h-4 w-4" />
                </Button>
              </div>
              {import.meta.env.DEV && (
                <Button variant="ghost" size="sm" onClick={this.copyErrorDetails} className="w-full text-xs">
                  <Copy className="h-3 w-3 mr-2" />
                  Copy Error Details
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

