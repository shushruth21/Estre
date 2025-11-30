import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { getFirstImageUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface FabricPreviewProps {
    fabricCode?: string;
    className?: string;
    showDetails?: boolean;
    compact?: boolean;
}

export const FabricPreview = ({
    fabricCode,
    className,
    showDetails = true,
    compact = false
}: FabricPreviewProps) => {
    const { data: fabricDetails, isLoading } = useQuery({
        queryKey: ["fabric-details", fabricCode],
        queryFn: async () => {
            if (!fabricCode) return null;
            const { data, error } = await supabase
                .from("fabric_coding")
                .select("*")
                .eq("estre_code", fabricCode)
                .single();

            if (error) return null;
            return data;
        },
        enabled: !!fabricCode,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    if (!fabricCode) return null;

    if (isLoading) {
        return (
            <div className={cn("flex items-center gap-2 p-2 rounded-lg bg-muted/30", className)}>
                <div className="h-10 w-10 rounded-md bg-muted animate-pulse flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
                {showDetails && (
                    <div className="space-y-1">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    </div>
                )}
            </div>
        );
    }

    if (!fabricDetails) {
        return (
            <div className={cn("flex items-center gap-2 p-2 rounded-lg bg-muted/30", className)}>
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    N/A
                </div>
                {showDetails && (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Fabric not found</span>
                        <span className="text-xs text-muted-foreground">{fabricCode}</span>
                    </div>
                )}
            </div>
        );
    }

    const fabricImageUrl = getFirstImageUrl(fabricDetails.colour_link) || getFirstImageUrl(fabricDetails.colour);

    return (
        <div className={cn(
            "flex items-center gap-3 rounded-lg border border-border/50 bg-card/50",
            compact ? "p-1.5" : "p-2",
            className
        )}>
            <div
                className={cn(
                    "rounded-md border border-border shadow-sm flex-shrink-0 bg-cover bg-center",
                    compact ? "w-8 h-8" : "w-12 h-12"
                )}
                style={{
                    backgroundColor: fabricDetails.colour_link || `hsl(${(fabricDetails.estre_code.charCodeAt(0) || 0) % 360}, 70%, 75%)`,
                    backgroundImage: fabricImageUrl ? `url(${fabricImageUrl})` : undefined
                }}
            />

            {showDetails && (
                <div className="flex flex-col min-w-0">
                    <span className={cn(
                        "font-semibold truncate",
                        compact ? "text-xs" : "text-sm"
                    )}>
                        {fabricDetails.description || fabricDetails.colour || "Fabric"}
                    </span>
                    <Badge variant="outline" className={cn(
                        "w-fit px-1.5 font-mono text-muted-foreground border-border/50",
                        compact ? "text-[9px] h-4" : "text-[10px] h-5"
                    )}>
                        {fabricDetails.estre_code}
                    </Badge>
                </div>
            )}
        </div>
    );
};
