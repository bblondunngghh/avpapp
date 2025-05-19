import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputMoneyProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const InputMoney = React.forwardRef<HTMLInputElement, InputMoneyProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className={cn("text-gray-500", error && "text-destructive")}>$</span>
        </div>
        <Input 
          type="number" 
          className={cn("pl-7", className, error && "border-destructive")} 
          ref={ref} 
          step="0.01"
          min="0"
          {...props} 
        />
      </div>
    );
  }
);

InputMoney.displayName = "InputMoney";

export { InputMoney };
