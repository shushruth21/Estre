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

// Import HTML template generator
import { generateJobCardHTML } from "../_shared/htmlTemplates.ts";

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

    if (mode !== "draft" && mode !== "final") {
      return new Response(
        JSON.stringify({ error: "mode must be 'draft' or 'final'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch job card data with technical_specifications
    const { data: jobCard, error: jobCardError } = await supabase
      .from("job_cards")
      .select(`
        *,
        sale_order:sale_orders(
          order_number,
          created_at
        )
      `)
      .eq("id", jobCardId)
      .single();

    if (jobCardError || !jobCard) {
      throw new Error(`Job card not found: ${jobCardError?.message}`);
    }

    // Get technical specifications from job card
    let technicalSpecs = jobCard.technical_specifications;
    if (!technicalSpecs) {
      throw new Error("Job card missing technical_specifications. Please regenerate job card.");
    }

    // Get sale order info
    const saleOrder = jobCard.sale_order || {};
    const soNumber = saleOrder.order_number || jobCard.so_number || jobCard.order_number;

    // Prepare template data
    const templateData = {
      job_card_number: jobCard.job_card_number,
      so_number: soNumber,
      so_date: saleOrder.created_at 
        ? new Date(saleOrder.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date(jobCard.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      jc_issue_date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      assigned_to: jobCard.assigned_to || "",
      delivery_date: jobCard.expected_completion_date 
        ? new Date(jobCard.expected_completion_date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      technical_specifications: technicalSpecs,
    };

    // Generate HTML
    const htmlContent = generateJobCardHTML(templateData);

    // Convert HTML to PDF using Browserless API (recommended) or Playwright
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    const browserlessUrl = Deno.env.get("BROWSERLESS_URL") || "https://chrome.browserless.io";

    let pdfBytes: Uint8Array;

    if (browserlessApiKey) {
      // Use Browserless API
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
      // Fallback: Use Playwright in Deno (if available)
      // For now, return error if Browserless is not configured
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

