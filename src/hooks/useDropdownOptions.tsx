import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DropdownOption {
  id: string;
  category: string;
  field_name: string;
  option_value: string;
  display_label: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: any;
}

export const useDropdownOptions = (category: string, fieldName?: string) => {
  return useQuery({
    queryKey: ["dropdown-options", category, fieldName],
    queryFn: async () => {
      try {
      let query = supabase
        .from("dropdown_options")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fieldName) {
        query = query.eq("field_name", fieldName);
      }

      const { data, error } = await query;
        
        if (error) {
          console.error(`Error loading dropdown options for ${category}.${fieldName || 'all'}:`, error);
          return [];
        }
        
        return (data || []) as DropdownOption[];
      } catch (error) {
        console.error(`Exception loading dropdown options for ${category}.${fieldName || 'all'}:`, error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    // Return empty array if query fails, don't block the page
    placeholderData: [],
    enabled: !!category, // Only run if category is provided
  });
};

export const useDropdownOptionsByField = (category: string) => {
  const { data, ...rest } = useDropdownOptions(category);

  const groupedOptions = data?.reduce((acc, option) => {
    if (!acc[option.field_name]) {
      acc[option.field_name] = [];
    }
    acc[option.field_name].push(option);
    return acc;
  }, {} as Record<string, DropdownOption[]>);

  return {
    data: groupedOptions,
    ...rest,
  };
};
