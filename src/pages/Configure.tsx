import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import SofaBedConfigurator from "@/components/configurators/SofaBedConfigurator";
import PricingSummary from "@/components/configurators/PricingSummary";
import KidsBedConfigurator from "@/components/configurators/KidsBedConfigurator";
import PouffeConfigurator from "@/components/configurators/PouffeConfigurator";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface ConfigureProps {
  category?: string;
  productId?: string;
}

const Configure = ({ category: propCategory, productId: propProductId }: ConfigureProps = {}) => {
  const params = useParams();
  const category = propCategory || params.category;
  const productId = propProductId || params.productId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [configuration, setConfiguration] = useState<any>({});
  const [pricing, setPricing] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", category, productId],
    queryFn: async () => {
      const tableName = category === "database_pouffes" ? "database_pouffes" : `${category}_database`;
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("id", productId)
        .single() as any;

      if (error) throw error;
      return data;
    },
    enabled: !!category && !!productId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

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
      if (import.meta.env.DEV) {
        console.error("Price calculation error:", error);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (!configuration.productId || !category || !productId) {
      setPricing(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      calculatePrice();
    }, 800);

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
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-walnut">Product not found</h2>
          <Link to="/products">
            <Button variant="luxury">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory font-sans text-walnut">
      <Navbar />

      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link to={`/products?category=${category}`}>
            <Button variant="ghost" size="sm" className="text-walnut hover:text-gold hover:bg-transparent pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          {pricing && (
            <div className="text-right md:hidden">
              <p className="text-xs text-walnut/60">Total</p>
              <p className="text-lg font-bold text-gold">
                ₹{Math.round(pricing.total).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Product Gallery & Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="sticky top-24 space-y-8">
              <ProductImageGallery
                images={category === "database_pouffes" ? product?.image : product?.images || null}
                productTitle={product.title}
              />

              <div className="space-y-4">
                <h1 className="font-serif text-4xl lg:text-5xl font-bold text-walnut">
                  {product.title}
                </h1>
                <p className="text-walnut/70 text-lg leading-relaxed font-light">
                  Customize every detail to match your vision and create timeless elegance.
                </p>
              </div>

              {/* Configuration Panel */}
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="font-serif text-2xl text-walnut border-b border-gold/20 pb-2">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  {category === "sofa" && <SofaConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "bed" && <BedConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "recliner" && <ReclinerConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "cinema_chairs" && <CinemaChairConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "dining_chairs" && <DiningChairConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "arm_chairs" && <ArmChairConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "benches" && <BenchConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "sofabed" && <SofaBedConfigurator product={product} configuration={configuration} pricing={pricing} onConfigurationChange={setConfiguration} />}
                  {category === "kids_bed" && <KidsBedConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                  {category === "database_pouffes" && <PouffeConfigurator product={product} configuration={configuration} onConfigurationChange={setConfiguration} />}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pricing Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
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

      <Footer />
    </div>
  );
};

export default Configure;
