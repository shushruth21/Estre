/**
 * Fabric Meter Calculation Utilities
 *
 * Calculates fabric requirements based on product configuration
 * Handles different product categories with category-specific formulas
 */

export interface FabricCalculation {
  itemName: string;
  width: number;  // in meters
  length: number; // in meters
  quantity: number;
  totalMeters: number;
  wastePercentage: number;
  finalMeters: number;
  notes?: string;
}

export interface ProductFabricRequirements {
  category: string;
  fabricRequirements: Record<string, number>; // From database
  configuration: Record<string, any>;
}

/**
 * Standard fabric width used in calculations (in meters)
 */
const STANDARD_FABRIC_WIDTH = 1.4; // 54 inches = 1.4 meters

/**
 * Standard waste percentage for cutting and alignment
 */
const DEFAULT_WASTE_PERCENTAGE = 10;

/**
 * Calculate fabric meters for Sofa category
 */
export function calculateSofaFabric(
  fabricRequirements: Record<string, number>,
  configuration: Record<string, any>
): FabricCalculation[] {
  const calculations: FabricCalculation[] = [];

  const {
    front_seat_count = 0,
    left_seat_count = 0,
    right_seat_count = 0,
    corner_seat = 'no',
    lounger = 'no',
    lounger_size,
    console = 'no',
    console_count = 0,
    console_size,
    headrest_type = 'low'
  } = configuration;

  // Front seats
  if (front_seat_count > 0) {
    const firstSeatMeters = fabricRequirements.fabric_first_seat_mtrs || 0;
    const additionalSeatMeters = fabricRequirements.fabric_additional_seat_mtrs || 0;

    const totalMeters = firstSeatMeters + (additionalSeatMeters * (front_seat_count - 1));
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: 'Front Seats',
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: front_seat_count,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters
    });
  }

  // Left seats
  if (left_seat_count > 0) {
    const additionalSeatMeters = fabricRequirements.fabric_additional_seat_mtrs || 0;
    const totalMeters = additionalSeatMeters * left_seat_count;
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: 'Left Seats',
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: left_seat_count,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters
    });
  }

  // Right seats
  if (right_seat_count > 0) {
    const additionalSeatMeters = fabricRequirements.fabric_additional_seat_mtrs || 0;
    const totalMeters = additionalSeatMeters * right_seat_count;
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: 'Right Seats',
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: right_seat_count,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters
    });
  }

  // Corner seat
  if (corner_seat === 'yes') {
    const cornerMeters = fabricRequirements.fabric_corner_seat_mtrs || 0;
    const wasteMeters = cornerMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: 'Corner Seat',
      width: STANDARD_FABRIC_WIDTH,
      length: cornerMeters,
      quantity: 1,
      totalMeters: cornerMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: cornerMeters + wasteMeters
    });
  }

  // Headrests/Backrest
  if (headrest_type && headrest_type !== 'no') {
    const backrestMeters = fabricRequirements.fabric_backrest_mtrs || 0;
    const totalSeats = front_seat_count + left_seat_count + right_seat_count;
    const totalMeters = backrestMeters * totalSeats;
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: `Headrests (${headrest_type})`,
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: totalSeats,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters,
      notes: `Headrest type: ${headrest_type}`
    });
  }

  // Lounger
  if (lounger === 'yes' && lounger_size) {
    const loungerMeters = lounger_size === '6ft'
      ? fabricRequirements.fabric_lounger_6ft_mtrs || 0
      : fabricRequirements.fabric_lounger_additional_6_mtrs || 0;
    const wasteMeters = loungerMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: `Lounger (${lounger_size})`,
      width: STANDARD_FABRIC_WIDTH,
      length: loungerMeters,
      quantity: 1,
      totalMeters: loungerMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: loungerMeters + wasteMeters
    });
  }

  // Console
  if (console === 'yes' && console_count > 0 && console_size) {
    const consoleMeters = console_size === '6"'
      ? fabricRequirements.fabric_console_6_mtrs || 0
      : fabricRequirements.fabric_console_10_mtrs || 0;
    const totalMeters = consoleMeters * console_count;
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: `Console (${console_size})`,
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: console_count,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters
    });
  }

  return calculations;
}

/**
 * Calculate fabric meters for Bed category
 */
export function calculateBedFabric(
  fabricRequirements: Record<string, number>,
  configuration: Record<string, any>
): FabricCalculation[] {
  const calculations: FabricCalculation[] = [];

  const { bed_size = 'single' } = configuration;

  // Determine fabric requirement based on bed size
  const isLargeSize = ['queen', 'king'].includes(bed_size.toLowerCase());
  const fabricMeters = isLargeSize
    ? fabricRequirements.fabric_bed_queen_above_mtrs || 0
    : fabricRequirements.fabric_bed_up_to_double_xl_mtrs || 0;

  const wasteMeters = fabricMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

  calculations.push({
    itemName: `Bed Upholstery (${bed_size})`,
    width: STANDARD_FABRIC_WIDTH,
    length: fabricMeters,
    quantity: 1,
    totalMeters: fabricMeters,
    wastePercentage: DEFAULT_WASTE_PERCENTAGE,
    finalMeters: fabricMeters + wasteMeters
  });

  return calculations;
}

/**
 * Calculate fabric meters for Recliner category
 */
export function calculateReclinerFabric(
  fabricRequirements: Record<string, number>,
  configuration: Record<string, any>
): FabricCalculation[] {
  const calculations: FabricCalculation[] = [];

  const {
    seater_count = 1,
    corner_seat = 'no',
    console = 'no',
    console_count = 0,
    console_size
  } = configuration;

  // First recliner
  const firstReclinerMeters = fabricRequirements.fabric_first_recliner_mtrs || 0;
  const wasteMeters1 = firstReclinerMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

  calculations.push({
    itemName: 'First Recliner',
    width: STANDARD_FABRIC_WIDTH,
    length: firstReclinerMeters,
    quantity: 1,
    totalMeters: firstReclinerMeters,
    wastePercentage: DEFAULT_WASTE_PERCENTAGE,
    finalMeters: firstReclinerMeters + wasteMeters1
  });

  // Additional recliners
  if (seater_count > 1) {
    const additionalSeatMeters = fabricRequirements.fabric_additional_seat_mtrs || 0;
    const totalMeters = additionalSeatMeters * (seater_count - 1);
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: 'Additional Recliners',
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: seater_count - 1,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters
    });
  }

  // Corner seat
  if (corner_seat === 'yes') {
    const cornerMeters = fabricRequirements.fabric_corner_mtrs || 0;
    const wasteMeters = cornerMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: 'Corner Seat',
      width: STANDARD_FABRIC_WIDTH,
      length: cornerMeters,
      quantity: 1,
      totalMeters: cornerMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: cornerMeters + wasteMeters
    });
  }

  // Console
  if (console === 'yes' && console_count > 0 && console_size) {
    const consoleMeters = console_size === '6"'
      ? fabricRequirements.fabric_console_6_mtrs || 0
      : fabricRequirements.fabric_console_10_mtrs || 0;
    const totalMeters = consoleMeters * console_count;
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: `Console (${console_size})`,
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: console_count,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters
    });
  }

  return calculations;
}

/**
 * Calculate fabric meters for simple chair categories
 */
export function calculateChairFabric(
  fabricRequirements: Record<string, number>,
  configuration: Record<string, any>
): FabricCalculation[] {
  const calculations: FabricCalculation[] = [];

  const { quantity = 1 } = configuration;

  // First chair
  const firstChairMeters = fabricRequirements.fabric_single_chair_mtrs || 0;
  const wasteMeters1 = firstChairMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

  calculations.push({
    itemName: 'First Chair',
    width: STANDARD_FABRIC_WIDTH,
    length: firstChairMeters,
    quantity: 1,
    totalMeters: firstChairMeters,
    wastePercentage: DEFAULT_WASTE_PERCENTAGE,
    finalMeters: firstChairMeters + wasteMeters1
  });

  // Additional chairs
  if (quantity > 1) {
    const additionalChairMeters = fabricRequirements.fabric_additional_chair_mtrs || fabricRequirements.fabric_single_chair_mtrs || 0;
    const totalMeters = additionalChairMeters * (quantity - 1);
    const wasteMeters = totalMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

    calculations.push({
      itemName: 'Additional Chairs',
      width: STANDARD_FABRIC_WIDTH,
      length: totalMeters,
      quantity: quantity - 1,
      totalMeters,
      wastePercentage: DEFAULT_WASTE_PERCENTAGE,
      finalMeters: totalMeters + wasteMeters
    });
  }

  return calculations;
}

/**
 * Main function to calculate fabric requirements for any product
 */
export function calculateFabricRequirements(
  category: string,
  fabricRequirements: Record<string, number>,
  configuration: Record<string, any>
): FabricCalculation[] {
  const normalizedCategory = category.toLowerCase().replace(/[_\s]/g, '');

  switch (normalizedCategory) {
    case 'sofa':
    case 'sofabed':
      return calculateSofaFabric(fabricRequirements, configuration);

    case 'bed':
    case 'kidsbed':
      return calculateBedFabric(fabricRequirements, configuration);

    case 'recliner':
    case 'cinemachair':
      return calculateReclinerFabric(fabricRequirements, configuration);

    case 'armchair':
    case 'diningchair':
      return calculateChairFabric(fabricRequirements, configuration);

    case 'bench':
    case 'pouffe':
      // Simple single-piece calculation
      const fabricMeters = fabricRequirements.fabric_single_bench_mtrs
        || fabricRequirements.fabric_required_mtr
        || 0;
      const wasteMeters = fabricMeters * (DEFAULT_WASTE_PERCENTAGE / 100);

      return [{
        itemName: category,
        width: STANDARD_FABRIC_WIDTH,
        length: fabricMeters,
        quantity: 1,
        totalMeters: fabricMeters,
        wastePercentage: DEFAULT_WASTE_PERCENTAGE,
        finalMeters: fabricMeters + wasteMeters
      }];

    default:
      return [];
  }
}

/**
 * Get total fabric meters from calculations
 */
export function getTotalFabricMeters(calculations: FabricCalculation[]): number {
  return calculations.reduce((total, calc) => total + calc.finalMeters, 0);
}

/**
 * Format fabric calculations for display
 */
export function formatFabricCalculations(calculations: FabricCalculation[]): string {
  return calculations.map(calc =>
    `${calc.itemName}: ${calc.finalMeters.toFixed(2)}m (${calc.quantity}x ${calc.totalMeters.toFixed(2)}m + ${(calc.finalMeters - calc.totalMeters).toFixed(2)}m waste)`
  ).join('\n');
}

/**
 * Generate fabric calculation summary for Job Card
 */
export function generateFabricSummary(calculations: FabricCalculation[]): {
  totalMeters: number;
  items: Array<{ name: string; meters: number }>;
  breakdown: string;
} {
  const totalMeters = getTotalFabricMeters(calculations);
  const items = calculations.map(calc => ({
    name: calc.itemName,
    meters: calc.finalMeters
  }));
  const breakdown = formatFabricCalculations(calculations);

  return { totalMeters, items, breakdown };
}
