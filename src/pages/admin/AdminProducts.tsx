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
import { Plus, Edit, Trash2, Eye, Search, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFirstImageUrl } from "@/lib/image-utils";

const CATEGORIES = [
  { value: "sofa", label: "Sofa", table: "sofa_database" },
  { value: "bed", label: "Bed", table: "bed_database" },
  { value: "recliner", label: "Recliner", table: "recliner_database" },
  { value: "cinema_chairs", label: "Cinema Chairs", table: "cinema_chairs_database" },
  { value: "dining_chairs", label: "Dining Chairs", table: "dining_chairs_database" },
  { value: "arm_chairs", label: "Arm Chairs", table: "arm_chairs_database" },
  { value: "benches", label: "Benches", table: "benches_database" },
  { value: "kids_bed", label: "Kids Bed", table: "kids_bed_database" },
  { value: "sofabed", label: "Sofa Bed", table: "sofabed_database" },
];

const AdminProducts = () => {
  const [selectedCategory, setSelectedCategory] = useState("sofa");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentTable = CATEGORIES.find((c) => c.value === selectedCategory)?.table || "sofa_database";

  // Fetch products for selected category
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", selectedCategory, currentTable],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(currentTable as any)
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Filter products by search term
  const filteredProducts = products?.filter((p: any) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingProduct?.id) {
        // Update
        const { error } = await supabase
          .from(currentTable as any)
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from(currentTable as any).insert(data);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: "Success",
        description: editingProduct
          ? "Product updated successfully"
          : "Product created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(currentTable as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from(currentTable as any)
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
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
    const data: any = {};

    // Get all form fields
    for (const [key, value] of formData.entries()) {
      if (key === "is_active") {
        data[key] = value === "on";
      } else if (key === "images") {
        // Handle images - can be comma-separated
        const imageValue = value as string;
        data[key] = imageValue.trim() || null;
      } else if (value && value !== "") {
        // Try to parse numbers
        const numValue = parseFloat(value as string);
        if (!isNaN(numValue) && value !== "") {
          data[key] = numValue;
        } else {
          data[key] = value;
        }
      }
    }

    // Set is_active default to true if not provided
    if (data.is_active === undefined) {
      data.is_active = true;
    }

    mutation.mutate(data);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  // Get table columns based on category
  const getTableColumns = () => {
    // Common columns for all products
    const common = ["title", "images", "net_price_rs", "strike_price_1seater_rs", "is_active"];
    
    // Add category-specific columns
    if (selectedCategory === "sofa") {
      return [
        ...common,
        "bom_rs",
        "markup_percent",
        "wastage_delivery_gst_percent",
        "discount_percent",
      ];
    }
    
    return common;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">
              Manage products across all categories
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct
                    ? "Update the product details"
                    : `Create a new product in ${CATEGORIES.find((c) => c.value === selectedCategory)?.label}`}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Product Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={editingProduct?.title || ""}
                        placeholder="e.g., Birkin Sofa"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="images">Images URL</Label>
                      <Input
                        id="images"
                        name="images"
                        defaultValue={editingProduct?.images || ""}
                        placeholder="https://example.com/image.jpg or comma-separated URLs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Single URL or comma-separated for multiple images
                      </p>
                    </div>
                  </div>

                  {selectedCategory === "sofa" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bom_rs">BOM Price (₹)</Label>
                          <Input
                            id="bom_rs"
                            name="bom_rs"
                            type="number"
                            step="0.01"
                            defaultValue={editingProduct?.bom_rs || ""}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="markup_percent">Markup %</Label>
                          <Input
                            id="markup_percent"
                            name="markup_percent"
                            type="number"
                            step="0.01"
                            defaultValue={editingProduct?.markup_percent || ""}
                            placeholder="270.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="wastage_delivery_gst_percent">
                            Wastage/Delivery/GST %
                          </Label>
                          <Input
                            id="wastage_delivery_gst_percent"
                            name="wastage_delivery_gst_percent"
                            type="number"
                            step="0.01"
                            defaultValue={editingProduct?.wastage_delivery_gst_percent || ""}
                            placeholder="20.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discount_percent">Discount %</Label>
                          <Input
                            id="discount_percent"
                            name="discount_percent"
                            type="number"
                            step="0.01"
                            defaultValue={editingProduct?.discount_percent || ""}
                            placeholder="10.00"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="net_price_rs">Net Price (₹)</Label>
                      <Input
                        id="net_price_rs"
                        name="net_price_rs"
                        type="number"
                        step="0.01"
                        defaultValue={editingProduct?.net_price_rs || ""}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="strike_price_1seater_rs">
                        Strike Price (₹)
                      </Label>
                      <Input
                        id="strike_price_1seater_rs"
                        name="strike_price_1seater_rs"
                        type="number"
                        step="0.01"
                        defaultValue={editingProduct?.strike_price_1seater_rs || ""}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      defaultChecked={editingProduct?.is_active !== false}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingProduct(null);
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
              Choose a category to manage its products
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

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : !filteredProducts || filteredProducts.length === 0 ? (
          <Alert>
            <AlertDescription>
              No products found for {selectedCategory}. Create your first product above.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {filteredProducts.length} Product(s) in {CATEGORIES.find((c) => c.value === selectedCategory)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Net Price</TableHead>
                    <TableHead>Strike Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: any) => {
                    const imageUrl = getFirstImageUrl(product.images);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.title}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.title}
                        </TableCell>
                        <TableCell>
                          ₹{product.net_price_rs?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell>
                          ₹{product.strike_price_1seater_rs?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell>
                          {product.is_active ? (
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleActiveMutation.mutate({
                                  id: product.id,
                                  isActive: product.is_active,
                                })
                              }
                            >
                              {product.is_active ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;

