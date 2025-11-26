// Utility: Text formatting helpers
export function toTitle(str: string | undefined | null): string {
    if (!str) return "";
    return str.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

export function safe(value: any, fallback: string = "—"): string {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }
    return String(value);
}
