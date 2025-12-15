/**
 * Console Placement Validation Utility
 * 
 * Implements the exact console formula validation logic from the spreadsheet:
 * - Console 1: Available if seatCount >= 2 (After 1st Seat from Left)
 * - Console 2: Available if seatCount >= 3 (After 2nd Seat from Left)
 * - Console 3: Available if seatCount >= 4 (After 3rd Seat from Left)
 * - Console 4: Available if seatCount >= 5 (After 4th Seat from Left)
 * 
 * Formula Pattern: IF(consoleRequired="Yes", IF(seaterType<>"1-Seater", ..., "none"), "none")
 */

/**
 * Get console position label for a specific console number
 * @param consoleNumber - Console number (1, 2, 3, or 4)
 * @param section - Section code ("F", "L", "R", "C")
 * @returns Position label or "none"
 */
export const getConsolePositionLabel = (
  consoleNumber: number,
  section: string
): string => {
  const sectionLabels: Record<string, string> = {
    F: "Front",
    L: "Left",
    R: "Right",
    C: "Combo",
    front: "Front",
    left: "Left",
    right: "Right",
    combo: "Combo",
  };

  const sectionLabel = sectionLabels[section] || section;
  const ordinal =
    consoleNumber === 1 ? "st" :
      consoleNumber === 2 ? "nd" :
        consoleNumber === 3 ? "rd" : "th";

  return `${sectionLabel}: After ${consoleNumber}${ordinal} Seat from Left`;
};

/**
 * Get console position value for a specific console number
 * @param consoleNumber - Console number (1, 2, 3, or 4)
 * @param section - Section code ("F", "L", "R", "C" or "front", "left", "right", "combo")
 * @returns Position value string (e.g., "front_1", "left_2")
 */
export const getConsolePositionValue = (
  consoleNumber: number,
  section: string
): string => {
  // Normalize section code to lowercase
  const normalizedSection = section.toLowerCase();
  const sectionMap: Record<string, string> = {
    f: "front",
    l: "left",
    r: "right",
    c: "combo",
    front: "front",
    left: "left",
    right: "right",
    combo: "combo",
  };

  const sectionKey = sectionMap[normalizedSection] || normalizedSection;
  return `${sectionKey}_${consoleNumber}`;
};

/**
 * Validate if a console position is available based on seater type and console number
 * Matches the exact spreadsheet formula logic
 * 
 * @param consoleRequired - Whether console is required (Yes/No or boolean)
 * @param seaterType - Seater type string (e.g., "1-Seater", "2-Seater", "4-Seater", "Corner", "Backrest")
 * @param consoleNumber - Console number (1, 2, 3, or 4)
 * @returns true if console position is available, false otherwise
 */
export const isConsolePositionAvailable = (
  consoleRequired: boolean | string,
  seaterType: string,
  consoleNumber: number
): boolean => {
  // If console not required, return false
  if (!consoleRequired || consoleRequired === "No") {
    return false;
  }
  if (typeof consoleRequired === 'boolean' && !consoleRequired) {
    return false;
  }

  // If no seater type or "none", return false
  if (!seaterType || seaterType === "none") {
    return false;
  }

  // If Corner or Backrest, return false (no consoles for corners/backrests)
  if (seaterType.includes("Corner") || seaterType.toLowerCase().includes("backrest")) {
    return false;
  }

  // Extract seat count from seater type (handles "2-Seater", "3 Seats", "4", etc.)
  const seatCountMatch = seaterType.toString().match(/(\d+)/);
  if (!seatCountMatch) {
    return false;
  }

  const seatCount = parseInt(seatCountMatch[1], 10);

  // Console position validation logic (matches spreadsheet formulas):
  // Console 1: Available if seatCount >= 2 (After 1st Seat)
  // Console 2: Available if seatCount >= 3 (After 2nd Seat)
  // Console 3: Available if seatCount >= 4 (After 3rd Seat)
  // Console 4: Available if seatCount >= 5 (After 4th Seat) - but max is 4-seater, so this is always false

  if (consoleNumber === 1) {
    return seatCount >= 2; // C27 formula: After 1st Seat (if seatCount >= 2)
  }

  if (consoleNumber === 2) {
    return seatCount >= 3; // C28 formula: After 2nd Seat (if seatCount >= 3)
  }

  if (consoleNumber === 3) {
    return seatCount >= 4; // C29 formula: After 3rd Seat (if seatCount >= 4)
  }

  if (consoleNumber === 4) {
    return seatCount >= 5; // C30 formula: After 4th Seat (if seatCount >= 5) - always false for current seater types
  }

  return false;
};

/**
 * Generate all available console placements for a section
 * Returns array of placement objects matching the spreadsheet formula validation
 * 
 * @param consoleRequired - Whether console is required (Yes/No or boolean)
 * @param seaterType - Seater type string (e.g., "2-Seater", "4-Seater")
 * @param section - Section code ("F", "L", "R", "C" or "front", "left", "right", "combo")
 * @returns Array of available console placement objects
 */
export const generateConsolePlacements = (
  consoleRequired: boolean | string,
  seaterType: string,
  section: string
): Array<{ section: string; position: string; label: string; value: string; consoleNumber: number }> => {
  const placements: Array<{ section: string; position: string; label: string; value: string; consoleNumber: number }> = [];

  // Normalize section code
  const normalizedSection = section.toLowerCase();
  const sectionMap: Record<string, string> = {
    f: "front",
    l: "left",
    r: "right",
    c: "combo",
    front: "front",
    left: "left",
    right: "right",
    combo: "combo",
  };
  const sectionKey = sectionMap[normalizedSection] || normalizedSection;

  // Check each console position (1-4) based on spreadsheet formulas
  for (let consoleNumber = 1; consoleNumber <= 4; consoleNumber++) {
    if (isConsolePositionAvailable(consoleRequired, seaterType, consoleNumber)) {
      const position = `after_${consoleNumber}`;
      const label = getConsolePositionLabel(consoleNumber, sectionKey);
      const value = getConsolePositionValue(consoleNumber, sectionKey);

      placements.push({
        section: sectionKey,
        position: position,
        label: label,
        value: value,
        consoleNumber: consoleNumber,
      });
    }
  }

  return placements;
};

/**
 * Generate all console placements for multiple sections
 * Used for shapes with multiple sections (L SHAPE, U SHAPE, COMBO)
 * 
 * @param consoleRequired - Whether console is required
 * @param sections - Object with section seater types { front, left, right, combo }
 * @param shape - Shape type ("STANDARD", "L SHAPE", "U SHAPE", "COMBO")
 * @returns Array of all available console placements across all sections
 */
export const generateAllConsolePlacements = (
  consoleRequired: boolean | string,
  sections: {
    front?: string;
    left?: string;
    right?: string;
    combo?: string;
  },
  shape: string = "STANDARD"
): Array<{ section: string; position: string; label: string; value: string; consoleNumber: number }> => {
  const allPlacements: Array<{ section: string; position: string; label: string; value: string; consoleNumber: number }> = [];

  // Normalize shape (handle "L-SHAPE", "L_SHAPE", "L SHAPE", etc.)
  const normalizedShape = shape.toUpperCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");

  // Front section (always available)
  if (sections.front) {
    const frontPlacements = generateConsolePlacements(consoleRequired, sections.front, "F");
    allPlacements.push(...frontPlacements);
  }

  // Left section (L SHAPE, U SHAPE, COMBO)
  if (normalizedShape.includes("L SHAPE") || normalizedShape.includes("U SHAPE") || normalizedShape.includes("COMBO")) {
    if (sections.left) {
      const leftPlacements = generateConsolePlacements(consoleRequired, sections.left, "L");
      allPlacements.push(...leftPlacements);
    }
  }

  // Right section (U SHAPE, COMBO)
  if (normalizedShape.includes("U SHAPE") || normalizedShape.includes("COMBO")) {
    if (sections.right) {
      const rightPlacements = generateConsolePlacements(consoleRequired, sections.right, "R");
      allPlacements.push(...rightPlacements);
    }
  }

  // Combo/Center section (COMBO only)
  if (normalizedShape.includes("COMBO")) {
    if (sections.combo) {
      const comboPlacements = generateConsolePlacements(consoleRequired, sections.combo, "C");
      allPlacements.push(...comboPlacements);
    }
  }

  return allPlacements;
};

/**
 * Get seat count from seater type string
 * @param seaterType - Seater type string (e.g., "2-Seater", "4-Seater", "Corner", "Backrest")
 * @returns Seat count number (0 for Corner/Backrest)
 */
export const getSeatCountFromSeaterType = (seaterType: string): number => {
  if (!seaterType || seaterType === "none") {
    return 0;
  }

  // Corner and Backrest have 0 seats
  if (seaterType.includes("Corner") || seaterType.toLowerCase().includes("backrest")) {
    return 0;
  }

  // Extract seat count from seater type
  // Extract seat count from seater type (handles "2-Seater", "3 Seats", "4", etc.)
  const match = seaterType.toString().match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Calculate maximum number of consoles for a given seat count
 * Formula: maxConsoles = max(0, seatCount - 1)
 * 
 * @param seatCount - Number of seats
 * @returns Maximum number of consoles
 */
export const calculateMaxConsoles = (seatCount: number): number => {
  return Math.max(0, seatCount - 1);
};

