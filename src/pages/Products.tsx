import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFirstImageUrl } from "@/lib/image-utils";
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
  default: {
    netPrice: 'net_price_rs',
    strikePrice: 'strike_price_1seater_rs'
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
    setCategory(newCategory);
    setSearchParams({ category: newCategory });
  };

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      const columns = getCategoryColumns(category);
      
      // Build select query - handle categories that don't have bom_rs column
      let selectFields = `id, title, images, ${columns.netPrice}, ${columns.strikePrice}, discount_percent, discount_rs, bom_rs`;
      if (category === "sofabed") {
        // For sofabed, bom_rs has been renamed to strike_price_2seater_rs
        selectFields = `id, title, images, ${columns.netPrice}, ${columns.strikePrice}, strike_price_2seater_rs, discount_percent, discount_rs`;
      } else if (category === "recliner" || category === "cinema_chairs") {
        // For recliner and cinema chairs, bom_rs doesn't exist - use primary pricing columns only
        selectFields = `id, title, images, ${columns.netPrice}, ${columns.strikePrice}, discount_percent, discount_rs`;
      } else if (category === "database_pouffes") {
        // For pouffes, use image column (singular, not images)
        selectFields = `id, title, image, ${columns.netPrice}, ${columns.strikePrice}, discount_percent, discount_rs`;
      }
      
      // Using dynamic table names with Supabase requires runtime querying
      let query = supabase
        .from(getCategoryTableName(category) as any)
        .select(selectFields);
      
      // Only filter by is_active if the table has that column (exclude database_pouffes)
      if (category !== "database_pouffes") {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query.order("title", { ascending: true }) as any;

      if (error) throw error;
      
      // Debug: Log raw data from database in development only
      if (import.meta.env.DEV && data && data.length > 0) {
        console.log('📦 Raw product data from database:', {
          category,
          count: data.length,
          columns: columns,
          firstItem: {
            id: data[0].id,
            title: data[0].title,
            netPrice: data[0][columns.netPrice],
            strikePrice: data[0][columns.strikePrice],
            strike_price_2seater_rs: category === "sofabed" ? data[0].strike_price_2seater_rs : undefined,
            discount_percent: data[0].discount_percent,
          }
        });
      }
      
      // Normalize the data to use consistent property names
      const normalizedData = (data || []).map((item: any) => {
        // Handle images - use utility function for consistent parsing
        // Get first image for thumbnail, but store full image data for gallery
        // For pouffes, use image column (singular), for others use images
        const imageData = category === "database_pouffes" ? item.image : item.images;
        const imageUrl = imageData ? getFirstImageUrl(imageData) : null;
        
        // Debug logging in development
        if (import.meta.env.DEV) {
          if (imageData && !imageUrl) {
            console.warn('⚠️ Image parsing failed for product:', {
              id: item.id,
              title: item.title,
              rawImages: imageData,
              imagesType: typeof imageData,
              isArray: Array.isArray(imageData)
            });
          } else if (imageUrl) {
            console.log('✅ Image parsed successfully:', {
              product: item.title,
              original: imageData,
              parsed: imageUrl
            });
          } else if (category === "database_pouffes" && !item.image) {
            console.log('ℹ️ Pouffe product has no image:', {
              product: item.title,
              id: item.id
            });
          }
        }
        
        // For sofabed, use strike_price_2seater_rs if available, otherwise use the mapped strikePrice
        const strikePrice = category === "sofabed" && item.strike_price_2seater_rs !== null && item.strike_price_2seater_rs !== undefined
          ? item.strike_price_2seater_rs
          : item[columns.strikePrice];
        
        // Ensure numeric values are properly converted
        const netPrice = item[columns.netPrice] !== null && item[columns.netPrice] !== undefined 
          ? Number(item[columns.netPrice]) 
          : null;
        const strikePriceNum = strikePrice !== null && strikePrice !== undefined 
          ? Number(strikePrice) 
          : null;
        
        return {
          id: item.id,
          title: item.title,
          images: imageUrl, // First image URL for thumbnail
          imagesData: imageData, // Full image data for gallery (can be string, array, etc.)
          netPrice: netPrice,
          strikePrice: strikePriceNum,
          discount_percent: item.discount_percent,
          discount_rs: item.discount_rs,
          bom_rs: (category === "sofabed" || category === "recliner" || category === "cinema_chairs" || category === "database_pouffes") ? undefined : item.bom_rs // bom_rs not present for these categories
        };
      });
      
      return normalizedData as Product[];
    },
    retry: 1,
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
        <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-8 tracking-tight">Product Catalog</h1>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={handleCategoryChange} className="mb-8">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="sofa">Sofas</TabsTrigger>
            <TabsTrigger value="bed">Beds</TabsTrigger>
            <TabsTrigger value="recliner">Recliners</TabsTrigger>
            <TabsTrigger value="cinema_chairs">Cinema Chairs</TabsTrigger>
            <TabsTrigger value="dining_chairs">Dining Chairs</TabsTrigger>
            <TabsTrigger value="arm_chairs">Arm Chairs</TabsTrigger>
            <TabsTrigger value="benches">Benches</TabsTrigger>
            <TabsTrigger value="kids_bed">Kids Beds</TabsTrigger>
            <TabsTrigger value="sofabed">Sofa Beds</TabsTrigger>
            <TabsTrigger value="database_pouffes">Pouffes</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive text-lg mb-2">Error loading products</p>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden luxury-card border-muted/50 animate-pulse">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50"></div>
                <CardContent className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <div className="w-full h-10 bg-muted rounded"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.map((product) => (
              <Card key={product.id} className="group overflow-hidden luxury-card border-muted/50 hover:border-gold transition-premium">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                  <img
                    src={product.images || '/placeholder.svg'}
                    alt={product.title}
                    className="w-full h-full object-cover image-zoom"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const currentSrc = target.src;
                      
                      // Log error in development
                      if (import.meta.env.DEV) {
                        console.error('❌ Image failed to load:', {
                          product: product.title,
                          attemptedUrl: product.images,
                          failedUrl: currentSrc
                        });
                      }
                      
                      // Only set placeholder if not already placeholder
                      if (!currentSrc.includes('placeholder.svg')) {
                        target.src = '/placeholder.svg';
                        target.onerror = null; // Prevent infinite loop
                      }
                    }}
                    onLoad={() => {
                      // Log successful load in development
                      if (import.meta.env.DEV && product.images) {
                        console.log('✅ Image loaded successfully:', {
                          product: product.title,
                          url: product.images
                        });
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
                    <Button className="w-full luxury-button font-semibold border-gold/30 hover:border-gold hover:bg-gold/10 hover:text-gold transition-premium">
                      Configure Now
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

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
