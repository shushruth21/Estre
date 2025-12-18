export const logError = (message: string, error: unknown, context: Record<string, unknown> = {}) => {
    const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
    } : { message: String(error) };

    console.error(JSON.stringify({
        level: 'error',
        message,
        error: errorDetails,
        ...context,
        timestamp: new Date().toISOString()
    }));
};

export const logInfo = (message: string, context: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({
        level: 'info',
        message,
        ...context,
        timestamp: new Date().toISOString()
    }));
};
