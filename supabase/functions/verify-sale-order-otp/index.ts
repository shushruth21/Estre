/**
 * Supabase Edge Function: Verify Sale Order OTP
 * 
 * This function:
 * 1. Verifies the OTP provided by the user
 * 2. If valid, updates sale order status to 'confirmed_by_customer'
 * 3. Automatically generates Job Cards for all order items
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateTechnicalSpecifications } from "../_shared/technicalSpecsGenerator.ts";
import { generatePremiumJobCardHTML } from "../_shared/premiumJobCardTemplate.ts";
import { mapJobCardData } from "../_shared/mapJobCardData.ts";
import { mapJobCardToQIR } from "../_shared/mapQIRData.ts";
import { generateQIRHTML } from "../_shared/premiumQIRTemplate.ts";

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
        const { saleOrderId, otpCode } = await req.json();

        if (!saleOrderId || !otpCode) {
            return new Response(
                JSON.stringify({ error: "saleOrderId and otpCode are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch sale order to verify OTP
        const { data: saleOrder, error: fetchError } = await supabase
            .from("sale_orders")
            .select("*, order:orders(*, order_items:order_items(*))")
            .eq("id", saleOrderId)
            .single();

        if (fetchError || !saleOrder) {
            throw new Error("Sale order not found");
        }

        // 2. Verify OTP
        if (saleOrder.otp_code !== otpCode) {
            return new Response(
                JSON.stringify({ error: "Invalid OTP code" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check expiration (optional, but good practice)
        if (saleOrder.otp_expires_at && new Date(saleOrder.otp_expires_at) < new Date()) {
            return new Response(
                JSON.stringify({ error: "OTP has expired. Please request a new one." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 3. Update status and clear OTP
        const { error: updateError } = await supabase
            .from("sale_orders")
            .update({
                status: "confirmed_by_customer",
                otp_code: null, // Clear OTP after successful use
                otp_expires_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", saleOrderId);

        if (updateError) throw updateError;

        // 4. Create Job Cards
        const orderItems = saleOrder.order?.order_items || [];
        const jobCardsToCreate = [];

        for (const [index, item] of orderItems.entries()) {
            // Parse configuration
            let config: any = {};
            try {
                config = typeof item.configuration === 'string'
                    ? JSON.parse(item.configuration)
                    : item.configuration || {};
            } catch (e) {
                console.error("Error parsing configuration", e);
            }

            // Generate technical specs
            const technicalSpecs = generateTechnicalSpecifications(item, config);

            // Prepare Job Card Data Object for mapping
            const jobCardData = {
                sale_order_id: saleOrder.id,
                order_id: saleOrder.order_id,
                order_item_id: item.id,
                job_card_number: `${saleOrder.order_number || 'SO'}/${String(index + 1).padStart(2, '0')}`,
                product_title: item.product_title,
                product_category: item.product_category,
                product_type: technicalSpecs.product_type,
                configuration: config,
                technical_specifications: technicalSpecs,
                status: 'pending',
                issue_date: new Date().toISOString(),
                customer_name: saleOrder.order?.customer_name,
                customer_email: saleOrder.order?.customer_email,
            };

            // Generate HTML
            let finalHtml = "";
            try {
                const templateData = mapJobCardData(jobCardData, saleOrder);
                finalHtml = generatePremiumJobCardHTML(templateData);
            } catch (e) {
                console.error("Error generating Job Card HTML", e);
            }

            // Add HTML to record
            jobCardsToCreate.push({
                ...jobCardData,
                final_html: finalHtml,
                draft_html: finalHtml
            });
        }

        if (jobCardsToCreate.length > 0) {
            const { data: createdJobCards, error: jobCardError } = await supabase
                .from("job_cards")
                .insert(jobCardsToCreate)
                .select();

            if (jobCardError) {
                console.error("Error creating job cards:", jobCardError);
                // We don't throw here because the order is already confirmed, 
                // but we should log it. Staff can manually create job cards if needed.
            } else {
                console.log(`Created ${jobCardsToCreate.length} job cards`);

                // 6. Create Quality Inspection Reports for each job card
                if (createdJobCards && createdJobCards.length > 0) {
                    const qirsToCreate = [];

                    for (let i = 0; i < createdJobCards.length; i++) {
                        const jobCard = createdJobCards[i];
                        const qirNumber = `QIR-${saleOrder.order_number || saleOrder.id.slice(0, 8)}-${String(i + 1).padStart(2, '0')}`;

                        try {
                            // Map job card data to QIR format
                            const qirData = mapJobCardToQIR(jobCard, saleOrder, qirNumber);

                            // Generate QIR HTML
                            const qirHTML = generateQIRHTML(qirData);

                            qirsToCreate.push({
                                job_card_id: jobCard.id,
                                qir_number: qirNumber,
                                sale_order_number: saleOrder.order_number || `SO-${saleOrder.id.slice(0, 8)}`,
                                job_card_number: jobCard.job_card_number,
                                inspection_date: new Date().toISOString(),
                                inspector_name: null,
                                inspection_data: qirData,
                                status: 'pending',
                                qc_notes: null
                            });
                        } catch (qirError) {
                            console.error(`Error preparing QIR for job card ${jobCard.id}:`, qirError);
                        }
                    }

                    if (qirsToCreate.length > 0) {
                        const { error: qirError } = await supabase
                            .from("quality_inspections")
                            .insert(qirsToCreate);

                        if (qirError) {
                            console.error("Error creating QIRs:", qirError);
                        } else {
                            console.log(`Created ${qirsToCreate.length} Quality Inspection Reports`);
                        }
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Order confirmed, Job Cards and QIRs created successfully",
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
                error: error.message || "Internal Server Error",
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
