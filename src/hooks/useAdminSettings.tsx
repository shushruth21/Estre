import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminSetting {
  id: string;
  category: string | null;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

const SETTINGS_TABLE_MAP: Record<string, string> = {
  sofa: "sofa_admin_settings",
  recliner: "recliner_admin_settings",
  bed: "bed_admin_settings",
  kids_bed: "kids_bed_admin_settings",
  arm_chairs: "arm_chairs_admin_settings",
  dining_chairs: "dining_chairs_admin_settings",
  benches: "benches_admin_settings",
  cinema_chairs: "cinema_chairs_admin_settings",
};

export const useAdminSettings = (category: string, settingKey?: string) => {
  const tableName = SETTINGS_TABLE_MAP[category];

  return useQuery({
    queryKey: ["admin-settings", category, settingKey],
    queryFn: async () => {
      if (!tableName) {
        throw new Error(`No settings table found for category: ${category}`);
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .then(result => {
          if (settingKey && result.data) {
            const filtered = result.data.find((item: any) => item.setting_key === settingKey);
            return { data: filtered, error: result.error };
          }
          return result;
        });

      if (error) throw error;
      return data as unknown as AdminSetting | AdminSetting[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!tableName,
    retry: 1,
    // Don't block page if settings are missing
    placeholderData: [] as AdminSetting[],
  });
};

export const useAdminSettingsByCategory = (category: string, categoryFilter?: string) => {
  const tableName = SETTINGS_TABLE_MAP[category];

  return useQuery({
    queryKey: ["admin-settings", category, "by-category", categoryFilter],
    queryFn: async () => {
      if (!tableName) {
        throw new Error(`No settings table found for category: ${category}`);
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .then(result => {
          if (categoryFilter && result.data) {
            const filtered = result.data.filter((item: any) => item.category === categoryFilter);
            return { data: filtered, error: result.error };
          }
          return result;
        });

      if (error) throw error;
      return data as unknown as AdminSetting[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tableName,
  });
};

export const getSettingValue = (
  settings: AdminSetting | AdminSetting[] | undefined,
  key: string,
  defaultValue: any = null
): any => {
  if (!settings) return defaultValue;

  if (Array.isArray(settings)) {
    const setting = settings.find((s) => s.setting_key === key);
    return setting?.setting_value ?? defaultValue;
  }

  return settings.setting_key === key ? settings.setting_value : defaultValue;
};
