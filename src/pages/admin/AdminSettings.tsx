/**
 * AdminSettings Page
 * 
 * Admin interface for managing system settings.
 * Features:
 * - Manage tax rates (CGST, SGST, IGST percentages)
 * - Delivery terms (default days, dispatch methods)
 * - Discount code defaults
 * - Company profile (address, phones, invoice info)
 * 
 * Route: /admin/settings
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoRefreshSettings } from "@/components/ui/AutoRefreshSettings";

interface SystemSettings {
  // Tax rates
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  
  // Delivery terms
  default_delivery_days: number;
  dispatch_methods: string[];
  
  // Company profile
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_gst: string;
  
  // Discount defaults
  default_discount_percent: number;
}

const AdminSettings = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<SystemSettings>({
    cgst_percent: 9,
    sgst_percent: 9,
    igst_percent: 18,
    default_delivery_days: 30,
    dispatch_methods: ["Safe Express", "Self Pickup", "Other"],
    company_name: "ESTRE GLOBAL PRIVATE LTD",
    company_address: "Near Dhoni Public School, AECS Layout-A Block, Revenue Layout, Near Kudlu Gate, Singhasandra, Bengaluru - 560 068",
    company_phone: "+91 87 22 200 100",
    company_email: "support@estre.in",
    company_gst: "",
    default_discount_percent: 10,
  });

  // Fetch settings from database
  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["tax_rate", "delivery_terms", "company_profile", "discount_defaults"]);

      if (error) throw error;

      // Transform database format to component format
      const taxRate = data.find((s) => s.setting_key === "tax_rate")?.setting_value || { 
        cgst_percent: 9, 
        sgst_percent: 9, 
        igst_percent: 18 
      };
      const deliveryTerms = data.find((s) => s.setting_key === "delivery_terms")?.setting_value || { 
        default_delivery_days: 30, 
        dispatch_methods: ["Safe Express", "Self Pickup", "Other"] 
      };
      const companyProfile = data.find((s) => s.setting_key === "company_profile")?.setting_value || {
        company_name: "ESTRE GLOBAL PRIVATE LTD",
        company_address: "Near Dhoni Public School, AECS Layout-A Block, Revenue Layout, Near Kudlu Gate, Singhasandra, Bengaluru - 560 068",
        company_phone: "+91 87 22 200 100",
        company_email: "support@estre.in",
        company_gst: "",
      };
      const discountDefaults = data.find((s) => s.setting_key === "discount_defaults")?.setting_value || {
        default_discount_percent: 10,
      };

      return {
        cgst_percent: taxRate.cgst_percent || 9,
        sgst_percent: taxRate.sgst_percent || 9,
        igst_percent: taxRate.igst_percent || 18,
        default_delivery_days: deliveryTerms.default_delivery_days || 30,
        dispatch_methods: deliveryTerms.dispatch_methods || ["Safe Express", "Self Pickup", "Other"],
        company_name: companyProfile.company_name || "",
        company_address: companyProfile.company_address || "",
        company_phone: companyProfile.company_phone || "",
        company_email: companyProfile.company_email || "",
        company_gst: companyProfile.company_gst || "",
        default_discount_percent: discountDefaults.default_discount_percent || 10,
      } as SystemSettings;
    },
    enabled: isAdmin(),
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      // Save to database
      const settingsToSave = [
        {
          setting_key: "tax_rate",
          setting_value: {
            cgst_percent: newSettings.cgst_percent,
            sgst_percent: newSettings.sgst_percent,
            igst_percent: newSettings.igst_percent,
          },
          category: "tax",
        },
        {
          setting_key: "delivery_terms",
          setting_value: {
            default_delivery_days: newSettings.default_delivery_days,
            dispatch_methods: newSettings.dispatch_methods,
          },
          category: "delivery",
        },
        {
          setting_key: "company_profile",
          setting_value: {
            company_name: newSettings.company_name,
            company_address: newSettings.company_address,
            company_phone: newSettings.company_phone,
            company_email: newSettings.company_email,
            company_gst: newSettings.company_gst,
          },
          category: "company",
        },
        {
          setting_key: "discount_defaults",
          setting_value: {
            default_discount_percent: newSettings.default_discount_percent,
          },
          category: "discount",
        },
      ];

      // Upsert each setting
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(setting, { onConflict: "setting_key" });

        if (error) throw error;
      }

      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Settings Saved",
        description: "System settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error saving settings:", error);
      toast({
        title: "Error Saving Settings",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">
              Manage system-wide configuration and settings
            </p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>

        <Tabs defaultValue="tax" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tax">Tax Rates</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Terms</TabsTrigger>
            <TabsTrigger value="company">Company Profile</TabsTrigger>
            <TabsTrigger value="discounts">Discount Defaults</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Tax Rates */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Rates</CardTitle>
                <CardDescription>
                  Configure GST tax rates for invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>CGST Percentage (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.cgst_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          cgst_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SGST Percentage (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.sgst_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sgst_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IGST Percentage (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.igst_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          igst_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Terms */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Terms</CardTitle>
                <CardDescription>
                  Configure default delivery settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Delivery Days</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.default_delivery_days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        default_delivery_days: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Default number of days for order delivery
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Available Dispatch Methods</Label>
                  <Textarea
                    value={settings.dispatch_methods.join(", ")}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dispatch_methods: e.target.value
                          .split(",")
                          .map((m) => m.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Safe Express, Self Pickup, Other"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of dispatch methods
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Profile */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Company information for invoices and communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={settings.company_name}
                    onChange={(e) =>
                      setSettings({ ...settings, company_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Address</Label>
                  <Textarea
                    value={settings.company_address}
                    onChange={(e) =>
                      setSettings({ ...settings, company_address: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={settings.company_phone}
                      onChange={(e) =>
                        setSettings({ ...settings, company_phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={settings.company_email}
                      onChange={(e) =>
                        setSettings({ ...settings, company_email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input
                    value={settings.company_gst}
                    onChange={(e) =>
                      setSettings({ ...settings, company_gst: e.target.value })
                    }
                    placeholder="GSTIN"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discount Defaults */}
          <TabsContent value="discounts">
            <Card>
              <CardHeader>
                <CardTitle>Discount Defaults</CardTitle>
                <CardDescription>
                  Default discount settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Discount Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={settings.default_discount_percent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        default_discount_percent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Default discount percentage for new orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <AutoRefreshSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;

