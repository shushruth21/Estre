import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyOrderOTP() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!id || !otp || otp.length !== 6) {
            toast({
                title: "Invalid OTP",
                description: "Please enter a valid 6-digit OTP",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke("verify-sale-order-otp", {
                body: {
                    saleOrderId: id,
                    otpCode: otp,
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setIsVerified(true);
            toast({
                title: "Order Confirmed!",
                description: "Your order has been confirmed successfully. Job cards are being prepared for production.",
            });

            // Redirect to a success page after 3 seconds
            setTimeout(() => {
                navigate("/");
            }, 3000);

        } catch (error: any) {
            console.error("OTP verification error:", error);
            toast({
                title: "Verification Failed",
                description: error.message || "Invalid or expired OTP. Please check your email for the correct code.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-ivory via-white to-gold/10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-gold/30">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto mb-4 flex justify-center">
                        <img src="/brand-logo.png" alt="Estre" className="h-16 w-auto object-contain" />
                    </div>
                    <CardTitle className="text-2xl font-serif text-walnut">
                        {isVerified ? "Order Confirmed" : "Verify Your Order"}
                    </CardTitle>
                    <CardDescription>
                        {isVerified
                            ? "Thank you for confirming your order!"
                            : "Enter the 6-digit OTP sent to your email"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isVerified ? (
                        <div className="text-center space-y-6 py-8">
                            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-green-900">
                                    Your order has been confirmed!
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Our production team will begin work on your custom furniture.
                                    You'll receive updates on your order progress via email.
                                </p>
                            </div>
                            <Button onClick={() => navigate("/")} className="w-full">
                                Return to Home
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-2xl font-mono tracking-widest"
                                    disabled={isLoading}
                                    autoFocus
                                    autoComplete="one-time-code"
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                    Check your email for the 6-digit verification code
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="w-full py-6"
                                variant="luxury"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                        Verify & Confirm Order
                                    </>
                                )}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                <p>Didn't receive the OTP?</p>
                                <button
                                    type="button"
                                    className="text-gold hover:text-gold-dark font-semibold underline-offset-4 hover:underline"
                                    onClick={() => {
                                        toast({
                                            title: "Contact Support",
                                            description: "Please contact our team at support@estre.in for assistance",
                                        });
                                    }}
                                >
                                    Contact Support
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
