import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";

type Product = {
  id: string;
  title: string;
  images?: string | null;
  net_price_rs?: number | null;
  strike_price_1seater_rs?: number | null;
  strike_price_rs?: number | null;
  discount_percent?: number | null;
};

const Products = () => {
  const [category, setCategory] = useState<string>("sofa");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      // Using dynamic table names with Supabase requires runtime querying
      const { data, error } = await supabase
        .from(`${category}_database` as any)
        .select("id, title, images, net_price_rs, strike_price_1seater_rs, strike_price_rs, discount_percent")
        .eq("is_active", true)
        .order("created_at", { ascending: false }) as any;

      if (error) throw error;
      return (data || []) as Product[];
    },
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
        <Tabs value={category} onValueChange={setCategory} className="mb-8">
          <TabsList>
            <TabsTrigger value="sofa">Sofas</TabsTrigger>
            <TabsTrigger value="bed">Beds</TabsTrigger>
            <TabsTrigger value="recliner">Recliners</TabsTrigger>
            <TabsTrigger value="cinema_chairs">Cinema Chairs</TabsTrigger>
            <TabsTrigger value="dining_chairs">Dining Chairs</TabsTrigger>
            <TabsTrigger value="arm_chairs">Arm Chairs</TabsTrigger>
            <TabsTrigger value="benches">Benches</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-smooth">
                {product.images && (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <img
                      src={product.images}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                  {product.net_price_rs && (
                    <p className="text-2xl font-bold text-primary mb-2">
                      ₹{product.net_price_rs.toLocaleString()}
                    </p>
                  )}
                  {(product.strike_price_1seater_rs || product.strike_price_rs) && product.discount_percent && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-muted-foreground">
                        ₹{(product.strike_price_1seater_rs || product.strike_price_rs || 0).toLocaleString()}
                      </span>
                      <span className="text-success font-semibold">
                        {product.discount_percent}% OFF
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Link to={`/configure/${category}/${product.id}`} className="w-full">
                    <Button className="w-full">Configure</Button>
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
