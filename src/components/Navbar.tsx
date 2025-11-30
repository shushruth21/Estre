import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LayoutDashboard, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
    const { user, loading, isAdmin, isStaff, isCustomer } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch cart count
    const { data: cartCount } = useQuery({
        queryKey: ["cart-count", user?.id],
        queryFn: async () => {
            if (!user) return 0;
            const { data, error } = await supabase
                .from("customer_orders")
                .select("id", { count: "exact", head: true })
                .eq("status", "draft")
                .eq("customer_email", user.email)
                .eq("saved_for_later", false);
            if (error) return 0;
            return data?.length || 0;
        },
        enabled: !!user && !loading,
        staleTime: 60 * 1000,
        placeholderData: 0,
    });

    return (
        <header className="sticky top-0 z-50 border-b border-gold/10 bg-ivory/80 backdrop-blur-md shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 lg:px-8 h-20 flex justify-between items-center">
                {/* Logo */}
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <img
                        src="/estre-logo.png"
                        alt="Estre"
                        className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex gap-6 items-center">
                    <Link to="/products">
                        <Button variant="ghost" className="text-walnut hover:text-gold hover:bg-transparent font-medium text-base transition-colors">
                            Products
                        </Button>
                    </Link>

                    {user && (
                        <Link to="/cart" className="relative">
                            <Button variant="ghost" className="text-walnut hover:text-gold hover:bg-transparent transition-colors">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount && cartCount > 0 ? (
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gold text-walnut border-0 text-xs font-bold">
                                        {cartCount}
                                    </Badge>
                                ) : null}
                            </Button>
                        </Link>
                    )}

                    <ThemeToggle />

                    {/* Role Based Actions */}
                    {user && isAdmin() && (
                        <Link to="/admin/dashboard">
                            <Button variant="outline" className="border-gold/30 text-walnut hover:border-gold hover:text-gold transition-colors">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Admin
                            </Button>
                        </Link>
                    )}

                    {!user && (
                        <Link to="/login">
                            <Button className="bg-walnut text-ivory hover:bg-gold hover:text-walnut transition-all duration-300 shadow-md hover:shadow-lg px-6">
                                {loading ? "..." : "Login"}
                            </Button>
                        </Link>
                    )}

                    {user && isCustomer() && (
                        <Link to="/dashboard">
                            <Button variant="ghost" className="text-walnut hover:text-gold">Dashboard</Button>
                        </Link>
                    )}

                    {user && (
                        <Button
                            variant="ghost"
                            className="text-walnut hover:text-red-600 hover:bg-red-50"
                            onClick={async () => {
                                const { supabase } = await import("@/integrations/supabase/client");
                                await supabase.auth.signOut();
                                window.location.href = "/";
                            }}
                        >
                            Logout
                        </Button>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center gap-2">
                    {user && (
                        <Link to="/cart" className="relative mr-2">
                            <Button variant="ghost" size="icon" className="text-walnut">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount && cartCount > 0 ? (
                                    <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-gold text-walnut text-[10px]">
                                        {cartCount}
                                    </Badge>
                                ) : null}
                            </Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-walnut">
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gold/10 bg-ivory/95 backdrop-blur-xl absolute w-full left-0 shadow-xl animate-accordion-down">
                    <div className="container mx-auto px-4 py-6 space-y-4 flex flex-col">
                        <Link to="/products" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-lg font-medium text-walnut hover:text-gold">Products</Button>
                        </Link>
                        {user && isAdmin() && (
                            <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start text-lg font-medium text-walnut hover:text-gold">Admin Panel</Button>
                            </Link>
                        )}
                        {!user && (
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full bg-walnut text-ivory hover:bg-gold hover:text-walnut">Login</Button>
                            </Link>
                        )}
                        {user && (
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-lg font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={async () => {
                                    const { supabase } = await import("@/integrations/supabase/client");
                                    await supabase.auth.signOut();
                                    window.location.href = "/";
                                }}
                            >
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};
