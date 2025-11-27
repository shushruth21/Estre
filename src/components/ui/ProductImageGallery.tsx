import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllImageUrls } from "@/lib/image-utils";

interface ProductImageGalleryProps {
  images: string | null | string[] | any; // Accept any format from database
  productTitle: string;
  className?: string;
}

const ProductImageGallery = ({ images, productTitle, className = "" }: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Parse images using utility function - handles all formats
  const imageUrls = getAllImageUrls(images);

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    // Only set placeholder if not already placeholder to prevent infinite loop
    if (!target.src.includes('placeholder.svg')) {
      target.src = '/placeholder.svg';
      target.onerror = null; // Prevent infinite loop
    }
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Main Image */}
        <div className="relative aspect-square bg-muted rounded-xl overflow-hidden group">
          <img
            src={imageUrls[selectedIndex]}
            alt={`${productTitle} - View ${selectedIndex + 1}`}
            className="w-full h-full object-cover image-zoom cursor-pointer"
            onClick={() => setIsLightboxOpen(true)}
            onError={handleImageError}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Zoom Button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="View fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </button>

          {/* Navigation Arrows (if multiple images) */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-sm">
              {selectedIndex + 1} / {imageUrls.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {imageUrls.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === index
                    ? 'border-gold ring-2 ring-gold/20'
                    : 'border-transparent hover:border-gold/20'
                  }`}
              >
                <img
                  src={url}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  loading="lazy"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-background/95">
            <img
              src={imageUrls[selectedIndex]}
              alt={`${productTitle} - View ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {imageUrls.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductImageGallery;
