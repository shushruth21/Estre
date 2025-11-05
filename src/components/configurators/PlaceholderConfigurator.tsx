import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PlaceholderConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
  categoryName: string;
}

const PlaceholderConfigurator = ({ 
  product, 
  configuration, 
  onConfigurationChange, 
  categoryName 
}: PlaceholderConfiguratorProps) => {
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: categoryName,
        note: "Configurator coming soon",
      });
    }
  }, [product.id, configuration.productId, onConfigurationChange, categoryName]);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configurator Coming Soon</AlertTitle>
        <AlertDescription>
          The configurator for {categoryName.replace(/_/g, ' ')} is currently under development. 
          Please contact us directly for custom configuration options.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">{product.title}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Category:</strong> {categoryName.replace(/_/g, ' ')}</p>
          {product.net_price_rs && (
            <p><strong>Base Price:</strong> ₹{product.net_price_rs.toLocaleString()}</p>
          )}
          <p className="mt-4">
            For custom configuration, please reach out to our sales team:
          </p>
          <p><strong>Phone:</strong> +91 87 22 200 100</p>
          <p><strong>Email:</strong> support@estre.in</p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderConfigurator;
