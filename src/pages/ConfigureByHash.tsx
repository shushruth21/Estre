import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Configure from "./Configure";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConfigureByHash = () => {
    const { hash } = useParams();

    const { data, isLoading, error } = useQuery({
        queryKey: ["product-hash", hash],
        queryFn: async () => {
            if (!hash) throw new Error("No hash provided");

            const { data, error } = await supabase
                .from("product_urls" as any)
                .select("category, product_id")
                .eq("hash", hash)
                .single() as any;

            if (error) throw error;
            return data;
        },
        enabled: !!hash,
        staleTime: 60 * 60 * 1000, // Cache for 1 hour
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ivory">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ivory">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-walnut">Product not found</h2>
                    <p className="text-muted-foreground mb-6">The link you followed may be invalid or expired.</p>
                    <Link to="/products">
                        <Button variant="luxury">Browse Products</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return <Configure category={data.category} productId={data.product_id} />;
};

export default ConfigureByHash;
