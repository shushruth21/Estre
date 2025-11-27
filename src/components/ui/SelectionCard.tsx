import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  label: string;
  icon?: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export const SelectionCard = ({ label, icon, isSelected, onClick, className }: SelectionCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 cursor-pointer group",
        "hover:border-gold hover:bg-gold/5 hover:shadow-md",
        isSelected
          ? "border-gold bg-gold/10 shadow-md"
          : "border-gold/20 bg-white",
        className
      )}
    >
      {icon && (
        <div className={cn(
          "mb-3 transition-colors duration-300",
          isSelected ? "text-gold" : "text-walnut/60 group-hover:text-gold"
        )}>
          {icon}
        </div>
      )}
      <span className={cn(
        "text-sm font-medium text-center transition-colors duration-300",
        isSelected ? "text-walnut font-bold" : "text-walnut/80"
      )}>
        {label}
      </span>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="h-4 w-4 text-gold" />
        </div>
      )}
    </button>
  );
};

