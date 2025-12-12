/**
 * PDF Download Utility
 * 
 * Provides reliable PDF download functionality for Supabase Storage URLs
 * Works with cross-origin URLs by fetching the file and creating a blob download
 */

/**
 * Download a PDF file from a URL (works with Supabase Storage URLs)
 * @param pdfUrl - The URL of the PDF file
 * @param filename - The filename for the downloaded file (e.g., "sale-order-SO-12345.pdf")
 */
export async function downloadPDF(pdfUrl: string, filename: string): Promise<void> {
  try {
    // For same-origin URLs or if browser supports download attribute, use simple approach
    if (pdfUrl.startsWith('/') || pdfUrl.includes(window.location.origin)) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // For cross-origin URLs (like Supabase Storage), fetch and download as blob
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    // Fallback: open in new tab
    window.open(pdfUrl, '_blank');
    throw error;
  }
}

/**
 * Get the PDF URL from a sale order (prioritizes final > draft > pdf_url)
 * @param saleOrder - The sale order object
 * @returns The PDF URL or null if not available
 */
export function getSaleOrderPDFUrl(saleOrder: {
  final_pdf_url?: string | null;
  draft_pdf_url?: string | null;
  pdf_url?: string | null;
}): string | null {
  return saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url || null;
}

/**
 * Generate a filename for a sale order PDF
 * @param orderNumber - The order number or sale order number
 * @param prefix - Optional prefix (default: "sale-order")
 * @returns The filename (e.g., "sale-order-SO-12345.pdf")
 */
export function generatePDFFilename(orderNumber: string, prefix: string = 'sale-order'): string {
  // Remove any invalid filename characters
  const sanitized = orderNumber.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${prefix}-${sanitized}.pdf`;
}








