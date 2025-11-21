import { Shield, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SecurityIndicatorProps {
  variant?: "default" | "compact";
  showBadges?: boolean;
}

export const SecurityIndicator = ({
  variant = "default",
  showBadges = true
}: SecurityIndicatorProps) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden="true" />
        <span>Secure Connection</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-green-600 dark:text-green-500" aria-hidden="true" />
        <span className="font-medium">Your connection is secure</span>
      </div>

      {showBadges && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 text-xs border-green-600/30 bg-green-50 dark:bg-green-950/30">
            <CheckCircle2 className="h-3 w-3 text-green-600" aria-hidden="true" />
            <span className="text-green-800 dark:text-green-400">256-bit SSL</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-xs border-blue-600/30 bg-blue-50 dark:bg-blue-950/30">
            <CheckCircle2 className="h-3 w-3 text-blue-600" aria-hidden="true" />
            <span className="text-blue-800 dark:text-blue-400">GDPR Compliant</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-xs border-purple-600/30 bg-purple-50 dark:bg-purple-950/30">
            <CheckCircle2 className="h-3 w-3 text-purple-600" aria-hidden="true" />
            <span className="text-purple-800 dark:text-purple-400">SOC 2 Type II</span>
          </Badge>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground px-4">
        We protect your personal information with industry-standard encryption
      </p>
    </div>
  );
};
