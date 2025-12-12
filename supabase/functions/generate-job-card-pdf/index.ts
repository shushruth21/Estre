/**
 * Supabase Edge Function: Generate Job Card PDF
 * 
 * This function:
 * 1. Fetches job card data with technical specifications
 * 2. Generates HTML using template
 * 3. Converts HTML to PDF using Browserless API (or Playwright)
 * 4. Uploads PDF to Supabase Storage
 * 5. Updates job_card with PDF URL and HTML (draft_html/final_html, final_pdf_url)
 * 
 * Parameters:
 * - jobCardId: Required - ID of the job card
 * - mode: Optional - "draft" (preview) or "final", default: "final"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generatePremiumJobCardHTML } from "../_shared/premiumJobCardTemplate.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { jobCardId, mode = "final" } = await req.json();

    if (!jobCardId) {
      return new Response(
        JSON.stringify({ error: "jobCardId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch job card data
    const { data: jobCard, error: jobCardError } = await supabase
      .from("job_cards")
      .select(`
        *,
        sale_order:sale_orders(*)
      `)
      .eq("id", jobCardId)
      .single();

    if (jobCardError || !jobCard) {
      throw new Error(`Job card not found: ${jobCardError?.message}`);
    }

    // Get technical specifications from job card
    let technicalSpecs = jobCard.technical_specifications;
    if (!technicalSpecs) {
      console.warn("Job card missing technical_specifications");
      technicalSpecs = {};
    }

    // Get sale order info
    const saleOrder = jobCard.sale_order || {};
    const soNumber = saleOrder.order_number || jobCard.so_number || jobCard.order_number || "N/A";

    // Map technical specs to template format
    const specs: { category: string; items: { label: string; value: string }[] }[] = [];

    const formatKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (typeof technicalSpecs === 'object' && technicalSpecs !== null) {
      const hasCategories = Object.values(technicalSpecs).some(v => typeof v === 'object' && v !== null && !Array.isArray(v));

      if (hasCategories) {
        for (const [category, items] of Object.entries(technicalSpecs)) {
          if (typeof items === 'object' && items !== null) {
            specs.push({
              category: formatKey(category),
              items: Object.entries(items).map(([k, v]) => ({
                label: formatKey(k),
                value: String(v)
              }))
            });
          }
        }
      } else {
        specs.push({
          category: "General Specifications",
          items: Object.entries(technicalSpecs).map(([k, v]) => ({
            label: formatKey(k),
            value: String(v)
          }))
        });
      }
    }

    // Prepare template data
    const templateData = {
      jobCardNumber: jobCard.job_card_number,
      soNumber: soNumber,
      soDate: saleOrder.created_at
        ? new Date(saleOrder.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "—",
      jcIssueDate: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      deliveryDate: jobCard.expected_completion_date
        ? new Date(jobCard.expected_completion_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "—",
      productTitle: jobCard.product_title || "Product",
      productCategory: jobCard.product_category || "Furniture",
      model: jobCard.product_name || "Custom",
      specs: specs
    };

    // Generate HTML
    const htmlContent = generatePremiumJobCardHTML(templateData);

    // Convert HTML to PDF using Browserless API
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    const browserlessUrl = Deno.env.get("BROWSERLESS_URL") || "https://chrome.browserless.io";

    let pdfBytes: Uint8Array;

    if (browserlessApiKey) {
      const browserlessResponse = await fetch(`${browserlessUrl}/pdf?token=${browserlessApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
          options: {
            format: "A4",
            printBackground: true,
            margin: {
              top: "10mm",
              right: "10mm",
              bottom: "10mm",
              left: "10mm",
            },
          },
        }),
      });

      if (!browserlessResponse.ok) {
        throw new Error(`Browserless API error: ${browserlessResponse.statusText}`);
      }

      pdfBytes = new Uint8Array(await browserlessResponse.arrayBuffer());
    } else {
      throw new Error(
        "PDF generation requires Browserless API. Please set BROWSERLESS_API_KEY environment variable."
      );
    }

    // Upload to Supabase Storage
    const fileName = `job-cards/${mode}/${jobCardId}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // Update job card with PDF URL and HTML
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (mode === "draft") {
      updateData.draft_html = htmlContent;
    } else {
      updateData.final_html = htmlContent;
      updateData.final_pdf_url = urlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("job_cards")
      .update(updateData)
      .eq("id", jobCardId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${mode === "draft" ? "Draft" : "Final"} PDF generated successfully`,
        jobCardId,
        pdfUrl: urlData.publicUrl,
        mode: mode,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate PDF",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
