/**
 * DiscountCodeSelector Component
 * 
 * Dropdown component to select and apply active discount codes.
 * Used in checkout and staff order management.
 * 
 * Usage:
 * ```tsx
 * <DiscountCodeSelector
 *   onApply={(code) => handleApplyDiscount(code)}
 *   disabled={isLoading}
 * />
 * ```
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag } from "lucide-react";

interface DiscountCode {
  code: string;
  label: string;
  percent: number;
  type: "percent" | "fixed";
  value: number;
  is_active: boolean;
  description?: string;
}

interface DiscountCodeSelectorProps {
  onApply: (code: string) => void;
  disabled?: boolean;
  selectedCode?: string;
  showLabel?: boolean;
}

export function DiscountCodeSelector({
  onApply,
  disabled = false,
  selectedCode,
  showLabel = true,
}: DiscountCodeSelectorProps) {
  const [selectedDiscountCode, setSelectedDiscountCode] = useState<string>(
    selectedCode || ""
  );

  // Fetch active discount codes
  const { data: discountCodes, isLoading } = useQuery({
    queryKey: ["discount-codes", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("is_active", true)
        .order("percent", { ascending: true });

      if (error) throw error;
      return (data || []) as DiscountCode[];
    },
  });

  const handleApply = () => {
    if (selectedDiscountCode) {
      onApply(selectedDiscountCode);
      setSelectedDiscountCode("");
    }
  };

  const selectedDiscount = discountCodes?.find(
    (dc) => dc.code === selectedDiscountCode
  );

  return (
    <div className="space-y-3">
      {showLabel && (
        <Label className="text-sm font-semibold">Discount Code</Label>
      )}
      <div className="flex gap-2">
        <Select
          value={selectedDiscountCode}
          onValueChange={setSelectedDiscountCode}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select discount code" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                Loading codes...
              </SelectItem>
            ) : discountCodes && discountCodes.length > 0 ? (
              discountCodes.map((code) => (
                <SelectItem key={code.code} value={code.code}>
                  <div className="flex items-center justify-between w-full">
                    <span>{code.label || code.code}</span>
                    <Badge variant="outline" className="ml-2">
                      {code.type === "percent"
                        ? `${code.percent}%`
                        : `₹${code.value}`}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-codes" disabled>
                No active discount codes available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={handleApply}
          disabled={disabled || isLoading || !selectedDiscountCode}
          className="shrink-0"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Tag className="mr-2 h-4 w-4" />
              Apply
            </>
          )}
        </Button>
      </div>
      {selectedDiscount && (
        <div className="text-sm text-muted-foreground">
          <p>
            Discount:{" "}
            <span className="font-medium text-primary">
              {selectedDiscount.type === "percent"
                ? `${selectedDiscount.percent}%`
                : `₹${selectedDiscount.value}`}
            </span>
          </p>
          {selectedDiscount.description && (
            <p className="text-xs mt-1">{selectedDiscount.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

