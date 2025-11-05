import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sofa, Bed, Armchair, ChevronRight, MonitorPlay, UtensilsCrossed, Baby, SofaIcon, Box, Sparkles, Palette, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold tracking-tight">Estre</h1>
          <div className="flex gap-3">
            <Link to="/products">
              <Button variant="ghost" className="font-medium">Products</Button>
            </Link>
            <Link to="/login">
              <Button className="luxury-button">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-32 text-center relative z-10">
          <h2 className="text-6xl lg:text-7xl font-serif font-bold mb-6 tracking-tight">
            Craft Your
            <span className="block text-primary mt-2">Perfect Space</span>
          </h2>
          <p className="text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Bespoke furniture designed with precision, crafted with passion. 
            Customize every detail to match your vision.
          </p>
          <Link to="/products">
            <Button size="lg" className="text-lg px-10 py-6 luxury-button shadow-lg">
              Begin Your Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h3 className="text-4xl lg:text-5xl font-serif font-bold mb-4">
            Browse by Category
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our curated collection of premium furniture designed for every space
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Link key={index} to={category.link}>
              <Card className="group luxury-card cursor-pointer overflow-hidden h-full border-muted/50">
                <div 
                  className={`p-10 ${category.gradient} relative`}
                  style={{ minHeight: '240px' }}
                >
                  <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="p-5 bg-white/95 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                      <category.icon className="h-14 w-14 text-primary" />
                    </div>
                    <h4 className="text-2xl font-serif font-bold text-white drop-shadow-lg">{category.title}</h4>
                    <p className="text-white/95 font-medium drop-shadow">{category.description}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl font-serif font-bold mb-4">
              Why Choose Estre?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience unparalleled craftsmanship and service
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <Card className="luxury-card p-8 text-center border-muted/50">
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3">Premium Materials</h4>
              <p className="text-muted-foreground leading-relaxed">
                Only the finest materials and fabrics sourced globally for lasting quality and comfort
              </p>
            </Card>
            <Card className="luxury-card p-8 text-center border-muted/50">
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                <Palette className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3">Custom Design</h4>
              <p className="text-muted-foreground leading-relaxed">
                Personalize every aspect to match your unique style and space requirements
              </p>
            </Card>
            <Card className="luxury-card p-8 text-center border-muted/50">
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3">Expert Craftsmanship</h4>
              <p className="text-muted-foreground leading-relaxed">
                Meticulous attention to detail with decades of furniture-making expertise
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-serif font-bold">Estre</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Crafting exceptional furniture experiences since inception. 
              Your vision, our expertise.
            </p>
            <p className="text-sm text-muted-foreground pt-4">
              &copy; 2024 Estre Configurator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
