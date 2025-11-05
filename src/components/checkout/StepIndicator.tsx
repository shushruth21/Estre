import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  name: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li key={step.id} className={cn("relative", index !== steps.length - 1 && "flex-1")}>
            <div className="flex items-center">
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-smooth",
                    currentStep > step.id
                      ? "bg-primary border-primary"
                      : currentStep === step.id
                      ? "border-primary bg-background"
                      : "border-border bg-background"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        currentStep === step.id ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </div>
              </div>
              
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "hidden sm:block flex-1 h-0.5 ml-4 transition-smooth",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            
            <div className="mt-2 text-center sm:text-left">
              <p
                className={cn(
                  "text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.name}
              </p>
              <p className="hidden sm:block text-xs text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
