import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sofa, Bed, Armchair, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const categories = [
    {
      icon: Sofa,
      title: "Sofas",
      description: "Customize your perfect sofa with premium fabrics",
      href: "/products/sofa",
      gradient: "from-primary to-primary/80"
    },
    {
      icon: Bed,
      title: "Beds",
      description: "Design your dream bed with luxury finishes",
      href: "/products/bed",
      gradient: "from-secondary to-secondary/80"
    },
    {
      icon: Armchair,
      title: "Recliners",
      description: "Create your comfort zone with custom recliners",
      href: "/products/recliner",
      gradient: "from-accent to-accent/80"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Estre Configurator
          </h1>
          <nav className="flex items-center gap-4">
            <Link to="/products">
              <Button variant="ghost">Products</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            Design Your Perfect Furniture
          </h2>
          <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Create custom furniture pieces tailored to your style with our professional configurator
          </p>
          <Link to="/products">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Start Configuring
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            Explore Our Categories
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.title} className="overflow-hidden hover:shadow-premium transition-smooth">
                  <Link to={category.href}>
                    <div className={`bg-gradient-to-br ${category.gradient} p-8 text-white`}>
                      <Icon className="h-12 w-12 mb-4" />
                      <h4 className="text-2xl font-bold mb-2">{category.title}</h4>
                      <p className="text-white/90">{category.description}</p>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                      <span className="font-semibold">Configure Now</span>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h4 className="text-xl font-bold mb-2">Premium Materials</h4>
              <p className="text-muted-foreground">
                Choose from hundreds of premium fabrics and finishes
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h4 className="text-xl font-bold mb-2">Custom Design</h4>
              <p className="text-muted-foreground">
                Personalize every detail to match your vision
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h4 className="text-xl font-bold mb-2">Fast Delivery</h4>
              <p className="text-muted-foreground">
                Quality craftsmanship delivered to your door
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Estre Configurator Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
