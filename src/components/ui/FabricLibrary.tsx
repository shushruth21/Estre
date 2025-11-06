import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Grid3x3,
  List,
  RefreshCw,
  Filter,
  ExternalLink,
  Palette,
} from "lucide-react";

interface FabricLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fabricCode: string) => void;
  selectedCode?: string;
  title?: string;
}

interface Fabric {
  id: string;
  estre_code: string;
  description: string | null;
  collection: string | null;
  brand: string | null;
  vendor: string | null;
  vendor_code: string | null;
  colour: string | null;
  colour_link: string | null;
  price: number | null;
  bom_price: number | null;
  upgrade: number | null;
}

export const FabricLibrary = ({
  open,
  onOpenChange,
  onSelect,
  selectedCode,
  title = "Fabric Library",
}: FabricLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);
  const pageSize = 100;

  // Fetch all fabrics for statistics (always fetch all, regardless of search)
  const { data: allFabricsForStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["fabric-library-stats"],
    queryFn: async () => {
      // Fetch all rows without limit - Supabase default limit is 1000, so we need to handle pagination
      let allData: Fabric[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from("fabric_coding")
          .select("bom_price, price, upgrade", { count: "exact" })
          .eq("is_active", true)
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data) {
          allData = [...allData, ...data];
        }

        // Check if we got less than batchSize, meaning we've reached the end
        if (!data || data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      }

      return allData as Fabric[];
    },
  });

  // Fetch fabrics for display (with search filter)
  const { data: allFabrics, isLoading, refetch } = useQuery({
    queryKey: ["fabric-library", searchTerm],
    queryFn: async () => {
      // Fetch all matching rows without limit
      let allData: Fabric[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("fabric_coding")
          .select("*")
          .eq("is_active", true)
          .range(from, from + batchSize - 1)
          .order("collection, brand, colour");

        if (searchTerm) {
          query = query.or(
            `estre_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,collection.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%,colour.ilike.%${searchTerm}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          allData = [...allData, ...data];
        }

        // Check if we got less than batchSize, meaning we've reached the end
        if (!data || data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      }

      return allData as Fabric[];
    },
  });

  // Calculate statistics from ALL active fabrics in database (not filtered by search)
  const stats = useMemo(() => {
    const fabricsForStats = allFabricsForStats || [];
    
    if (fabricsForStats.length === 0) {
      return {
        total: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
      };
    }

    // Min Price: from bom_price column
    const bomPrices = fabricsForStats
      .map((f) => f.bom_price)
      .filter((p) => p !== null && p !== undefined && p > 0);

    // Max Price: from upgrade column
    const upgradePrices = fabricsForStats
      .map((f) => f.upgrade)
      .filter((p) => p !== null && p !== undefined && p > 0);

    const total = fabricsForStats.length;
    const avgPrice = bomPrices.length > 0 ? bomPrices.reduce((a, b) => a + b, 0) / bomPrices.length : 0;
    const minPrice = bomPrices.length > 0 ? Math.min(...bomPrices) : 0;
    const maxPrice = upgradePrices.length > 0 ? Math.max(...upgradePrices) : 0;

    return {
      total,
      avgPrice,
      minPrice,
      maxPrice,
    };
  }, [allFabricsForStats]);

  // Paginate fabrics
  const displayedFabrics = useMemo(() => {
    if (!allFabrics) return [];
    const start = page * pageSize;
    return allFabrics.slice(start, start + pageSize);
  }, [allFabrics, page]);

  const handleSelect = (fabricCode: string) => {
    onSelect(fabricCode);
    onOpenChange(false);
  };

  // Generate color from fabric code or use default
  const getFabricColor = (fabric: Fabric): string => {
    // Try to extract color from code or use a hash-based color
    if (fabric.colour_link) return fabric.colour_link;
    
    // Generate a consistent color from the code
    let hash = 0;
    for (let i = 0; i < fabric.estre_code.length; i++) {
      hash = fabric.estre_code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 75%)`;
  };

  // Format vendor code for display
  const getVendorCode = (fabric: Fabric): string => {
    if (fabric.vendor_code) return fabric.vendor_code;
    if (fabric.vendor && fabric.colour) {
      return `${fabric.vendor}-${fabric.colour}`;
    }
    return fabric.estre_code;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive fabric search and selection interface.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Search and Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fabrics by name, code, collection, or vendor..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    {displayedFabrics.length} of {stats.total.toLocaleString()} fabrics
                  </>
                )}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  {isLoadingStats ? (
                    <div className="text-2xl font-bold text-primary animate-pulse">...</div>
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      {stats.total.toLocaleString()}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">Total Fabrics</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  {isLoadingStats ? (
                    <div className="text-2xl font-bold text-primary animate-pulse">...</div>
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      ₹{Math.round(stats.avgPrice).toLocaleString()}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">Avg Price</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  {isLoadingStats ? (
                    <div className="text-2xl font-bold text-primary animate-pulse">...</div>
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      ₹{Math.round(stats.minPrice).toLocaleString()}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">Min Price</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  {isLoadingStats ? (
                    <div className="text-2xl font-bold text-primary animate-pulse">...</div>
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      ₹{Math.round(stats.maxPrice).toLocaleString()}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">Max Price</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fabric Grid/List */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading fabrics...
            </div>
          ) : displayedFabrics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No fabrics found. Try adjusting your search.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedFabrics.map((fabric) => (
                <Card
                  key={fabric.id}
                  className={`cursor-pointer hover:border-primary transition-all ${
                    selectedCode === fabric.estre_code ? "border-primary border-2" : ""
                  }`}
                  onClick={() => handleSelect(fabric.estre_code)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Color Swatch */}
                    <div className="flex justify-center">
                      <div
                        className="w-20 h-20 rounded-full border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: getFabricColor(fabric) }}
                      />
                    </div>

                    {/* Fabric Code */}
                    <div className="flex items-center gap-1 justify-center">
                      <Badge variant="outline" className="text-xs font-mono">
                        {fabric.estre_code}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>

                    {/* Vendor Code / Internal SKU */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {getVendorCode(fabric)}
                      </p>
                    </div>

                    {/* BOM Price */}
                    <div className="text-center">
                      <p className="font-semibold text-sm">
                        ₹{fabric.bom_price?.toLocaleString() || fabric.price?.toLocaleString() || "0"}
                      </p>
                    </div>

                    {/* Upgrade Value */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {fabric.upgrade?.toLocaleString() || "0"}
                      </p>
                    </div>

                    {/* Select Button */}
                    <Button
                      variant={selectedCode === fabric.estre_code ? "default" : "outline"}
                      className="w-full"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(fabric.estre_code);
                      }}
                    >
                      {selectedCode === fabric.estre_code ? "Selected" : "Select"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedFabrics.map((fabric) => (
                <Card
                  key={fabric.id}
                  className={`cursor-pointer hover:border-primary transition-all ${
                    selectedCode === fabric.estre_code ? "border-primary border-2" : ""
                  }`}
                  onClick={() => handleSelect(fabric.estre_code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded border-2 border-gray-200 flex-shrink-0"
                        style={{ backgroundColor: getFabricColor(fabric) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {fabric.estre_code}
                          </Badge>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {getVendorCode(fabric)}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {fabric.description || fabric.colour || fabric.estre_code}
                        </p>
                        {fabric.collection && fabric.brand && (
                          <p className="text-xs text-muted-foreground">
                            {fabric.collection} - {fabric.brand}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{fabric.bom_price?.toLocaleString() || fabric.price?.toLocaleString() || "0"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Upgrade: {fabric.upgrade?.toLocaleString() || "0"}
                        </p>
                        <Button
                          variant={selectedCode === fabric.estre_code ? "default" : "outline"}
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(fabric.estre_code);
                          }}
                        >
                          {selectedCode === fabric.estre_code ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {allFabrics && allFabrics.length > pageSize && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {Math.ceil((allFabrics.length || 0) / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= (allFabrics.length || 0)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

