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
        "relative flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all cursor-pointer",
        "hover:border-primary/50 hover:bg-primary/5",
        isSelected 
          ? "border-primary bg-primary/10 shadow-md" 
          : "border-muted bg-background",
        className
      )}
    >
      {icon && (
        <div className="mb-2 text-muted-foreground">
          {icon}
        </div>
      )}
      <span className={cn(
        "text-sm font-medium text-center",
        isSelected ? "text-primary" : "text-foreground"
      )}>
        {label}
      </span>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="h-5 w-5 text-primary" />
        </div>
      )}
    </button>
  );
};

