/**
 * Type definitions for Edge Functions
 * These types are shared between Edge Functions and cannot import from src/
 */

// Pricing Breakdown Types (for Sale Orders)
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

// Technical Specifications Types (for Job Cards - NO pricing)
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

