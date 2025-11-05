import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, ShoppingCart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateDynamicPrice } from "@/lib/dynamic-pricing";
import ProductImageGallery from "@/components/ui/ProductImageGallery";
import SofaConfigurator from "@/components/configurators/SofaConfigurator";
import BedConfigurator from "@/components/configurators/BedConfigurator";
import ReclinerConfigurator from "@/components/configurators/ReclinerConfigurator";
import CinemaChairConfigurator from "@/components/configurators/CinemaChairConfigurator";
import DiningChairConfigurator from "@/components/configurators/DiningChairConfigurator";
import ArmChairConfigurator from "@/components/configurators/ArmChairConfigurator";
import BenchConfigurator from "@/components/configurators/BenchConfigurator";
import PlaceholderConfigurator from "@/components/configurators/PlaceholderConfigurator";
import PricingSummary from "@/components/configurators/PricingSummary";

const Configure = () => {
  const { category, productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [configuration, setConfiguration] = useState<any>({});
  const [pricing, setPricing] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const tableName = `${category}_database` as any;
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", productId)
        .single() as any;

      if (error) throw error;
      return data;
    },
    enabled: !!category && !!productId,
  });

  // Recalculate price when configuration changes
  useEffect(() => {
    if (configuration.productId && category && productId) {
      calculatePrice();
    }
  }, [configuration, category, productId]);

  const calculatePrice = async () => {
    if (!category || !productId || !configuration.productId) return;

    setIsCalculating(true);
    try {
      const totalPrice = await calculateDynamicPrice(category, productId, configuration);
      setPricing({ 
        total: totalPrice,
        breakdown: {
          basePrice: totalPrice,
          fabricCost: 0, // Can be extracted from calculation if needed
          adjustments: 0,
        }
      });
    } catch (error: any) {
      console.error("Price calculation error:", error);
      toast({
        title: "Calculation Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
      });
      navigate("/login");
      return;
    }

    // Save to customer_orders table
    try {
      const { error } = await supabase.from("customer_orders").insert({
        customer_name: user.user_metadata?.full_name || user.email,
        customer_email: user.email,
        product_id: productId,
        product_type: category,
        configuration,
        calculated_price: pricing?.total || 0,
        status: "draft",
        order_number: `DRAFT-${Date.now()}`,
      });

      if (error) throw error;

      toast({
        title: "Added to Cart",
        description: "Configuration saved successfully",
      });

      navigate("/cart");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={`/products?category=${category}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Configure: {product.title}</h1>
            <div className="flex items-center gap-4">
              {pricing && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{Math.round(pricing.total).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Product Gallery */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <ProductImageGallery 
                images={product.images}
                productTitle={product.title}
              />
              
              <Card className="mt-4 luxury-card border-muted/50">
                <CardContent className="p-6">
                  <h2 className="font-serif text-3xl font-bold mb-2">
                    {product.title}
                  </h2>
                  <p className="text-muted-foreground">
                    Customize every detail to match your vision
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <Card className="luxury-card border-muted/50">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Product Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {category === "sofa" && (
                  <SofaConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "bed" && (
                  <BedConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "recliner" && (
                  <ReclinerConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "cinema_chairs" && (
                  <CinemaChairConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "dining_chairs" && (
                  <DiningChairConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "arm_chairs" && (
                  <ArmChairConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "benches" && (
                  <BenchConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {(category === "kids_bed" || category === "sofabed" || category === "database_pouffes") && (
                  <PlaceholderConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                    categoryName={category}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="luxury-card border-muted/50">
                <PricingSummary
                  pricing={pricing}
                  isCalculating={isCalculating}
                  onAddToCart={handleAddToCart}
                  configuration={configuration}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configure;
