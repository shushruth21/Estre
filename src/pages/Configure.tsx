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
import SofaBedConfigurator from "@/components/configurators/SofaBedConfigurator";
import PricingSummary from "@/components/configurators/PricingSummary";
import KidsBedConfigurator from "@/components/configurators/KidsBedConfigurator";
import PouffeConfigurator from "@/components/configurators/PouffeConfigurator";

const Configure = () => {
  const { category, productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [configuration, setConfiguration] = useState<any>({});
  const [pricing, setPricing] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      // Handle special case for database_pouffes which already includes '_database' in the name
      const tableName = category === "database_pouffes" ? "database_pouffes" : `${category}_database`;
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("id", productId)
        .single() as any;

      if (error) throw error;
      
      // Keep original image data - ProductImageGallery will parse it
      // This preserves arrays, strings, comma-separated, JSON arrays, etc.
      // No normalization needed - ProductImageGallery handles all formats
      
      return data;
    },
    enabled: !!category && !!productId,
  });

  // Real-time price calculation with debouncing
  const calculatePrice = async () => {
    if (!category || !productId || !configuration.productId) return;

    setIsCalculating(true);
    try {
      const result = await calculateDynamicPrice(category, productId, configuration);
      setPricing({ 
        total: result.total,
        breakdown: result.breakdown
      });
    } catch (error: any) {
      // Don't show toast for calculation errors during typing - only show final error
      if (import.meta.env.DEV) {
        console.error("Price calculation error:", error);
        console.warn("Price calculation failed:", error.message);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Real-time price calculation with debouncing
  useEffect(() => {
    if (!configuration.productId || !category || !productId) {
      setPricing(null);
      return;
    }

    // Debounce price calculation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      calculatePrice();
    }, 800); // 800ms debounce - increased for better performance

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuration, category, productId]);

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

    setIsAddingToCart(true);

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
      console.error("Add to cart error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
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
      <header className="border-b bg-background/95 backdrop-blur-sm glass-panel sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto container-spacing py-4">
          <div className="flex items-center justify-between">
            <Link to={`/products?category=${category}`}>
              <Button variant="ghost" size="sm" className="luxury-button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
            <h1 className="text-xl lg:text-2xl font-serif font-bold">Configure: {product.title}</h1>
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

      <div className="container mx-auto container-spacing py-8 lg:py-12">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Product Gallery */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <ProductImageGallery 
                images={category === "database_pouffes" ? product?.image : product?.images || null}
                productTitle={product.title}
              />
              
              <Card className="luxury-card-glass border-muted/50">
                <CardContent className="p-6 lg:p-8">
                  <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-3">
                    {product.title}
                  </h2>
                  <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                    Customize every detail to match your vision and create timeless elegance
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <Card className="luxury-card-glass border-muted/50">
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-2xl lg:text-3xl">Product Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                {category === "sofabed" && (
                  <SofaBedConfigurator
                    product={product}
                    configuration={configuration}
                    pricing={pricing}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "kids_bed" && (
                  <KidsBedConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
                {category === "database_pouffes" && (
                  <PouffeConfigurator
                    product={product}
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="luxury-card-glass border-muted/50">
                <PricingSummary
                  pricing={pricing}
                  isCalculating={isCalculating}
                  onAddToCart={handleAddToCart}
                  configuration={configuration}
                  isAddingToCart={isAddingToCart}
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
