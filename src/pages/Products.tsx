import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
      
      // Using dynamic table names with Supabase requires runtime querying
      const { data, error } = await supabase
        .from(getCategoryTableName(category) as any)
        .select(`id, title, images, ${columns.netPrice}, ${columns.strikePrice}, discount_percent, discount_rs`)
        .eq("is_active", true)
        .order("created_at", { ascending: false }) as any;

      if (error) throw error;
      
      // Normalize the data to use consistent property names
      const normalizedData = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        images: item.images,
        netPrice: item[columns.netPrice],
        strikePrice: item[columns.strikePrice],
        discount_percent: item.discount_percent,
        discount_rs: item.discount_rs
      }));
      
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
        <h1 className="text-4xl font-bold mb-8">Product Catalog</h1>

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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.map((product) => (
              <Card key={product.id} className="group overflow-hidden luxury-card border-muted/50">
                {product.images && (
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                    <img
                      src={product.images}
                      alt={product.title}
                      className="w-full h-full object-cover image-zoom"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-2xl font-serif font-semibold tracking-tight group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  
                  <div className="flex items-baseline gap-3">
                    {product.netPrice && (
                      <p className="text-3xl font-bold text-foreground">
                        ₹{product.netPrice.toLocaleString()}
                      </p>
                    )}
                    {product.strikePrice && (
                      <span className="text-lg line-through text-muted-foreground">
                        ₹{product.strikePrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {product.discount_percent && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                      Save {product.discount_percent}%
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Link to={`/configure/${category}/${product.id}`} className="w-full">
                    <Button className="w-full luxury-button font-semibold">
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
