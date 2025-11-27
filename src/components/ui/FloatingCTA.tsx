import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sofa, X } from "lucide-react";

export function FloatingCTA() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* CTA Options Menu */}
      {isOpen && (
        <div className="flex flex-col gap-2 animate-slide-up">
          <Link to="/products?category=sofa">
            <Button
              className="bg-gold text-walnut border-gold hover:bg-gold/90 shadow-lg"
              size="lg"
            >
              <Sofa className="mr-2 h-5 w-5" />
              Start Configuring Your Sofa
            </Button>
          </Link>
          <a
            href="https://wa.me/918722200100"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold shadow-lg bg-background/95 backdrop-blur-sm"
              size="lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Talk to Estre Designer
            </Button>
          </a>
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="rounded-full w-14 h-14 bg-gold text-walnut border-gold hover:bg-gold/90 shadow-lg"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}

