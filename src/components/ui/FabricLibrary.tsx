import { useState, useMemo, useCallback, SyntheticEvent } from "react";
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
import {
  normalizeImageUrl,
  getFirstImageUrl,
  parseImageUrls,
  convertGoogleDriveUrl,
  extractGoogleDriveFileId,
} from "@/lib/image-utils";

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
      let allData: Array<{ bom_price: number | null; price: number | null; upgrade: number | null }> = [];
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

      return allData;
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
      .filter((p): p is number => p !== null && p !== undefined && p > 0);

    // Max Price: from bom_price column (as per user's requirement)
    const maxBomPrices = fabricsForStats
      .map((f) => f.bom_price)
      .filter((p): p is number => p !== null && p !== undefined && p > 0);

    const total = fabricsForStats.length;
    const avgPrice = bomPrices.length > 0 ? bomPrices.reduce((a, b) => a + b, 0) / bomPrices.length : 0;
    const minPrice = bomPrices.length > 0 ? Math.min(...bomPrices) : 0;
    const maxPrice = maxBomPrices.length > 0 ? Math.max(...maxBomPrices) : 0;

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

  // Get fabric image URL from colour_link column (primary source for image URLs)
  const getFabricImageUrl = (fabric: Fabric): string | null => {
    // PRIMARY: Use colour_link column - this is where image URLs should be stored
    if (fabric.colour_link) {
      const colourLinkValue = String(fabric.colour_link).trim();
      
      // Skip empty values, NULL, or error values
      if (!colourLinkValue || 
          colourLinkValue === '' || 
          colourLinkValue === 'NULL' || 
          colourLinkValue === '#VALUE!' ||
          colourLinkValue.toLowerCase() === 'null') {
        if (import.meta.env.DEV) {
          console.log(`[FabricLibrary] Skipping invalid colour_link for ${fabric.estre_code}:`, colourLinkValue);
        }
        return null;
      }
      
      // Try parsing as image URL first (handles various formats: string, array, comma-separated, JSON)
      // This will automatically convert Google Drive URLs via normalizeImageUrl
      const imageUrl = getFirstImageUrl(colourLinkValue);
      if (imageUrl && imageUrl !== '/placeholder.svg') {
        if (import.meta.env.DEV) {
          console.log(`[FabricLibrary] Using image URL for ${fabric.estre_code}:`, imageUrl);
        }
        // Return the URL - let the browser try to load it
        // Don't use strict validation here as it might reject valid URLs
        return imageUrl;
      }
      
      // If getFirstImageUrl didn't work, try direct normalization
      // This handles Google Drive URLs and other non-standard formats
      const normalized = normalizeImageUrl(colourLinkValue);
      if (normalized && normalized !== '/placeholder.svg') {
        if (import.meta.env.DEV) {
          console.log(`[FabricLibrary] Using normalized image URL for ${fabric.estre_code}:`, normalized, '(original:', colourLinkValue + ')');
        }
        // Accept any normalized URL - the normalization function handles validation
        // This includes Google Drive URLs (converted to direct image URLs),
        // regular HTTP/HTTPS URLs, and relative paths
        return normalized;
      }
      
      if (import.meta.env.DEV) {
        console.warn(`[FabricLibrary] Could not process colour_link for ${fabric.estre_code}:`, colourLinkValue);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log(`[FabricLibrary] No colour_link for ${fabric.estre_code}, falling back to colour column`);
      }
    }
    
    // FALLBACK: Try colour column (some old data might have URLs here)
    // Only if colour_link didn't have a valid URL
    if (fabric.colour) {
      const colourValue = String(fabric.colour).trim();
      
      // Skip error values
      if (colourValue === 'NULL' || colourValue === '#VALUE!' || colourValue.toLowerCase() === 'null') {
        return null;
      }
      
      // Only process if it looks like a URL/path (not just a color name like "Red")
      if (colourValue && (
        colourValue.includes('http') || 
        colourValue.includes('drive.google.com') ||
        colourValue.includes('.jpg') || 
        colourValue.includes('.jpeg') || 
        colourValue.includes('.png') ||
        colourValue.startsWith('/') ||
        colourValue.startsWith('//')
      )) {
        const imageUrl = getFirstImageUrl(colourValue);
        if (imageUrl && imageUrl !== '/placeholder.svg') {
          if (import.meta.env.DEV) {
            console.log(`[FabricLibrary] Using colour column image URL for ${fabric.estre_code}:`, imageUrl);
          }
          return imageUrl;
        }
        
        const normalized = normalizeImageUrl(colourValue);
        if (normalized && normalized !== '/placeholder.svg') {
          if (import.meta.env.DEV) {
            console.log(`[FabricLibrary] Using normalized colour column URL for ${fabric.estre_code}:`, normalized);
          }
          return normalized;
        }
      }
    }
    
    if (import.meta.env.DEV) {
      console.log(`[FabricLibrary] No valid image URL found for ${fabric.estre_code}, will use color fallback`);
    }
    return null;
  };

  // Generate color from fabric code or use default (fallback when no image)
  const getFabricColor = (fabric: Fabric): string => {
    // Use colour column for color value (not colour_link, which is for image URLs)
    // Only use if it's a simple color name/value, not a URL
    if (fabric.colour) {
      const colourValue = String(fabric.colour).trim();
      // Only use as color if it doesn't look like a URL
      if (colourValue && !colourValue.includes('http') && !colourValue.includes('.jpg') && 
          !colourValue.includes('.png') && !colourValue.includes('.jpeg') && 
          !colourValue.startsWith('/') && colourValue.length < 50) {
        // It's likely a color name/value, use it for background
        // Try to parse as CSS color, otherwise generate from hash
        if (colourValue.match(/^#[0-9A-Fa-f]{3,6}$/) || 
            colourValue.match(/^rgb\(|^hsl\(|^rgba\(|^hsla\(/)) {
          return colourValue;
        }
      }
    }
    
    // Generate a consistent color from the fabric code (hash-based)
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

  const getFabricImageSources = (fabric: Fabric): string[] => {
    const result: string[] = [];
    const pushUnique = (candidate?: string | null) => {
      if (!candidate) return;
      if (candidate === "/placeholder.svg") return;
      if (!result.includes(candidate)) {
        result.push(candidate);
      }
    };

    const addCandidateValue = (value: any) => {
      if (!value) return;
      parseImageUrls(value).forEach((url) => pushUnique(url));
    };

    // Primary source from existing logic (ensures first item is best guess)
    pushUnique(getFabricImageUrl(fabric));

    addCandidateValue(fabric.colour_link);
    addCandidateValue(fabric.colour);

    result.slice(0).forEach((url) => {
      const fileId = extractGoogleDriveFileId(url);
      if (fileId) {
        pushUnique(convertGoogleDriveUrl(url, { mode: "view" }));
        pushUnique(convertGoogleDriveUrl(url, { mode: "download" }));
        pushUnique(convertGoogleDriveUrl(url, { mode: "thumbnail", size: 1024 }));
        pushUnique(convertGoogleDriveUrl(url, { mode: "content", size: 1024 }));
      }
    });

    return result;
  };

  const handleImageError = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const target = event.target as HTMLImageElement;
    const fallbackAttr = target.dataset.fallbacks || "";
    const fallbacks = fallbackAttr
      .split("|")
      .map((url) => url.trim())
      .filter(Boolean);

    if (fallbacks.length > 0) {
      const next = fallbacks.shift()!;
      target.dataset.fallbacks = fallbacks.join("|");
      target.src = next;
      return;
    }

    target.style.display = "none";
    const parent = target.parentElement;
    if (parent) {
      parent.classList.add("bg-muted");
    }
  }, []);

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
              {displayedFabrics.map((fabric) => {
                const imageSources = getFabricImageSources(fabric);
                const [primaryImage, ...fallbackImages] = imageSources;
                const fallbackColor = getFabricColor(fabric);

                return (
                  <Card
                    key={fabric.id}
                    className={`cursor-pointer hover:border-primary transition-all ${
                      selectedCode === fabric.estre_code ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handleSelect(fabric.estre_code)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-center">
                        {primaryImage ? (
                          <div
                            className="relative w-full max-w-[180px] aspect-square overflow-hidden rounded-xl border border-muted/60 shadow-sm"
                            style={{ backgroundColor: fallbackColor }}
                          >
                            <img
                              src={primaryImage}
                              data-fallbacks={fallbackImages.join("|")}
                              alt={fabric.description || fabric.colour || fabric.estre_code}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-full max-w-[180px] aspect-square rounded-xl border border-muted/60 shadow-sm bg-muted"
                            style={{ backgroundColor: fallbackColor }}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 justify-center">
                        <Badge variant="outline" className="text-xs font-mono">
                          {fabric.estre_code}
                        </Badge>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{getVendorCode(fabric)}</p>
                      </div>

                      <div className="text-center">
                        <p className="font-semibold text-sm">
                          ₹{fabric.bom_price?.toLocaleString() || fabric.price?.toLocaleString() || "0"}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {fabric.upgrade?.toLocaleString() || "0"}
                        </p>
                      </div>

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
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedFabrics.map((fabric) => {
                const imageSources = getFabricImageSources(fabric);
                const [primaryImage, ...fallbackImages] = imageSources;
                const fallbackColor = getFabricColor(fabric);

                return (
                  <Card
                    key={fabric.id}
                    className={`cursor-pointer hover:border-primary transition-all ${
                      selectedCode === fabric.estre_code ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handleSelect(fabric.estre_code)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {primaryImage ? (
                          <div
                            className="w-32 h-32 rounded-xl border border-muted/60 flex-shrink-0 overflow-hidden relative"
                            style={{ backgroundColor: fallbackColor }}
                          >
                            <img
                              src={primaryImage}
                              data-fallbacks={fallbackImages.join("|")}
                              alt={fabric.description || fabric.colour || fabric.estre_code}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-32 h-32 rounded-xl border border-muted/60 flex-shrink-0 bg-muted"
                            style={{ backgroundColor: fallbackColor }}
                          />
                        )}
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
                );
              })}
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

