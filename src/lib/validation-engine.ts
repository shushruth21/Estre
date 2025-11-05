import { z } from "zod";

interface ValidationRule {
  field: string;
  type: "required" | "min" | "max" | "enum" | "custom";
  value?: any;
  message?: string;
}

/**
 * Create dynamic Zod schema from validation rules
 */
export const createDynamicSchema = (rules: ValidationRule[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  rules.forEach((rule) => {
    let fieldSchema: z.ZodTypeAny;

    switch (rule.type) {
      case "required":
        fieldSchema = z.string().min(1, { message: rule.message || `${rule.field} is required` });
        break;

      case "min":
        fieldSchema = z.number().min(rule.value, { message: rule.message });
        break;

      case "max":
        fieldSchema = z.number().max(rule.value, { message: rule.message });
        break;

      case "enum":
        fieldSchema = z.enum(rule.value, { message: rule.message });
        break;

      case "custom":
        fieldSchema = z.any();
        break;

      default:
        fieldSchema = z.any();
    }

    schemaObject[rule.field] = fieldSchema;
  });

  return z.object(schemaObject);
};

/**
 * Validate configuration against business rules
 */
export const validateConfiguration = (
  category: string,
  configuration: any,
  rules?: ValidationRule[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Category-specific validation
  switch (category) {
    case "sofa":
      if (!configuration.seatCount || configuration.seatCount < 1) {
        errors.push("Seat count must be at least 1");
      }
      if (!configuration.claddingPlan) {
        errors.push("Cladding plan is required");
      }
      break;

    case "recliner":
    case "cinema_chairs":
      if (!configuration.numberOfSeats || configuration.numberOfSeats < 1) {
        errors.push("Number of seats must be at least 1");
      }
      if (!configuration.mechanism) {
        errors.push("Mechanism type is required");
      }
      break;

    case "bed":
    case "kids_bed":
      if (!configuration.bedSize) {
        errors.push("Bed size is required");
      }
      break;

    case "arm_chairs":
    case "dining_chairs":
      if (!configuration.quantity || configuration.quantity < 1) {
        errors.push("Quantity must be at least 1");
      }
      break;

    case "benches":
      if (!configuration.seatingCapacity || configuration.seatingCapacity < 1) {
        errors.push("Seating capacity must be at least 1");
      }
      break;
  }

  // Custom rules validation
  if (rules && rules.length > 0) {
    try {
      const schema = createDynamicSchema(rules);
      schema.parse(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push(err.message);
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if configuration meets minimum requirements
 */
export const hasMinimumConfiguration = (category: string, configuration: any): boolean => {
  const requiredFields: Record<string, string[]> = {
    sofa: ["seatCount", "claddingPlan"],
    recliner: ["numberOfSeats", "mechanism"],
    cinema_chairs: ["numberOfSeats", "mechanism"],
    bed: ["bedSize"],
    kids_bed: ["bedSize"],
    arm_chairs: ["quantity"],
    dining_chairs: ["quantity"],
    benches: ["seatingCapacity"],
  };

  const required = requiredFields[category] || [];
  return required.every((field) => configuration[field] !== undefined && configuration[field] !== null);
};
