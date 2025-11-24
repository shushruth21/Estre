/**
 * Generate technical_specifications JSON for Job Cards
 * Matches the exact format from the Job Card example
 * NO pricing information included
 */

export interface TechnicalSpecifications {
  product_type: string; // "sofa" | "sofabed" | "bed" | "recliner"
  model: string; // "Dolce" | "Albatross"
  sofa_type?: string; // "Standard" (for sofas)
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
  };
  loungers?: {
    count: number;
    size: string; // "Lounger-7 ft"
    positioning: string; // "Both LHS & RHS"
    with_storage?: boolean;
  };
  recliner?: {
    required: boolean;
    positioning: string; // "Right Hand Side (RHS)"
  };
  frame: {
    wood_type: string; // "Pine (Default)"
  };
  seat_dimensions: {
    depth: string; // "26 in"
    width: string; // "30 in"
    height: string; // "18 in"
  };
  sofa_dimensions?: {
    front_sofa_width: string; // "193 in"
    left_sofa_width: string; // "3 in"
    right_sofa_width: string; // "0 in"
  };
  sofabed_dimensions?: {
    sofabed_width: string; // "144 in"
  };
  armrest: {
    type: string; // "Default"
    width?: string; // "X in each"
  };
  cutting_stitching: {
    stitching_type: string; // "Felled Seam / Double Stitched Seam"
  };
  fabric_description: {
    colour_details: string; // "Multi Colour" | "Single Colour"
    colour_breakup: {
      structure?: string; // "ES:VJ-F-Conoor-20"
      back_rest_cushion?: string; // "ES:VJ-F-Conoor-12"
      seat?: string; // "ES:VJ-F-Conoor-12"
      headrest?: string; // "ES:VJ-F-Conoor-12"
    };
    pillow_colours?: Array<{
      label: string; // "Single Color/Colour 1" | "Dual Color/Colour 2"
      code: string; // "ES:SG-LR-CUBA 01"
    }>;
  };
  legs: {
    leg_model: string; // "Kulfi-Gold 6 in"
  };
  accessories: Array<{
    location: string; // "Left Arm Rest" | "Right Arm Rest" | "Front Console 1" | etc
    description: string; // "Dual USB Charger-Round shaped Black, Rose Gold border"
  }>;
  wireframe?: {
    image_url?: string;
    description?: string;
  };
  fabric_required_m: {
    components: Array<{
      name: string; // "No. of seats" | "Console size" | "Lounger Size" | etc
      width?: string; // "72" | "7.5" | "24" | etc
      fabric_meters: number; // X.X
    }>;
    total: number;
  };
  foam: {
    type: string; // "Memory Foam" | "Soft"
  };
  overall_specifications: {
    no_of_seats: string; // "3 Seater"
    no_of_loungers: string; // "1 Nos."
    no_of_consoles: string; // "3.00 Nos."
  };
  production_notes?: string;
}

export function generateTechnicalSpecifications(
  orderItem: any,
  configuration: any,
  jobCardData?: any
): TechnicalSpecifications {
  const category = (orderItem.product_category || "sofa").toLowerCase();
  const model = orderItem.product_title || configuration.model || "Custom Model";
  const productType = configuration.sofaType || configuration.productType || "Standard";

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

  // Extract console information (NO pricing)
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
  } : undefined;

  // Extract lounger information (NO pricing)
  const loungers = configuration.lounger?.required ? {
    count: configuration.lounger?.numberOfLoungers || configuration.lounger?.quantity || 1,
    size: configuration.lounger?.size || "",
    positioning: configuration.lounger?.placement || configuration.lounger?.position || "",
    with_storage: configuration.lounger?.storage === "Yes" || configuration.lounger?.storage === true,
  } : undefined;

  // Extract recliner information (NO pricing)
  const recliner = configuration.recliner?.required ? {
    required: true,
    positioning: configuration.recliner?.position || "",
  } : undefined;

  // Extract seat dimensions
  const seatDepth = configuration.dimensions?.seatDepth || 22;
  const seatWidth = configuration.dimensions?.seatWidth || 22;
  const seatHeight = configuration.dimensions?.seatHeight || 18;

  const seat_dimensions = {
    depth: `${seatDepth} in`,
    width: `${seatWidth} in`,
    height: `${seatHeight} in`,
  };

  // Calculate sofa dimensions
  const approximateWidth = calculateApproximateWidth(configuration, seatWidth);
  const sofa_dimensions = category === "sofa" ? {
    front_sofa_width: `${approximateWidth} in`,
    left_sofa_width: sections.L1 || sections.L2 ? "3 in" : "0 in",
    right_sofa_width: sections.R1 || sections.R2 ? "3 in" : "0 in",
  } : undefined;

  const sofabed_dimensions = category === "sofabed" ? {
    sofabed_width: `${approximateWidth} in`,
  } : undefined;

  // Extract armrest information
  const armrest = {
    type: configuration.armrest?.type || "Default",
    width: configuration.armrest?.width ? `${configuration.armrest.width} in each` : undefined,
  };

  // Extract fabric information
  const fabricPlan = configuration.fabric?.claddingPlan || "Single Colour";
  const colourBreakup: any = {};
  
  if (configuration.fabric?.structureCode) {
    colourBreakup.structure = configuration.fabric.structureCode;
  }
  if (configuration.fabric?.backrestCode) {
    colourBreakup.back_rest_cushion = configuration.fabric.backrestCode;
  }
  if (configuration.fabric?.seatCode) {
    colourBreakup.seat = configuration.fabric.seatCode;
  }
  if (configuration.fabric?.headrestCode) {
    colourBreakup.headrest = configuration.fabric.headrestCode;
  }

  const pillowColours: Array<{ label: string; code: string }> = [];
  if (configuration.additionalPillows?.fabricColour || configuration.additionalPillows?.fabricColour1) {
    pillowColours.push({
      label: "Single Color/Colour 1",
      code: configuration.additionalPillows?.fabricColour || configuration.additionalPillows?.fabricColour1 || "",
    });
  }
  if (configuration.additionalPillows?.fabricColour2) {
    pillowColours.push({
      label: "Dual Color/Colour 2",
      code: configuration.additionalPillows.fabricColour2,
    });
  }

  const fabric_description = {
    colour_details: fabricPlan,
    colour_breakup: colourBreakup,
    pillow_colours: pillowColours.length > 0 ? pillowColours : undefined,
  };

  // Extract legs information
  const legs = {
    leg_model: configuration.legs?.type || "Standard",
  };

  // Extract accessories (NO pricing)
  const accessories = consolePlacements
    .filter((p: any) => p?.accessoryId && p.accessoryId !== "none")
    .map((p: any, index: number) => ({
      location: index === 0 ? "Left Arm Rest" : index === 1 ? "Right Arm Rest" : `Front Console ${index - 1}`,
      description: p.accessoryDescription || "Accessory",
    }));

  // Generate fabric requirements table
  const fabricRequiredM = generateFabricRequirementsTable(
    configuration,
    jobCardData?.fabricPlan,
    approximateWidth
  );

  // Extract overall specifications
  const frontSeats = noOfSeats.front || "";
  const seatMatch = frontSeats.match(/(\d+)/);
  const seatCount = seatMatch ? seatMatch[1] : "0";

  const overall_specifications = {
    no_of_seats: `${seatCount} Seater`,
    no_of_loungers: loungers ? `${loungers.count} Nos.` : "0 Nos.",
    no_of_consoles: consoles ? `${consoles.count.toFixed(2)} Nos.` : "0.00 Nos.",
  };

  return {
    product_type: category,
    model,
    sofa_type: category === "sofa" ? productType : undefined,
    no_of_seats,
    consoles,
    loungers,
    recliner,
    frame: {
      wood_type: configuration.wood?.type || "Pine (Default)",
    },
    seat_dimensions,
    sofa_dimensions,
    sofabed_dimensions,
    armrest,
    cutting_stitching: {
      stitching_type: configuration.stitch?.type || "Standard Stitch",
    },
    fabric_description,
    legs,
    accessories,
    wireframe: configuration.wireframeImage ? {
      image_url: configuration.wireframeImage,
      description: "Wireframe reference",
    } : undefined,
    fabric_required_m: fabricRequiredM,
    foam: {
      type: configuration.foam?.type || "Firm",
    },
    overall_specifications,
    production_notes: configuration.productionNotes || undefined,
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

function generateFabricRequirementsTable(
  configuration: any,
  fabricPlan?: any,
  approximateWidth?: number
): { components: Array<{ name: string; width?: string; fabric_meters: number }>; total: number } {
  const components: Array<{ name: string; width?: string; fabric_meters: number }> = [];
  let total = 0;

  // Add seat fabric requirement
  const frontSeats = configuration.sections?.F?.seater || "";
  if (frontSeats) {
    const seatWidth = approximateWidth || 72;
    const seatMeters = fabricPlan?.baseMeters || 0;
    components.push({
      name: "No. of seats",
      width: seatWidth.toString(),
      fabric_meters: seatMeters,
    });
    total += seatMeters;
  }

  // Add console fabric requirement
  const consoleCount = configuration.console?.placements?.length || 0;
  if (consoleCount > 0) {
    const consoleSize = configuration.console?.size || "Console-10 In";
    const consoleWidth = consoleSize.includes("10") ? "7.5" : "6";
    const consoleMeters = (fabricPlan?.consoleMeters || 0) * consoleCount;
    components.push({
      name: "Console size",
      width: consoleWidth,
      fabric_meters: consoleMeters,
    });
    total += consoleMeters;
  }

  // Add lounger fabric requirement
  if (configuration.lounger?.required) {
    const loungerSize = configuration.lounger?.size || "";
    const loungerWidth = loungerSize.includes("7") ? "24" : "20";
    const loungerMeters = fabricPlan?.loungerMeters || 6.5;
    components.push({
      name: "Lounger Size",
      width: loungerWidth,
      fabric_meters: loungerMeters,
    });
    total += loungerMeters;
  }

  // Add recliner fabric requirement
  if (configuration.recliner?.required) {
    const reclinerMeters = fabricPlan?.reclinerMeters || 4.0;
    components.push({
      name: "Recliner",
      width: "24",
      fabric_meters: reclinerMeters,
    });
    total += reclinerMeters;
  }

  // Add seat width fabric requirement
  const seatWidth = configuration.dimensions?.seatWidth || 24;
  components.push({
    name: "Seat Width",
    width: seatWidth.toString(),
    fabric_meters: 0, // This would be calculated based on actual requirements
  });

  // Add structure fabric requirement
  const structureMeters = fabricPlan?.structureMeters || 35.0;
  components.push({
    name: "Structure",
    width: "",
    fabric_meters: structureMeters,
  });
  total += structureMeters;

  // Add pillow colours fabric requirements
  if (configuration.additionalPillows?.required) {
    components.push({
      name: "Pillow Colours - Single Color/Colour 1",
      width: "",
      fabric_meters: 0,
    });
    if (configuration.additionalPillows?.fabricColour2) {
      components.push({
        name: "Pillow Colours - Dual Color/Colour 2",
        width: "",
        fabric_meters: 0,
      });
    }
  }

  // Add total
  components.push({
    name: "Total Fabric Req",
    width: "",
    fabric_meters: total,
  });

  return { components, total };
}

