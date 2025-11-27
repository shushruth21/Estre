import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFirstImageUrl } from "@/lib/image-utils";
import { performanceMonitor } from "@/lib/performance-monitor";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";

// Table name mapping for categories
const CATEGORY_TABLE_NAMES = {
  sofa: 'sofa_database',
  bed: 'bed_database',
  recliner: 'recliner_database',
  cinema_chairs: 'cinema_chairs_database',
  dining_chairs: 'dining_chairs_database',
  arm_chairs: 'arm_chairs_database',
  benches: 'benches_database',
  kids_bed: 'kids_bed_database',
  sofabed: 'sofabed_database',
  database_pouffes: 'database_pouffes', // Special case - no _database suffix
};

const getCategoryTableName = (category: string): string => {
  return CATEGORY_TABLE_NAMES[category as keyof typeof CATEGORY_TABLE_NAMES]
    || `${category}_database`;
};

// Column mapping for different category tables
const CATEGORY_COLUMNS = {
  sofa: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_1seater_rs'
  },
  bed: {
    netPrice: 'net_price_single_no_storage_rs',
    strikePrice: 'strike_price_rs'
  },
  kids_bed: {
    netPrice: 'net_price_single_no_storage_rs',
    strikePrice: 'strike_price_rs'
  },
  sofabed: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_2seater_rs'
  },
  database_pouffes: {
    netPrice: 'net_price',
    strikePrice: 'strike_price_rs'
  },
  recliner: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_1seater_rs'
  },
  cinema_chairs: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_1seater_rs'
  },
  dining_chairs: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_1seater_rs'
  },
  arm_chairs: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_1seater_rs'
  },
  benches: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_1seater_rs'
  },
  default: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_rs'
  }
};

const getCategoryColumns = (category: string) => {
  return CATEGORY_COLUMNS[category as keyof typeof CATEGORY_COLUMNS] || CATEGORY_COLUMNS.default;
};

type Product = {
  id: string;
  title: string;
  images?: string | null;
  netPrice?: number | null;
  strikePrice?: number | null;
  discount_percent?: number | null;
  discount_rs?: number | null;
  bom_rs?: number | null;
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<string>(searchParams.get("category") || "sofa");

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, [searchParams]);

  const handleCategoryChange = (newCategory: string) => {
    // Optimistic update - immediately update UI
    setCategory(newCategory);
    setSearchParams({ category: newCategory });
    // Query will automatically fetch in background due to placeholderData
  };

  const { data: products, isLoading, error, isPlaceholderData, isError } = useQuery({
    queryKey: ["products", category],
    enabled: !!category,
    queryFn: async () => {
      // Start performance timer
      const endTimer = performanceMonitor.startTimer('product-query');

      const tableName = getCategoryTableName(category);
      const columns = getCategoryColumns(category);

      // Log query attempt
      console.log('🔍 Fetching products:', {
        category,
        table: tableName,
        timestamp: new Date().toISOString()
      });

      try {
        // Build select query with error handling (removed redundant test query for performance)
        let selectFields = `id, title, images, ${columns.netPrice}, ${columns.strikePrice}, discount_percent, discount_rs`;

        // Only add bom_rs if category supports it (exclude sofa too)
        if (category !== "sofabed" && category !== "recliner" && category !== "cinema_chairs" && category !== "database_pouffes" && category !== "sofa") {
          selectFields += `, bom_rs`;
        }

        if (category === "sofabed") {
          selectFields = `id, title, images, ${columns.netPrice}, ${columns.strikePrice}, strike_price_2seater_rs, discount_percent, discount_rs`;
        } else if (category === "recliner" || category === "cinema_chairs") {
          selectFields = `id, title, images, ${columns.netPrice}, ${columns.strikePrice}, discount_percent, discount_rs`;
        } else if (category === "database_pouffes") {
          selectFields = `id, title, image, ${columns.netPrice}, ${columns.strikePrice}, discount_percent, discount_rs`;
        }

        // Execute query with timeout (15 seconds)
        let query = supabase
          .from(tableName as any)
          .select(selectFields);

        // Only filter by is_active if the table has that column
        if (category !== "database_pouffes") {
          query = query.eq("is_active", true);
        }

        // Add timeout to prevent hanging queries (15 seconds)
        const queryPromise = query.order("title", { ascending: true });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout: Request took longer than 15 seconds')), 15000)
        );

        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data, error } = result as any;

        if (error) {
          console.error('❌ Supabase query error:', {
            category,
            table: tableName,
            selectFields,
            error: {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            }
          });

          endTimer();

          // Provide specific error messages
          let userMessage = `Failed to load products: ${error.message}`;
          if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
            userMessage = `Access denied. RLS policies may not allow public read access to "${tableName}". Please check Supabase RLS policies.`;
          } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
            userMessage = `Table "${tableName}" does not exist in database.`;
          } else if (error.message?.includes('column')) {
            userMessage = `Column mismatch: ${error.message}. Please verify column names in "${tableName}".`;
          } else if (error.hint) {
            userMessage += ` (${error.hint})`;
          }

          throw new Error(userMessage);
        }

        // Validate and normalize data
        if (!data || data.length === 0) {
          console.warn('⚠️ No products found:', {
            category,
            table: tableName,
            message: 'Query succeeded but returned no data'
          });
          endTimer();
          return [];
        }

        console.log('✅ Products loaded successfully:', {
          category,
          count: data.length,
          table: tableName
        });

        // End performance timer
        endTimer();

        // Normalize the data
        const normalizedData = (data || []).map((item: any) => {
          const imageData = category === "database_pouffes" ? item.image : item.images;
          const imageUrl = imageData ? getFirstImageUrl(imageData) : null;

          const strikePrice = category === "sofabed" && item.strike_price_2seater_rs !== null && item.strike_price_2seater_rs !== undefined
            ? item.strike_price_2seater_rs
            : item[columns.strikePrice];

          const netPrice = item[columns.netPrice] !== null && item[columns.netPrice] !== undefined
            ? Number(item[columns.netPrice])
            : null;
          const strikePriceNum = strikePrice !== null && strikePrice !== undefined
            ? Number(strikePrice)
            : null;

          return {
            id: item.id,
            title: item.title,
            images: imageUrl,
            imagesData: imageData,
            netPrice: netPrice,
            strikePrice: strikePriceNum,
            discount_percent: item.discount_percent,
            discount_rs: item.discount_rs,
            bom_rs: (category === "sofabed" || category === "recliner" || category === "cinema_chairs" || category === "database_pouffes" || category === "sofa") ? undefined : item.bom_rs
          };
        });

        return normalizedData as Product[];
      } catch (err: any) {
        // Catch-all error handling
        console.error('❌ Unexpected error in product query:', {
          category,
          table: tableName,
          error: err.message || err,
          stack: err.stack
        });
        endTimer();
        throw err;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on timeout or permission errors
      if (error?.message?.includes('timeout') || error?.code === 'PGRST301') {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
    retryDelay: 1000,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (increased for better performance)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (increased)
    placeholderData: (previousData) => previousData, // Keep old data while fetching new
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    // Add structural sharing for better performance
    structuralSharing: true,
    onError: (error: any) => {
      console.error('React Query error:', error);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-serif font-bold mb-4 tracking-tight">Product Catalog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our curated collection of premium furniture, each piece customizable to your specifications
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={handleCategoryChange} className="mb-12">
          <TabsList className="flex-wrap h-auto gap-2 bg-muted/50 p-2">
            <TabsTrigger value="sofa" className="data-[state=active]:bg-gold data-[state=active]:text-white">Sofas</TabsTrigger>
            <TabsTrigger value="bed" className="data-[state=active]:bg-gold data-[state=active]:text-white">Beds</TabsTrigger>
            <TabsTrigger value="recliner" className="data-[state=active]:bg-gold data-[state=active]:text-white">Recliners</TabsTrigger>
            <TabsTrigger value="cinema_chairs" className="data-[state=active]:bg-gold data-[state=active]:text-white">Cinema Chairs</TabsTrigger>
            <TabsTrigger value="dining_chairs" className="data-[state=active]:bg-gold data-[state=active]:text-white">Dining Chairs</TabsTrigger>
            <TabsTrigger value="arm_chairs" className="data-[state=active]:bg-gold data-[state=active]:text-white">Arm Chairs</TabsTrigger>
            <TabsTrigger value="benches" className="data-[state=active]:bg-gold data-[state=active]:text-white">Benches</TabsTrigger>
            <TabsTrigger value="kids_bed" className="data-[state=active]:bg-gold data-[state=active]:text-white">Kids Beds</TabsTrigger>
            <TabsTrigger value="sofabed" className="data-[state=active]:bg-gold data-[state=active]:text-white">Sofa Beds</TabsTrigger>
            <TabsTrigger value="database_pouffes" className="data-[state=active]:bg-gold data-[state=active]:text-white">Pouffes</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {isError && error && (
          <div className="text-center py-20 max-w-2xl mx-auto">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-4">
              <p className="text-destructive text-lg font-semibold mb-2">Error loading products</p>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <div className="text-left bg-background/50 rounded p-4 text-sm space-y-2">
                <p className="font-medium">Troubleshooting steps:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Check browser console (F12) for detailed error messages</li>
                  <li>Verify Supabase connection in Network tab</li>
                  <li>Ensure table "{getCategoryTableName(category)}" exists in Supabase</li>
                  <li>Check RLS policies allow public read access</li>
                  <li>Verify environment variables are set correctly</li>
                </ul>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {isLoading && !products && !isError ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-primary">Loading products...</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden bg-white/80 backdrop-blur-md border border-gold/20 shadow-sm animate-pulse">
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/30"></div>
                  <CardContent className="p-6 space-y-3">
                    <div className="h-6 bg-muted/60 rounded w-3/4"></div>
                    <div className="h-8 bg-muted/60 rounded w-1/2"></div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <div className="w-full h-10 bg-muted/60 rounded"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : !isError && products && products.length > 0 ? (
          <div className="space-y-6">
            {isPlaceholderData && (
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Loading {category} products...</p>
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Card key={product.id} className="group overflow-hidden bg-white/80 backdrop-blur-md border border-gold/20 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                    <img
                      src={product.images || '/placeholder.svg'}
                      alt={product.title}
                      className="w-full h-full object-cover image-zoom"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const currentSrc = target.src;

                        // Only set placeholder if not already placeholder
                        if (!currentSrc.includes('placeholder.svg')) {
                          target.src = '/placeholder.svg';
                          target.onerror = null; // Prevent infinite loop
                        }
                      }}
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-2xl font-serif font-semibold tracking-tight group-hover:text-gold transition-colors">
                      {product.title}
                    </h3>

                    {/* Pricing Section */}
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        {product.netPrice ? (
                          <p className="text-3xl font-bold text-foreground">
                            ₹{Number(product.netPrice).toLocaleString('en-IN')}
                          </p>
                        ) : product.strikePrice ? (
                          <p className="text-3xl font-bold text-foreground">
                            ₹{Number(product.strikePrice).toLocaleString('en-IN')}
                          </p>
                        ) : null}
                        {product.strikePrice && product.netPrice && product.strikePrice > product.netPrice && (
                          <span className="text-lg line-through text-muted-foreground">
                            ₹{Number(product.strikePrice).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {product.discount_percent && product.discount_percent > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 text-gold rounded-full text-sm font-semibold border border-gold/20">
                          Save {product.discount_percent}%
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Link to={`/configure/${category}/${product.id}`} className="w-full">
                      <Button variant="luxury" className="w-full">
                        Configure Now
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : !isError && !isLoading && (!products || products.length === 0) ? (
          <div className="text-center py-20">
            <div className="bg-muted/50 border border-muted rounded-lg p-6 max-w-md mx-auto">
              <p className="text-lg font-semibold mb-2">No products found</p>
              <p className="text-muted-foreground mb-4">
                There are no products available in the "{category}" category.
              </p>
              <p className="text-sm text-muted-foreground">
                {import.meta.env.DEV && (
                  <span>
                    Check if table "{getCategoryTableName(category)}" has data and RLS policies allow public read access.
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && products?.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No products available in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
