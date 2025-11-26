// Utility: Format numbers in Indian locale style
export function formatIndianNumber(num: number | undefined | null): string {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return Math.round(num).toLocaleString("en-IN");
}

export function formatCurrency(num: number | undefined | null): string {
    return `₹${formatIndianNumber(num)}`;
}
