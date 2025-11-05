import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PricingFormula {
  id: string;
  category: string;
  formula_name: string;
  calculation_type: string;
  value: number;
  unit: string;
  description: string | null;
  applies_to: any;
  is_active: boolean;
}

export const usePricingFormulas = (category: string) => {
  return useQuery({
    queryKey: ["pricing-formulas", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_formulas")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("formula_name", { ascending: true });

      if (error) throw error;
      return data as PricingFormula[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const usePricingFormulasByType = (category: string, calculationType?: string) => {
  return useQuery({
    queryKey: ["pricing-formulas", category, calculationType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_formulas")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .then(result => {
          if (calculationType && result.data) {
            const filtered = result.data.filter((item: any) => item.calculation_type === calculationType);
            return { data: filtered, error: result.error };
          }
          return result;
        });

      if (error) throw error;
      return data as PricingFormula[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const getFormulaValue = (
  formulas: PricingFormula[] | undefined,
  formulaName: string,
  defaultValue: number = 0
): number => {
  const formula = formulas?.find((f) => f.formula_name === formulaName);
  return formula?.value ?? defaultValue;
};
