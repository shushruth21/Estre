/**
 * Generate pricing_breakdown JSON for Sale Orders
 * Matches the exact format from the Sale Order example
 */

import { PricingBreakdown } from "./dynamic-pricing";

export interface PricingBreakdownProduct {
  category: string; // "sofa" | "sofabed" | "bed" | "recliner" | etc
  model: string; // "Dolce" | "Albatross" | etc
  base_price: number;
  no_of_seats: {
    front?: string; // "4-Seater"
    front_left?: string;
    left?: string;
    front_right?: string;
    right?: string;
  };
  consoles?: {
    count: number;
    size: string; // "Console-10 In"
    positioning: Array<{
      console: string; // "Front Console 1"
      position: string; // "After 1st Seat from Left"
    }>;
    total_cost: number;
  };
  lounger?: {
    count: number;
    size: string; // "Lounger-7 ft"
    positioning: string; // "Both LHS & RHS"
    with_storage?: boolean;
    cost: number;
  };
  recliner?: {
    required: boolean;
    positioning: string; // "Right Hand Side (RHS)"
    cost: number;
  };
  pillows?: {
    count: number;
    type: string; // "Belt Quilted Pillow"
    size: string; // "18 in X 18 in"
    colour_option: string; // "Dual Colour"
    cost: number;
  };
  fabric: {
    selection: string; // "Multi Colour" | "Single Colour"
    structure?: string; // "ES:VJ-F-Conoor-20"
    back_rest_cushion?: string; // "ES:VJ-F-Conoor-12"
    seat?: string; // "ES:VJ-F-Conoor-12"
    headrest?: string; // "ES:VJ-F-Conoor-12"
    pillow_colours?: string[]; // ["ES:VJ-F-Conoor-12", "ES:VJ-F-Litchi-204"]
    upgrade_charges: number;
  };
  foam: {
    type: string; // "Memory Foam"
    upgrade_charges: number;
  };
  seat_dimensions: {
    depth: string; // "26 in"
    width: string; // "30 in"
    height: string; // "18 in"
    depth_cost: number;
    width_cost: number;
    height_cost: number;
  };
  armrest: {
    type: string; // "Default"
    cost: number;
  };
  legs: {
    type: string; // "Kulfi-Gold 6 in"
    cost: number;
  };
  accessories: {
    items: Array<{
      position: string; // "Dual USB Charger-Round shaped Black, Rose Gold border"
      location: string; // "Left Arm Rest" | "Right Arm Rest" | "Front Console 1" | etc
    }>;
    upgrade_cost: number;
  };
  wood_type: string; // "Pine (Default)"
  stitch_type: string; // "Felled Seam / Double Stitched Seam"
  approximate_width: string; // "193 inches"
  subtotal: number;
}

export interface PricingBreakdownData {
  products: PricingBreakdownProduct[];
  gst: number;
  total: number;
}

export function generatePricingBreakdown(
  orderItem: any,
  configuration: any,
  pricingBreakdown: PricingBreakdown,
  saleOrderData?: any
): PricingBreakdownProduct {
  const category = (orderItem.product_category || "sofa").toLowerCase();
  const model = orderItem.product_title || configuration.model || "Custom Model";
  const basePrice = pricingBreakdown.basePrice || 0;

  // Extract seat information
  const sections = configuration.sections || {};
  const noOfSeats: any = {};
  
  if (sections.F?.seater) {
    noOfSeats.front = sections.F.seater;
  }
  if (sections.FL?.seater) {
    noOfSeats.front_left = sections.FL.seater;
  }
  if (sections.L1?.seater || sections.L2?.seater) {
    noOfSeats.left = sections.L1?.seater || sections.L2?.seater;
  }
  if (sections.FR?.seater) {
    noOfSeats.front_right = sections.FR?.seater;
  }
  if (sections.R1?.seater || sections.R2?.seater) {
    noOfSeats.right = sections.R1?.seater || sections.R2?.seater;
  }

  // Extract console information
  const consolePlacements = configuration.console?.placements || [];
  const consolePositions = consolePlacements
    .filter((p: any) => p && p.position && p.position !== "none")
    .map((p: any, index: number) => {
      const section = (p.section || "F").toUpperCase();
      const match = p.position.match(/(\d+)/);
      const consoleNum = match ? parseInt(match[1], 10) : index + 1;
      return {
        console: `Front Console ${consoleNum}`,
        position: `After ${consoleNum}${consoleNum === 1 ? "st" : consoleNum === 2 ? "nd" : "rd"} Seat from Left`,
      };
    });

  const consoles = consolePlacements.length > 0 ? {
    count: consolePositions.length,
    size: configuration.console?.size || "Console-10 In",
    positioning: consolePositions,
    total_cost: pricingBreakdown.consolePrice || 0,
  } : undefined;

  // Extract lounger information
  const lounger = configuration.lounger?.required ? {
    count: configuration.lounger?.numberOfLoungers || configuration.lounger?.quantity || 1,
    size: configuration.lounger?.size || "",
    positioning: configuration.lounger?.placement || configuration.lounger?.position || "",
    with_storage: configuration.lounger?.storage === "Yes" || configuration.lounger?.storage === true,
    cost: pricingBreakdown.loungerPrice || 0,
  } : undefined;

  // Extract recliner information (for sofabed)
  const recliner = configuration.recliner?.required ? {
    required: true,
    positioning: configuration.recliner?.position || "",
    cost: pricingBreakdown.reclinerPrice || 0,
  } : undefined;

  // Extract pillow information
  const pillows = configuration.additionalPillows?.required ? {
    count: configuration.additionalPillows?.quantity || 0,
    type: configuration.additionalPillows?.type || "",
    size: configuration.additionalPillows?.size || "",
    colour_option: configuration.additionalPillows?.fabricPlan || "Single Colour",
    cost: pricingBreakdown.pillowsPrice || 0,
  } : undefined;

  // Extract fabric information
  const fabricPlan = configuration.fabric?.claddingPlan || "Single Colour";
  const fabric = {
    selection: fabricPlan,
    structure: configuration.fabric?.structureCode,
    back_rest_cushion: configuration.fabric?.backrestCode,
    seat: configuration.fabric?.seatCode,
    headrest: configuration.fabric?.headrestCode,
    pillow_colours: [
      configuration.additionalPillows?.fabricColour,
      configuration.additionalPillows?.fabricColour1,
      configuration.additionalPillows?.fabricColour2,
    ].filter(Boolean),
    upgrade_charges: pricingBreakdown.fabricCharges || 0,
  };

  // Extract foam information
  const foam = {
    type: configuration.foam?.type || "Firm",
    upgrade_charges: pricingBreakdown.foamUpgrade || 0,
  };

  // Extract seat dimensions
  const seatDepth = configuration.dimensions?.seatDepth || 22;
  const seatWidth = configuration.dimensions?.seatWidth || 22;
  const seatHeight = configuration.dimensions?.seatHeight || 18;
  
  // Calculate dimension upgrade costs (simplified - actual calculation may vary)
  const dimensionUpgrade = pricingBreakdown.dimensionUpgrade || 0;
  const depthCost = seatDepth > 22 ? dimensionUpgrade * 0.3 : 0;
  const widthCost = seatWidth > 22 ? dimensionUpgrade * 0.7 : 0;

  const seat_dimensions = {
    depth: `${seatDepth} in`,
    width: `${seatWidth} in`,
    height: `${seatHeight} in`,
    depth_cost: depthCost,
    width_cost: widthCost,
    height_cost: 0,
  };

  // Extract armrest information
  const armrest = {
    type: configuration.armrest?.type || "Default",
    cost: pricingBreakdown.armrestUpgrade || 0,
  };

  // Extract legs information
  const legs = {
    type: configuration.legs?.type || "Standard",
    cost: pricingBreakdown.accessoriesPrice || 0,
  };

  // Extract accessories
  const accessories = {
    items: consolePlacements
      .filter((p: any) => p?.accessoryId && p.accessoryId !== "none")
      .map((p: any, index: number) => ({
        position: p.accessoryDescription || "Accessory",
        location: `Front Console ${index + 1}`,
      })),
    upgrade_cost: pricingBreakdown.accessoriesPrice || 0,
  };

  // Calculate approximate width
  const approximateWidth = calculateApproximateWidth(configuration, seatWidth);

  // Calculate subtotal
  const subtotal = pricingBreakdown.total || pricingBreakdown.subtotal || basePrice;

  return {
    category,
    model,
    base_price: basePrice,
    no_of_seats: noOfSeats,
    consoles,
    lounger,
    recliner,
    pillows,
    fabric,
    foam,
    seat_dimensions,
    armrest,
    legs,
    accessories,
    wood_type: configuration.wood?.type || "Pine (Default)",
    stitch_type: configuration.stitch?.type || "Standard Stitch",
    approximate_width: `${approximateWidth} inches`,
    subtotal,
  };
}

function calculateApproximateWidth(configuration: any, seatWidth: number): number {
  const sections = configuration.sections || {};
  let width = 0;

  Object.values(sections).forEach((section: any) => {
    if (!section?.seater || section.seater === "none") return;
    const match = section.seater.match(/(\d+)/);
    const seatCount = match ? parseInt(match[1], 10) : 1;
    const qty = section.qty || 1;
    width += seatWidth * seatCount * qty;
  });

  return width || seatWidth * 2;
}

