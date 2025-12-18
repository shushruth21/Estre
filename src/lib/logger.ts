export interface LogContext {
    [key: string]: unknown;
}

export interface Logger {
    info: (event: string, context?: LogContext) => void;
    warn: (event: string, context?: LogContext) => void;
    error: (error: unknown, context?: LogContext, errorCode?: string) => void;
}

const formatContext = (context?: LogContext) => {
    return context ? JSON.stringify(context) : "";
};

const getBaseContext = () => {
    // In the future, we can add user ID, session ID, tenant ID etc here
    return {
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }
}

export const logger: Logger = {
    info: (event, context) => {
        const payload = { ...getBaseContext(), ...context };
        if (import.meta.env.DEV) {
            console.info(`[INFO] ${event}`, payload);
        } else {
            console.log(JSON.stringify({ level: 'info', event, ...payload }));
        }
    },

    warn: (event, context) => {
        const payload = { ...getBaseContext(), ...context };
        if (import.meta.env.DEV) {
            console.warn(`[WARN] ${event}`, payload);
        } else {
            console.warn(JSON.stringify({ level: 'warn', event, ...payload }));
        }
    },

    error: (error, context, errorCode) => {
        const errorDetails = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : { message: String(error) };

        const payload = {
            level: 'error',
            errorCode: errorCode || 'UNKNOWN_ERROR',
            error: errorDetails,
            ...getBaseContext(),
            ...context
        };

        if (import.meta.env.DEV) {
            console.error(`[ERROR] [${payload.errorCode}]`, error, context);
        } else {
            // In production, everything is a JSON line
            console.error(JSON.stringify(payload));
        }
    },
};
