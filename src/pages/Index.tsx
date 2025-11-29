import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sofa, Bed, Armchair, ChevronRight, MonitorPlay, UtensilsCrossed, Baby, SofaIcon, Box, Sparkles, Palette, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const categories = [
    {
      icon: Sofa,
      title: "Sofas",
      description: "Customize your perfect sofa with premium fabrics",
      link: "/products?category=sofa",
      gradient: "bg-ivory"
    },
    {
      icon: Bed,
      title: "Beds",
      description: "Design your dream bed with luxury finishes",
      link: "/products?category=bed",
      gradient: "bg-ivory"
    },
    {
      icon: Armchair,
      title: "Recliners",
      description: "Create your comfort zone with custom recliners",
      link: "/products?category=recliner",
      gradient: "bg-ivory"
    },
    {
      icon: MonitorPlay,
      title: "Cinema Chairs",
      description: "Premium theater seating for home entertainment",
      link: "/products?category=cinema_chairs",
      gradient: "bg-ivory"
    },
    {
      icon: UtensilsCrossed,
      title: "Dining Chairs",
      description: "Elegant seating for memorable meals",
      link: "/products?category=dining_chairs",
      gradient: "bg-ivory"
    },
    {
      icon: Armchair,
      title: "Arm Chairs",
      description: "Comfortable accent seating pieces",
      link: "/products?category=arm_chairs",
      gradient: "bg-ivory"
    },
    {
      icon: Box,
      title: "Benches",
      description: "Versatile seating with storage options",
      link: "/products?category=benches",
      gradient: "bg-ivory"
    },
    {
      icon: Baby,
      title: "Kids Beds",
      description: "Safe and fun beds for children",
      link: "/products?category=kids_bed",
      gradient: "bg-ivory"
    },
    {
      icon: SofaIcon,
      title: "Sofa Beds",
      description: "Dual-purpose comfort and convenience",
      link: "/products?category=sofabed",
      gradient: "bg-ivory"
    },
    {
      icon: Box,
      title: "Pouffes",
      description: "Stylish footrests and accent pieces",
      link: "/products?category=database_pouffes",
      gradient: "bg-ivory"
    }
  ];

  return (
    <div className="min-h-screen bg-ivory font-sans text-walnut">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpg"
            alt="Luxury Living Room"
            className="w-full h-full object-cover"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10 animate-fade-in -mt-32">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-5xl sm:text-6xl lg:text-8xl font-serif font-bold mb-6 tracking-tight text-white animate-slide-up drop-shadow-lg">
              Craft Your
              <span className="block text-gold-light mt-2 italic drop-shadow-md">
                Perfect Space
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up font-light drop-shadow-md" style={{ animationDelay: "0.2s" }}>
              Bespoke furniture designed with precision, crafted with passion.
              Customize every detail to match your vision and create timeless elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <Link to="/products">
                <Button size="lg" className="text-lg px-12 py-7 rounded-full bg-gold hover:bg-gold-dark text-white border-none shadow-lg hover:scale-105 transition-all duration-300">
                  Begin Your Journey
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/products?category=sofa">
                <Button size="lg" variant="outline" className="text-lg px-12 py-7 border-white text-white hover:bg-white hover:text-walnut rounded-full transition-all duration-300 backdrop-blur-sm bg-white/10">
                  Explore Collections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-4xl lg:text-5xl font-serif font-bold mb-6 text-walnut">
              Browse by Category
            </h3>
            <p className="text-lg lg:text-xl text-walnut/70 max-w-2xl mx-auto leading-relaxed font-light">
              Explore our curated collection of premium furniture designed for every space and lifestyle
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <Link key={index} to={category.link}>
                <Card className="group cursor-pointer overflow-hidden h-full border-0 shadow-sm hover:shadow-xl transition-all duration-500 bg-ivory rounded-2xl">
                  <div className="p-10 flex flex-col items-center text-center space-y-6 min-h-[300px] justify-center relative">
                    <div className="p-6 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
                      <category.icon className="h-10 w-10 text-walnut group-hover:text-gold transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif font-bold text-walnut mb-2 group-hover:text-gold transition-colors">{category.title}</h4>
                      <p className="text-walnut/60 text-sm font-light">{category.description}</p>
                    </div>

                    <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      <span className="text-gold text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                        Customize <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-ivory">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-4xl lg:text-5xl font-serif font-bold mb-6 text-walnut">
              Why Choose Estre?
            </h3>
            <p className="text-lg lg:text-xl text-walnut/70 max-w-2xl mx-auto leading-relaxed font-light">
              Experience unparalleled craftsmanship and service that transforms your vision into reality
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <Card className="p-10 text-center border-0 shadow-none bg-transparent">
              <div className="inline-flex p-5 bg-gold/10 rounded-full mb-6">
                <Sparkles className="h-8 w-8 text-gold" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-4 text-walnut">Premium Materials</h4>
              <p className="text-walnut/70 leading-relaxed">
                Only the finest materials and fabrics sourced globally for lasting quality and comfort
              </p>
            </Card>
            <Card className="p-10 text-center border-0 shadow-none bg-transparent">
              <div className="inline-flex p-5 bg-gold/10 rounded-full mb-6">
                <Palette className="h-8 w-8 text-gold" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-4 text-walnut">Custom Design</h4>
              <p className="text-walnut/70 leading-relaxed">
                Personalize every aspect to match your unique style and space requirements
              </p>
            </Card>
            <Card className="p-10 text-center border-0 shadow-none bg-transparent">
              <div className="inline-flex p-5 bg-gold/10 rounded-full mb-6">
                <Zap className="h-8 w-8 text-gold" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-4 text-walnut">Expert Craftsmanship</h4>
              <p className="text-walnut/70 leading-relaxed">
                Meticulous attention to detail with decades of furniture-making expertise
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
