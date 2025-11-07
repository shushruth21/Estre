import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sofa, Bed, Armchair, ChevronRight, MonitorPlay, UtensilsCrossed, Baby, SofaIcon, Box, Sparkles, Palette, Zap, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, isAdmin, loading, userRoles } = useAuth();
  const navigate = useNavigate();

  // Redirect admins and staff to their dashboards if they land on homepage
  useEffect(() => {
    if (!loading && user) {
      const checkAndRedirect = async () => {
        // Wait for roles to load
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Re-fetch roles to ensure they're loaded
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        console.log("🔍 Index.tsx: User roles:", rolesData);
        
        if (rolesData && rolesData.length > 0) {
          const userRole = rolesData[0].role;
          console.log("🎯 Index.tsx: User role detected:", userRole);
          
          if (userRole === 'admin' || userRole === 'store_manager' || userRole === 'production_manager') {
            console.log("🚀 Index.tsx: Redirecting admin/manager to dashboard");
            window.location.href = "/admin/dashboard";
            return;
          }
          
          if (userRole === 'factory_staff') {
            console.log("🚀 Index.tsx: Redirecting staff to job cards");
            window.location.href = "/staff/job-cards";
            return;
          }
        }
      };

      checkAndRedirect();
    }
  }, [user, loading]);
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm glass-panel">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-3xl font-serif font-bold tracking-tight hover:text-primary transition-colors">Estre</h1>
          </Link>
          <div className="flex gap-3 items-center">
            <Link to="/products">
              <Button variant="ghost" className="font-medium">Products</Button>
            </Link>
            <ThemeToggle />
            {!loading && user && isAdmin() && (
              <Link to="/admin/dashboard">
                <Button variant="outline" className="font-medium">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
            {!loading && !user && (
              <Link to="/login">
                <Button className="luxury-button">Login</Button>
              </Link>
            )}
            {!loading && user && !isAdmin() && (
              <Link to="/dashboard">
                <Button variant="outline" className="font-medium">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero section-spacing">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-background"></div>
        <div className="container mx-auto container-spacing text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-6xl lg:text-8xl font-serif font-bold mb-6 tracking-tight text-foreground">
              Craft Your
              <span className="block text-primary mt-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Perfect Space
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Bespoke furniture designed with precision, crafted with passion. 
              Customize every detail to match your vision and create timeless elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/products">
                <Button size="lg" className="text-lg px-12 py-7 luxury-button shadow-lg hover:shadow-xl">
                  Begin Your Journey
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/products?category=sofa">
                <Button size="lg" variant="outline" className="text-lg px-12 py-7 luxury-button glass-card">
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
                <Card className="group luxury-card-glass cursor-pointer overflow-hidden h-full border-muted/50 hover:border-primary/30 transition-premium">
                  <div 
                    className={`p-8 lg:p-10 ${category.gradient} relative min-h-[280px] flex items-center justify-center`}
                  >
                    <div className="flex flex-col items-center text-center space-y-5 relative z-10">
                      <div className="p-5 bg-white/95 dark:bg-primary/20 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-premium shadow-lg glass-card">
                        <category.icon className="h-12 w-12 lg:h-14 lg:w-14 text-primary" />
                      </div>
                      <h4 className="text-xl lg:text-2xl font-serif font-bold text-white drop-shadow-lg">{category.title}</h4>
                      <p className="text-white/95 font-medium drop-shadow text-sm lg:text-base">{category.description}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-premium"></div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-6 w-6 text-white/80" />
                    </div>
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
            <Card className="luxury-card-glass p-8 lg:p-10 text-center border-muted/50 hover:border-primary/30 transition-premium">
              <div className="inline-flex p-5 bg-primary/10 rounded-2xl mb-6 glass-panel">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl lg:text-3xl font-serif font-bold mb-4">Premium Materials</h4>
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                Only the finest materials and fabrics sourced globally for lasting quality and comfort
              </p>
            </Card>
            <Card className="luxury-card-glass p-8 lg:p-10 text-center border-muted/50 hover:border-primary/30 transition-premium">
              <div className="inline-flex p-5 bg-primary/10 rounded-2xl mb-6 glass-panel">
                <Palette className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl lg:text-3xl font-serif font-bold mb-4">Custom Design</h4>
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                Personalize every aspect to match your unique style and space requirements
              </p>
            </Card>
            <Card className="luxury-card-glass p-8 lg:p-10 text-center border-muted/50 hover:border-primary/30 transition-premium">
              <div className="inline-flex p-5 bg-primary/10 rounded-2xl mb-6 glass-panel">
                <Zap className="h-10 w-10 text-primary" />
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
      <footer className="border-t bg-gradient-to-b from-background to-muted/30 py-16 lg:py-20">
        <div className="container mx-auto container-spacing">
          <div className="text-center space-y-6">
            <h3 className="text-3xl lg:text-4xl font-serif font-bold">Estre</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-base lg:text-lg leading-relaxed">
              Crafting exceptional furniture experiences since inception. 
              Your vision, our expertise.
            </p>
            <div className="pt-6 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                &copy; 2024 Estre Global Private Limited. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
