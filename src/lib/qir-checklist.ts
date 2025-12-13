/**
 * Quality Inspection Report (QIR) Checklist System
 *
 * Comprehensive quality control checklists for different product categories
 * Supports defect tracking, scoring, and automated pass/fail determination
 */

export type CheckStatus = 'pass' | 'fail' | 'na' | 'pending';
export type DefectSeverity = 'critical' | 'major' | 'minor';

export interface QualityCheckItem {
  id: string;
  name: string;
  description?: string;
  status: CheckStatus;
  notes?: string;
  photos?: string[];
  required: boolean; // If true, must pass for overall pass
}

export interface QualityCheckCategory {
  id: string;
  name: string;
  items: QualityCheckItem[];
}

export interface Defect {
  id: string;
  category: string;
  severity: DefectSeverity;
  description: string;
  location?: string;
  photoUrl?: string;
  assignedTo?: string;
  resolvedAt?: string;
}

export interface QIRChecklist {
  categories: QualityCheckCategory[];
  defects: Defect[];
}

/**
 * Standard quality check categories applicable to all products
 */
export const STANDARD_QUALITY_CHECKS: QualityCheckCategory[] = [
  {
    id: 'frame',
    name: 'Frame & Structure',
    items: [
      {
        id: 'frame_integrity',
        name: 'Frame Integrity',
        description: 'Check for cracks, splits, or weak joints in wooden frame',
        status: 'pending',
        required: true
      },
      {
        id: 'frame_alignment',
        name: 'Frame Alignment',
        description: 'Verify all frame components are properly aligned',
        status: 'pending',
        required: true
      },
      {
        id: 'wood_quality',
        name: 'Wood Quality',
        description: 'Check for knots, warping, or inferior quality wood',
        status: 'pending',
        required: true
      },
      {
        id: 'joint_strength',
        name: 'Joint Strength',
        description: 'Test all joints for strength and stability',
        status: 'pending',
        required: true
      }
    ]
  },
  {
    id: 'upholstery',
    name: 'Upholstery & Fabric',
    items: [
      {
        id: 'fabric_quality',
        name: 'Fabric Quality',
        description: 'Check for tears, pulls, stains, or defects in fabric',
        status: 'pending',
        required: true
      },
      {
        id: 'stitching_quality',
        name: 'Stitching Quality',
        description: 'Verify stitch consistency, tension, and strength',
        status: 'pending',
        required: true
      },
      {
        id: 'fabric_alignment',
        name: 'Fabric Alignment',
        description: 'Check pattern matching and grain direction',
        status: 'pending',
        required: true
      },
      {
        id: 'seam_finish',
        name: 'Seam Finish',
        description: 'Inspect seam finishing and edging',
        status: 'pending',
        required: true
      },
      {
        id: 'cushion_fill',
        name: 'Cushion Fill Distribution',
        description: 'Check foam density and fill distribution',
        status: 'pending',
        required: true
      }
    ]
  },
  {
    id: 'dimensions',
    name: 'Dimensions & Measurements',
    items: [
      {
        id: 'seat_depth',
        name: 'Seat Depth',
        description: 'Verify seat depth matches specifications',
        status: 'pending',
        required: true
      },
      {
        id: 'seat_width',
        name: 'Seat Width',
        description: 'Verify seat width matches specifications',
        status: 'pending',
        required: true
      },
      {
        id: 'seat_height',
        name: 'Seat Height',
        description: 'Verify seat height from floor matches specifications',
        status: 'pending',
        required: true
      },
      {
        id: 'overall_dimensions',
        name: 'Overall Dimensions',
        description: 'Verify overall product dimensions',
        status: 'pending',
        required: true
      }
    ]
  },
  {
    id: 'finishing',
    name: 'Finishing & Aesthetics',
    items: [
      {
        id: 'surface_finish',
        name: 'Surface Finish',
        description: 'Check for smooth, even finish on all surfaces',
        status: 'pending',
        required: false
      },
      {
        id: 'color_consistency',
        name: 'Color Consistency',
        description: 'Verify color matching across all components',
        status: 'pending',
        required: true
      },
      {
        id: 'edge_finishing',
        name: 'Edge Finishing',
        description: 'Check edge finishing quality and neatness',
        status: 'pending',
        required: true
      },
      {
        id: 'overall_appearance',
        name: 'Overall Appearance',
        description: 'Overall aesthetic appeal and presentation',
        status: 'pending',
        required: false
      }
    ]
  },
  {
    id: 'functionality',
    name: 'Functionality Tests',
    items: [
      {
        id: 'stability_test',
        name: 'Stability Test',
        description: 'Product stands stable without wobbling',
        status: 'pending',
        required: true
      },
      {
        id: 'weight_test',
        name: 'Weight Bearing Test',
        description: 'Product can support expected weight load',
        status: 'pending',
        required: true
      },
      {
        id: 'comfort_test',
        name: 'Comfort Test',
        description: 'Seating comfort and ergonomics',
        status: 'pending',
        required: false
      }
    ]
  }
];

/**
 * Additional checks for Sofa/Sectional products
 */
export const SOFA_SPECIFIC_CHECKS: QualityCheckCategory[] = [
  {
    id: 'sectional_config',
    name: 'Sectional Configuration',
    items: [
      {
        id: 'section_alignment',
        name: 'Section Alignment',
        description: 'All sections align properly when assembled',
        status: 'pending',
        required: true
      },
      {
        id: 'connector_quality',
        name: 'Section Connectors',
        description: 'Connectors are secure and functional',
        status: 'pending',
        required: true
      },
      {
        id: 'height_consistency',
        name: 'Height Consistency',
        description: 'All sections are at same height',
        status: 'pending',
        required: true
      }
    ]
  },
  {
    id: 'console_checks',
    name: 'Console Quality (if applicable)',
    items: [
      {
        id: 'console_placement',
        name: 'Console Placement',
        description: 'Console is positioned as per specification',
        status: 'pending',
        required: true
      },
      {
        id: 'console_stability',
        name: 'Console Stability',
        description: 'Console is sturdy and level',
        status: 'pending',
        required: true
      },
      {
        id: 'storage_function',
        name: 'Storage Functionality',
        description: 'Storage compartments open/close smoothly',
        status: 'pending',
        required: false
      }
    ]
  },
  {
    id: 'lounger_checks',
    name: 'Lounger Quality (if applicable)',
    items: [
      {
        id: 'lounger_extension',
        name: 'Lounger Extension',
        description: 'Lounger extends and retracts smoothly',
        status: 'pending',
        required: true
      },
      {
        id: 'lounger_comfort',
        name: 'Lounger Comfort',
        description: 'Extended lounger is comfortable and supportive',
        status: 'pending',
        required: false
      }
    ]
  }
];

/**
 * Additional checks for Recliner products
 */
export const RECLINER_SPECIFIC_CHECKS: QualityCheckCategory[] = [
  {
    id: 'reclining_mechanism',
    name: 'Reclining Mechanism',
    items: [
      {
        id: 'recline_smooth',
        name: 'Smooth Reclining',
        description: 'Reclining motion is smooth without jerks',
        status: 'pending',
        required: true
      },
      {
        id: 'recline_positions',
        name: 'Locking Positions',
        description: 'All locking positions work properly',
        status: 'pending',
        required: true
      },
      {
        id: 'footrest_operation',
        name: 'Footrest Operation',
        description: 'Footrest extends and retracts properly',
        status: 'pending',
        required: true
      },
      {
        id: 'motor_function',
        name: 'Motor Function (Electric)',
        description: 'Electric motor operates quietly and smoothly',
        status: 'pending',
        required: false
      }
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical Components (if applicable)',
    items: [
      {
        id: 'power_connection',
        name: 'Power Connection',
        description: 'Power cord and connections are secure',
        status: 'pending',
        required: true
      },
      {
        id: 'control_panel',
        name: 'Control Panel',
        description: 'All buttons/controls function properly',
        status: 'pending',
        required: true
      },
      {
        id: 'usb_ports',
        name: 'USB Ports',
        description: 'USB charging ports work correctly',
        status: 'pending',
        required: false
      }
    ]
  }
];

/**
 * Additional checks for Bed products
 */
export const BED_SPECIFIC_CHECKS: QualityCheckCategory[] = [
  {
    id: 'storage',
    name: 'Storage System (if applicable)',
    items: [
      {
        id: 'hydraulic_lift',
        name: 'Hydraulic Lift',
        description: 'Hydraulic system operates smoothly',
        status: 'pending',
        required: true
      },
      {
        id: 'storage_space',
        name: 'Storage Space',
        description: 'Storage compartment is clean and spacious',
        status: 'pending',
        required: false
      },
      {
        id: 'drawer_operation',
        name: 'Drawer Operation',
        description: 'Drawers slide smoothly on tracks',
        status: 'pending',
        required: true
      }
    ]
  },
  {
    id: 'headboard',
    name: 'Headboard Quality',
    items: [
      {
        id: 'headboard_attachment',
        name: 'Headboard Attachment',
        description: 'Headboard is securely attached',
        status: 'pending',
        required: true
      },
      {
        id: 'headboard_padding',
        name: 'Headboard Padding',
        description: 'Padding is even and comfortable',
        status: 'pending',
        required: false
      }
    ]
  }
];

/**
 * Get complete checklist for a product category
 */
export function getChecklistForCategory(category: string): QualityCheckCategory[] {
  const normalizedCategory = category.toLowerCase().replace(/[_\s]/g, '');

  let checklist = [...STANDARD_QUALITY_CHECKS];

  switch (normalizedCategory) {
    case 'sofa':
    case 'sofabed':
      checklist = [...checklist, ...SOFA_SPECIFIC_CHECKS];
      break;

    case 'recliner':
    case 'cinemachair':
      checklist = [...checklist, ...RECLINER_SPECIFIC_CHECKS];
      break;

    case 'bed':
    case 'kidsbed':
      checklist = [...checklist, ...BED_SPECIFIC_CHECKS];
      break;
  }

  return checklist;
}

/**
 * Calculate QIR scores from checklist
 */
export function calculateQIRScores(categories: QualityCheckCategory[]): {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  naChecks: number;
  pendingChecks: number;
  requiredPassed: number;
  requiredTotal: number;
  overallScore: number;
  status: 'passed' | 'failed' | 'pending';
} {
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let naChecks = 0;
  let pendingChecks = 0;
  let requiredPassed = 0;
  let requiredTotal = 0;

  categories.forEach(category => {
    category.items.forEach(item => {
      totalChecks++;

      if (item.required) {
        requiredTotal++;
      }

      switch (item.status) {
        case 'pass':
          passedChecks++;
          if (item.required) requiredPassed++;
          break;
        case 'fail':
          failedChecks++;
          break;
        case 'na':
          naChecks++;
          break;
        case 'pending':
          pendingChecks++;
          break;
      }
    });
  });

  // Calculate score (excluding N/A items)
  const scorableChecks = totalChecks - naChecks;
  const overallScore = scorableChecks > 0
    ? (passedChecks / scorableChecks) * 100
    : 0;

  // Determine status
  let status: 'passed' | 'failed' | 'pending' = 'pending';

  if (pendingChecks === 0) {
    // All required checks must pass
    if (requiredPassed === requiredTotal && overallScore >= 70) {
      status = 'passed';
    } else {
      status = 'failed';
    }
  }

  return {
    totalChecks,
    passedChecks,
    failedChecks,
    naChecks,
    pendingChecks,
    requiredPassed,
    requiredTotal,
    overallScore,
    status
  };
}

/**
 * Defect categories for classification
 */
export const DEFECT_CATEGORIES = [
  'Frame Defect',
  'Fabric Defect',
  'Stitching Issue',
  'Dimension Mismatch',
  'Color Variation',
  'Functional Issue',
  'Aesthetic Issue',
  'Assembly Issue',
  'Electrical Issue',
  'Mechanical Issue',
  'Packaging Damage',
  'Other'
];

/**
 * Create a new defect entry
 */
export function createDefect(
  category: string,
  severity: DefectSeverity,
  description: string,
  location?: string
): Defect {
  return {
    id: `defect_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    category,
    severity,
    description,
    location
  };
}

/**
 * Determine if rework is required based on defects
 */
export function isReworkRequired(defects: Defect[]): {
  required: boolean;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
} {
  const criticalDefects = defects.filter(d => d.severity === 'critical');
  const majorDefects = defects.filter(d => d.severity === 'major');

  if (criticalDefects.length > 0) {
    return {
      required: true,
      reason: `${criticalDefects.length} critical defect(s) found`,
      priority: 'critical'
    };
  }

  if (majorDefects.length >= 3) {
    return {
      required: true,
      reason: `${majorDefects.length} major defects found`,
      priority: 'high'
    };
  }

  if (majorDefects.length > 0) {
    return {
      required: true,
      reason: `${majorDefects.length} major defect(s) to be addressed`,
      priority: 'medium'
    };
  }

  const minorDefects = defects.filter(d => d.severity === 'minor');
  if (minorDefects.length >= 5) {
    return {
      required: true,
      reason: `${minorDefects.length} minor defects found`,
      priority: 'low'
    };
  }

  return {
    required: false,
    reason: 'No significant defects found',
    priority: 'low'
  };
}

/**
 * Generate rework instructions based on defects
 */
export function generateReworkInstructions(defects: Defect[]): string {
  if (defects.length === 0) {
    return 'No rework required.';
  }

  const instructions: string[] = ['REWORK REQUIRED:\n'];

  // Group by category
  const groupedDefects = defects.reduce((acc, defect) => {
    if (!acc[defect.category]) {
      acc[defect.category] = [];
    }
    acc[defect.category].push(defect);
    return acc;
  }, {} as Record<string, Defect[]>);

  Object.entries(groupedDefects).forEach(([category, categoryDefects]) => {
    instructions.push(`\n${category}:`);
    categoryDefects.forEach((defect, index) => {
      const severityLabel = `[${defect.severity.toUpperCase()}]`;
      const location = defect.location ? ` at ${defect.location}` : '';
      instructions.push(`  ${index + 1}. ${severityLabel} ${defect.description}${location}`);
    });
  });

  return instructions.join('\n');
}

/**
 * Initialize a blank QIR checklist for a product
 */
export function initializeQIR(
  category: string,
  configuration: Record<string, any>
): QIRChecklist {
  let categories = getChecklistForCategory(category);

  // Filter out N/A categories based on configuration
  categories = categories.map(cat => {
    // Example: Remove console checks if console not selected
    if (cat.id === 'console_checks' && configuration.console !== 'yes') {
      return {
        ...cat,
        items: cat.items.map(item => ({ ...item, status: 'na' as CheckStatus }))
      };
    }

    // Example: Remove lounger checks if lounger not selected
    if (cat.id === 'lounger_checks' && configuration.lounger !== 'yes') {
      return {
        ...cat,
        items: cat.items.map(item => ({ ...item, status: 'na' as CheckStatus }))
      };
    }

    // Example: Remove electrical checks for manual recliners
    if (cat.id === 'electrical' && configuration.recliner_type !== 'electric') {
      return {
        ...cat,
        items: cat.items.map(item => ({ ...item, status: 'na' as CheckStatus }))
      };
    }

    return cat;
  });

  return {
    categories,
    defects: []
  };
}
