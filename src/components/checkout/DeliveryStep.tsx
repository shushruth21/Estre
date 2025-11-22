import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

interface DeliveryStepProps {
  address: DeliveryAddress;
  onAddressChange: (address: DeliveryAddress) => void;
  expectedDeliveryDate?: Date;
  onDateChange: (date?: Date) => void;
  specialInstructions?: string;
  onInstructionsChange: (instructions: string) => void;
  buyerGst?: string;
  onBuyerGstChange?: (gst: string) => void;
  dispatchMethod?: string;
  onDispatchMethodChange?: (method: string) => void;
}

export const DeliveryStep = ({
  address,
  onAddressChange,
  expectedDeliveryDate,
  onDateChange,
  specialInstructions,
  onInstructionsChange,
  buyerGst,
  onBuyerGstChange,
  dispatchMethod,
  onDispatchMethodChange,
}: DeliveryStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Address</CardTitle>
          <CardDescription>Where should we deliver your order?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => onAddressChange({ ...address, street: e.target.value })}
              placeholder="House no., Street name"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => onAddressChange({ ...address, city: e.target.value })}
                placeholder="City"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => onAddressChange({ ...address, state: e.target.value })}
                placeholder="State"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                value={address.pincode}
                onChange={(e) => onAddressChange({ ...address, pincode: e.target.value })}
                placeholder="Pincode"
                maxLength={6}
                required
              />
            </div>
            <div>
              <Label htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                value={address.landmark}
                onChange={(e) => onAddressChange({ ...address, landmark: e.target.value })}
                placeholder="Nearby landmark"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>GST and dispatch details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="buyerGst">Buyer GST Number (Optional)</Label>
            <Input
              id="buyerGst"
              value={buyerGst || ""}
              onChange={(e) => onBuyerGstChange?.(e.target.value)}
              placeholder="GSTIN (e.g., 29ABCDE1234F1Z5)"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your GST number if you need a GST invoice
            </p>
          </div>

          <div>
            <Label htmlFor="dispatchMethod">Dispatch Method</Label>
            <Select
              value={dispatchMethod || "Safe Express"}
              onValueChange={(value) => onDispatchMethodChange?.(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dispatch method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Safe Express">Safe Express</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Schedule</CardTitle>
          <CardDescription>When would you like to receive your order?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Expected Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expectedDeliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expectedDeliveryDate ? format(expectedDeliveryDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expectedDeliveryDate}
                  onSelect={onDateChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              value={specialInstructions}
              onChange={(e) => onInstructionsChange(e.target.value)}
              placeholder="Any special delivery instructions..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
