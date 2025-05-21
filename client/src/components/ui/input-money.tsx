import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputMoneyProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const InputMoney = React.forwardRef<HTMLInputElement, InputMoneyProps>(
  ({ className, error, ...props }, ref) => {
    // Create a custom input layout with dollar sign
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
        <input
          type="number"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
            error && "border-destructive"
          )}
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
