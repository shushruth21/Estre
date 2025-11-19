import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Sofa, Bed, Armchair, ChevronRight, MonitorPlay, UtensilsCrossed, Baby, SofaIcon, Box, Sparkles, Palette, Zap, LayoutDashboard, ShoppingCart, Menu, X, Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const { user, role, loading, isAdmin, isStaff, isCustomer } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch cart count
  const { data: cartCount } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("customer_orders")
        .select("id", { count: "exact" })
        .eq("status", "draft")
        .eq("customer_email", user.email)
        .eq("saved_for_later", false);
      if (error) return 0;
      return data?.length || 0;
    },
    enabled: !!user,
  });

  // Redirect admins and staff to their dashboards if they land on homepage
  useEffect(() => {
    if (!loading && user && role) {
      // Use normalized role helpers
      if (isAdmin()) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      if (isStaff()) {
        navigate("/staff/dashboard", { replace: true });
        return;
      }
      // Customers can stay on homepage
    }
  }, [user, loading, role, isAdmin, isStaff, navigate]);
  const categories = [
    {
      icon: Sofa,
      title: "Sofas",
      description: "Customize your perfect sofa with premium fabrics",
      link: "/products?category=sofa",
      gradient: "bg-gradient-to-br from-primary to-primary/80"
    },
    {
      icon: Bed,
      title: "Beds",
      description: "Design your dream bed with luxury finishes",
      link: "/products?category=bed",
      gradient: "bg-gradient-to-br from-secondary to-secondary/80"
    },
    {
      icon: Armchair,
      title: "Recliners",
      description: "Create your comfort zone with custom recliners",
      link: "/products?category=recliner",
      gradient: "bg-gradient-to-br from-accent to-accent/80"
    },
    {
      icon: MonitorPlay,
      title: "Cinema Chairs",
      description: "Premium theater seating for home entertainment",
      link: "/products?category=cinema_chairs",
      gradient: "bg-gradient-to-br from-purple-600 to-purple-700"
    },
    {
      icon: UtensilsCrossed,
      title: "Dining Chairs",
      description: "Elegant seating for memorable meals",
      link: "/products?category=dining_chairs",
      gradient: "bg-gradient-to-br from-green-600 to-green-700"
    },
    {
      icon: Armchair,
      title: "Arm Chairs",
      description: "Comfortable accent seating pieces",
      link: "/products?category=arm_chairs",
      gradient: "bg-gradient-to-br from-blue-600 to-blue-700"
    },
    {
      icon: Box,
      title: "Benches",
      description: "Versatile seating with storage options",
      link: "/products?category=benches",
      gradient: "bg-gradient-to-br from-teal-600 to-teal-700"
    },
    {
      icon: Baby,
      title: "Kids Beds",
      description: "Safe and fun beds for children",
      link: "/products?category=kids_bed",
      gradient: "bg-gradient-to-br from-pink-600 to-pink-700"
    },
    {
      icon: SofaIcon,
      title: "Sofa Beds",
      description: "Dual-purpose comfort and convenience",
      link: "/products?category=sofabed",
      gradient: "bg-gradient-to-br from-indigo-600 to-indigo-700"
    },
    {
      icon: Box,
      title: "Pouffes",
      description: "Stylish footrests and accent pieces",
      link: "/products?category=database_pouffes",
      gradient: "bg-gradient-to-br from-orange-600 to-orange-700"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gold/20 bg-background/95 backdrop-blur-md glass-panel shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              {/* Logo placeholder - will be replaced with actual logo */}
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-lg group-hover:shadow-xl transition-premium">
                <span className="text-white font-bold text-xl font-luxury">E</span>
              </div>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground group-hover:text-gold transition-colors">Estre</h1>
          </Link>
          <div className="hidden md:flex gap-3 items-center">
            <Link to="/products">
              <Button variant="ghost" className="font-medium hover:text-gold transition-colors">Products</Button>
            </Link>
            {!loading && user && (
              <Link to="/cart" className="relative">
                <Button variant="ghost" className="font-medium hover:text-gold transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount && cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gold text-white border-0 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <ThemeToggle />
            {!loading && user && isAdmin() && (
              <Link to="/admin/dashboard">
                <Button variant="outline" className="font-medium border-gold/30 hover:border-gold hover:text-gold transition-colors">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
            {!user && (
              <Link to="/login">
                <Button className="luxury-button bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium">
                  {loading ? "Loading..." : "Login"}
                </Button>
              </Link>
            )}
            {!loading && user && isCustomer() && (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" className="font-medium border-gold/30 hover:border-gold hover:text-gold transition-colors">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" className="font-medium hover:text-gold transition-colors">
                    Switch Account
                  </Button>
                </Link>
              </>
            )}
            {!loading && user && isStaff() && !isAdmin() && (
              <Link to="/login">
                <Button variant="ghost" className="font-medium hover:text-gold transition-colors">
                  Switch Account
                </Button>
              </Link>
            )}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {!loading && user && (
              <Link to="/cart" className="relative mr-2">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount && cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gold text-white border-0 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gold/20 bg-background/98 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Link to="/products" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start font-medium">Products</Button>
              </Link>
              {!loading && user && (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-medium">Dashboard</Button>
                </Link>
              )}
              {!loading && user && isAdmin() && (
                <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-medium">Admin Panel</Button>
                </Link>
              )}
              {!loading && user && isStaff() && (
                <Link to="/staff/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start font-medium">Staff Dashboard</Button>
                </Link>
              )}
              {!loading && !user && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full luxury-button bg-gradient-gold text-white">Login</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        {/* Full-bleed background image placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary">
          <div className="absolute inset-0 bg-[url('/placeholder-hero.jpg')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-background"></div>
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        {/* Gold accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent"></div>
        
        <div className="container mx-auto container-spacing text-center relative z-10 animate-fade-in">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-5xl sm:text-6xl lg:text-8xl font-serif font-bold mb-6 tracking-tight text-foreground animate-slide-up">
              Craft Your
              <span className="block text-gold mt-4 bg-gradient-to-r from-gold to-gold-dark bg-clip-text text-transparent">
                Perfect Space
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Bespoke furniture designed with precision, crafted with passion. 
              Customize every detail to match your vision and create timeless elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <Link to="/products">
                <Button size="lg" className="text-lg px-12 py-7 luxury-button bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium">
                  Begin Your Journey
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/products?category=sofa">
                <Button size="lg" variant="outline" className="text-lg px-12 py-7 luxury-button border-gold/50 text-gold hover:bg-gold/10 hover:border-gold transition-premium">
                  Explore Collections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="section-spacing bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto container-spacing">
          <div className="text-center mb-20">
            <h3 className="text-4xl lg:text-6xl font-serif font-bold mb-6">
              Browse by Category
            </h3>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore our curated collection of premium furniture designed for every space and lifestyle
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <Link key={index} to={category.link}>
                <Card className="group luxury-card-glass cursor-pointer overflow-hidden h-full border-muted/50 hover:border-gold transition-premium image-zoom">
                  <div 
                    className={`p-8 lg:p-10 ${category.gradient} relative min-h-[280px] flex items-center justify-center`}
                  >
                    <div className="flex flex-col items-center text-center space-y-5 relative z-10">
                      <div className="p-5 bg-white/95 dark:bg-primary/20 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-premium shadow-lg glass-card border-gold/20 group-hover:border-gold">
                        <category.icon className="h-12 w-12 lg:h-14 lg:w-14 text-primary group-hover:text-gold transition-colors" />
                      </div>
                      <h4 className="text-xl lg:text-2xl font-serif font-bold text-white drop-shadow-lg">{category.title}</h4>
                      <p className="text-white/95 font-medium drop-shadow text-sm lg:text-base">{category.description}</p>
                      <p className="text-xs text-white/80 uppercase tracking-wider mt-2">Customize your way</p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-premium"></div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-6 w-6 text-gold" />
                    </div>
                    {/* Gold border on hover */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold/50 transition-premium rounded-xl"></div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto container-spacing">
          <div className="text-center mb-20">
            <h3 className="text-4xl lg:text-6xl font-serif font-bold mb-6">
              Why Choose Estre?
            </h3>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience unparalleled craftsmanship and service that transforms your vision into reality
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            <Card className="luxury-card-glass p-8 lg:p-10 text-center border-muted/50 hover:border-gold transition-premium">
              <div className="inline-flex p-5 bg-gold/10 rounded-2xl mb-6 glass-panel border-gold/20">
                <Sparkles className="h-10 w-10 text-gold" />
              </div>
              <h4 className="text-2xl lg:text-3xl font-serif font-bold mb-4">Premium Materials</h4>
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                Only the finest materials and fabrics sourced globally for lasting quality and comfort
              </p>
            </Card>
            <Card className="luxury-card-glass p-8 lg:p-10 text-center border-muted/50 hover:border-gold transition-premium">
              <div className="inline-flex p-5 bg-gold/10 rounded-2xl mb-6 glass-panel border-gold/20">
                <Palette className="h-10 w-10 text-gold" />
              </div>
              <h4 className="text-2xl lg:text-3xl font-serif font-bold mb-4">Custom Design</h4>
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                Personalize every aspect to match your unique style and space requirements
              </p>
            </Card>
            <Card className="luxury-card-glass p-8 lg:p-10 text-center border-muted/50 hover:border-gold transition-premium">
              <div className="inline-flex p-5 bg-gold/10 rounded-2xl mb-6 glass-panel border-gold/20">
                <Zap className="h-10 w-10 text-gold" />
              </div>
              <h4 className="text-2xl lg:text-3xl font-serif font-bold mb-4">Expert Craftsmanship</h4>
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                Meticulous attention to detail with decades of furniture-making expertise
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/20 bg-gradient-to-b from-background to-muted/30 py-16 lg:py-20">
        <div className="container mx-auto container-spacing">
          <div className="grid md:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* Logo and Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl font-luxury">E</span>
                </div>
                <h3 className="text-2xl font-serif font-bold">Estre</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Crafting exceptional furniture experiences since inception. Your vision, our expertise.
              </p>
            </div>
            
            {/* Navigation Links */}
            <div>
              <h4 className="font-serif font-bold mb-4 text-gold">Navigation</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/products" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=sofa" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                    Sofas
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=bed" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                    Beds
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=recliner" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                    Recliners
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contact Information */}
            <div>
              <h4 className="font-serif font-bold mb-4 text-gold">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Near Dhoni Public School</li>
                <li>AECS Layout-A Block</li>
                <li>Bengaluru - 560 068</li>
                <li className="pt-2">
                  <a href="tel:+918722200100" className="hover:text-gold transition-colors">
                    +91 87 22 200 100
                  </a>
                </li>
                <li>
                  <a href="mailto:support@estre.in" className="hover:text-gold transition-colors">
                    support@estre.in
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Social Media & Newsletter */}
            <div>
              <h4 className="font-serif font-bold mb-4 text-gold">Connect</h4>
              <div className="flex gap-3 mb-6">
                <a href="https://instagram.com/estre" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-gold/30 hover:bg-gold/10 hover:border-gold transition-premium">
                  <Instagram className="h-5 w-5 text-gold" />
                </a>
                <a href="https://wa.me/918722200100" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-gold/30 hover:bg-gold/10 hover:border-gold transition-premium">
                  <MessageCircle className="h-5 w-5 text-gold" />
                </a>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Newsletter</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 text-sm border border-gold/30 rounded-lg bg-background focus:outline-none focus:border-gold transition-colors"
                  />
                  <Button size="sm" className="bg-gradient-gold text-white border-gold hover:shadow-gold-glow">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="pt-8 border-t border-gold/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; 2024 Estre Global Private Limited. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <Link to="/privacy" className="text-muted-foreground hover:text-gold transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-muted-foreground hover:text-gold transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
