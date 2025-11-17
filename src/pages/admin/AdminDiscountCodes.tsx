/**
 * AdminDiscountCodes Page
 * 
 * Admin interface for managing discount codes.
 * Features:
 * - Full CRUD for discount codes
 * - Create, edit, delete, activate/deactivate codes
 * - Display code usage statistics
 * 
 * Route: /admin/discount-codes
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Edit, Plus, Tag, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface DiscountCode {
  code: string;
  label: string;
  percent: number;
  type: "percent" | "fixed";
  value: number;
  is_active: boolean;
  usage_count: number;
  max_usage?: number;
  expires_at?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const AdminDiscountCodes = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    label: "",
    percent: 0,
    type: "percent" as "percent" | "fixed",
    value: 0,
    is_active: true,
    max_usage: undefined as number | undefined,
    expires_at: undefined as string | undefined,
    description: "",
  });

  // Fetch all discount codes
  const { data: discountCodes, isLoading } = useQuery({
    queryKey: ["admin-discount-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as DiscountCode[];
    },
    enabled: isAdmin(),
  });

  // Create discount code mutation
  const createMutation = useMutation({
    mutationFn: async (codeData: Partial<DiscountCode>) => {
      const { data, error } = await supabase
        .from("discount_codes")
        .insert(codeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Discount Code Created",
        description: "The discount code has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Code",
        description: error.message || "Failed to create discount code",
        variant: "destructive",
      });
    },
  });

  // Update discount code mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      code,
      updates,
    }: {
      code: string;
      updates: Partial<DiscountCode>;
    }) => {
      const { data, error } = await supabase
        .from("discount_codes")
        .update(updates)
        .eq("code", code)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setEditingCode(null);
      resetForm();
      toast({
        title: "Discount Code Updated",
        description: "The discount code has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Code",
        description: error.message || "Failed to update discount code",
        variant: "destructive",
      });
    },
  });

  // Delete discount code mutation
  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("code", code);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast({
        title: "Discount Code Deleted",
        description: "The discount code has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Code",
        description: error.message || "Failed to delete discount code",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ code, isActive }: { code: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("discount_codes")
        .update({ is_active: isActive })
        .eq("code", code);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast({
        title: "Status Updated",
        description: "Discount code status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      label: "",
      percent: 0,
      type: "percent",
      value: 0,
      is_active: true,
      max_usage: undefined,
      expires_at: undefined,
      description: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      label: code.label,
      percent: code.percent,
      type: code.type,
      value: code.value,
      is_active: code.is_active,
      max_usage: code.max_usage,
      expires_at: code.expires_at
        ? new Date(code.expires_at).toISOString().split("T")[0]
        : undefined,
      description: code.description || "",
    });
  };

  const handleUpdate = () => {
    if (editingCode) {
      updateMutation.mutate({
        code: editingCode.code,
        updates: formData,
      });
    }
  };

  const handleDelete = (code: string) => {
    if (confirm(`Are you sure you want to delete discount code "${code}"?`)) {
      deleteMutation.mutate(code);
    }
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Discount Codes</h1>
            <p className="text-muted-foreground">
              Manage discount codes for customer orders
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Discount Code</DialogTitle>
                <DialogDescription>
                  Create a new discount code for customer orders
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="EVIP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Label *</Label>
                    <Input
                      value={formData.label}
                      onChange={(e) =>
                        setFormData({ ...formData, label: e.target.value })
                      }
                      placeholder="EVIP - 10% Discount"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "percent" | "fixed") =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.type === "percent" ? (
                    <div className="space-y-2">
                      <Label>Percentage *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.percent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            percent: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="10.00"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Fixed Amount (₹) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            value: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="1000.00"
                      />
                    </div>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Max Usage (optional)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_usage || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_usage: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expires At (optional)</Label>
                    <Input
                      type="date"
                      value={formData.expires_at || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, expires_at: e.target.value || undefined })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="VIP customer discount"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingCode} onOpenChange={(open) => !open && setEditingCode(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Discount Code</DialogTitle>
              <DialogDescription>
                Update discount code: {editingCode?.code}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input value={formData.code} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Label *</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "percent" | "fixed") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === "percent" ? (
                  <div className="space-y-2">
                    <Label>Percentage *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.percent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          percent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Fixed Amount (₹) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max Usage (optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_usage || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_usage: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="date"
                    value={formData.expires_at || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCode(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discount Codes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Discount Codes ({discountCodes?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : discountCodes && discountCodes.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discountCodes.map((code) => (
                      <TableRow key={code.code}>
                        <TableCell className="font-mono font-medium">
                          {code.code}
                        </TableCell>
                        <TableCell>{code.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {code.type === "percent" ? "Percentage" : "Fixed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {code.type === "percent"
                            ? `${code.percent}%`
                            : `₹${code.value.toLocaleString()}`}
                        </TableCell>
                        <TableCell>
                          {code.usage_count || 0}
                          {code.max_usage && ` / ${code.max_usage}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={code.is_active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({
                                  code: code.code,
                                  isActive: checked,
                                })
                              }
                              disabled={toggleActiveMutation.isPending}
                            />
                            <Badge
                              variant={code.is_active ? "default" : "secondary"}
                            >
                              {code.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.expires_at
                            ? new Date(code.expires_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(code)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(code.code)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No discount codes found. Create your first one!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDiscountCodes;

