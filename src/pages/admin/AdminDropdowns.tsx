import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  { value: "sofa", label: "Sofa" },
  { value: "bed", label: "Bed" },
  { value: "recliner", label: "Recliner" },
  { value: "cinema_chairs", label: "Cinema Chairs" },
  { value: "dining_chairs", label: "Dining Chairs" },
  { value: "arm_chairs", label: "Arm Chairs" },
  { value: "benches", label: "Benches" },
  { value: "kids_bed", label: "Kids Bed" },
  { value: "sofabed", label: "Sofa Bed" },
];

const AdminDropdowns = () => {
  const [selectedCategory, setSelectedCategory] = useState("sofa");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dropdown options for selected category
  const { data: options, isLoading } = useQuery({
    queryKey: ["admin-dropdowns", selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dropdown_options")
        .select("*")
        .eq("category", selectedCategory)
        .order("field_name", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Group options by field_name
  const groupedOptions = options?.reduce((acc: any, option: any) => {
    if (!acc[option.field_name]) {
      acc[option.field_name] = [];
    }
    acc[option.field_name].push(option);
    return acc;
  }, {} as Record<string, any[]>);

  const fieldNames = groupedOptions ? Object.keys(groupedOptions).sort() : [];

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOption?.id) {
        // Update
        const { error } = await supabase
          .from("dropdown_options")
          .update({
            category: data.category,
            field_name: data.field_name,
            option_value: data.option_value,
            display_label: data.display_label || data.option_value,
            sort_order: data.sort_order || 0,
            is_active: data.is_active !== undefined ? data.is_active : true,
            metadata: data.metadata || {},
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingOption.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("dropdown_options").insert({
          category: data.category,
          field_name: data.field_name,
          option_value: data.option_value,
          display_label: data.display_label || data.option_value,
          sort_order: data.sort_order || 0,
          is_active: data.is_active !== undefined ? data.is_active : true,
          metadata: data.metadata || {},
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dropdowns"] });
      setIsDialogOpen(false);
      setEditingOption(null);
      toast({
        title: "Success",
        description: editingOption ? "Option updated successfully" : "Option created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save option",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dropdown_options")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dropdowns"] });
      toast({
        title: "Success",
        description: "Option deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete option",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("dropdown_options")
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dropdowns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const metadataText = formData.get("metadata") as string;
    
    let metadata = {};
    if (metadataText) {
      try {
        metadata = JSON.parse(metadataText);
      } catch {
        toast({
          title: "Invalid JSON",
          description: "Metadata must be valid JSON",
          variant: "destructive",
        });
        return;
      }
    }

    mutation.mutate({
      category: selectedCategory,
      field_name: formData.get("field_name") as string,
      option_value: formData.get("option_value") as string,
      display_label: formData.get("display_label") as string,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
      is_active: formData.get("is_active") === "on",
      metadata,
    });
  };

  const handleEdit = (option: any) => {
    setEditingOption(option);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this option?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNew = () => {
    setEditingOption(null);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dropdown Options Management</h1>
            <p className="text-muted-foreground">
              Manage all dropdown options for product categories
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOption ? "Edit Option" : "Add New Option"}
                </DialogTitle>
                <DialogDescription>
                  {editingOption
                    ? "Update the dropdown option details"
                    : "Create a new dropdown option for the selected category"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      name="category"
                      defaultValue={selectedCategory}
                      disabled={!!editingOption}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field_name">Field Name *</Label>
                    <Input
                      id="field_name"
                      name="field_name"
                      defaultValue={editingOption?.field_name || ""}
                      placeholder="e.g., base_shape, front_seat_count, foam_type"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The field name used in the configurator
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="option_value">Option Value *</Label>
                    <Input
                      id="option_value"
                      name="option_value"
                      defaultValue={editingOption?.option_value || ""}
                      placeholder="e.g., Standard, 2-Seater, Firm"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The actual value stored in the database
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_label">Display Label</Label>
                    <Input
                      id="display_label"
                      name="display_label"
                      defaultValue={editingOption?.display_label || ""}
                      placeholder="e.g., Standard Sofa"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional. If empty, option_value will be used
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      name="sort_order"
                      type="number"
                      defaultValue={editingOption?.sort_order ?? 0}
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower numbers appear first
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      defaultChecked={editingOption?.is_active !== false}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metadata">Metadata (JSON)</Label>
                    <Textarea
                      id="metadata"
                      name="metadata"
                      defaultValue={
                        editingOption?.metadata
                          ? JSON.stringify(editingOption.metadata, null, 2)
                          : ""
                      }
                      placeholder='{"price_adjustment": 1000, "default": true}'
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional JSON metadata for pricing, defaults, etc.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingOption(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Category</CardTitle>
            <CardDescription>
              Choose a category to manage its dropdown options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-9">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value}>
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Options by Field */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : fieldNames.length === 0 ? (
          <Alert>
            <AlertDescription>
              No dropdown options found for {selectedCategory}. Create your first option above.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {fieldNames.map((fieldName) => (
              <Card key={fieldName}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {fieldName.replace(/_/g, " ")}
                  </CardTitle>
                  <CardDescription>
                    {groupedOptions[fieldName].length} option(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Value</TableHead>
                        <TableHead>Display Label</TableHead>
                        <TableHead>Sort Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Metadata</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedOptions[fieldName].map((option: any) => (
                        <TableRow key={option.id}>
                          <TableCell className="font-medium">
                            {option.option_value}
                          </TableCell>
                          <TableCell>
                            {option.display_label || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{option.sort_order}</TableCell>
                          <TableCell>
                            {option.is_active ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="mr-1 h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {option.metadata ? (
                              <code className="text-xs bg-muted p-1 rounded">
                                {JSON.stringify(option.metadata).substring(0, 50)}
                                {JSON.stringify(option.metadata).length > 50 ? "..." : ""}
                              </code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(option)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleActiveMutation.mutate({
                                    id: option.id,
                                    isActive: option.is_active,
                                  })
                                }
                              >
                                {option.is_active ? (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(option.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDropdowns;

