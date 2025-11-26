// Browserless PDF Generation Client
// Works reliably in Supabase Edge Functions

export async function browserlessPdf(html: string): Promise<Uint8Array> {
    const browserlessUrl = Deno.env.get("BROWSERLESS_URL");
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");

    if (!browserlessUrl) {
        throw new Error("BROWSERLESS_URL not set in environment variables");
    }

    if (!browserlessApiKey) {
        throw new Error("BROWSERLESS_API_KEY not set in environment variables");
    }

    const payload = {
        html,
        format: "A4",
        printBackground: true,
        margin: {
            top: "15mm",
            bottom: "15mm",
            left: "12mm",
            right: "12mm",
        },
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: `
      <div style="font-size:8px; text-align:center; width:100%; color:#444; padding-top:5mm;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
    };

    const response = await fetch(`${browserlessUrl}/pdf?token=${browserlessApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Browserless Error:", errorText);
        throw new Error(`PDF generation failed: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}
