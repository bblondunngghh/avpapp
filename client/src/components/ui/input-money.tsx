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
      <div className="relative flex items-center border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <span className="pl-3 pr-2 text-gray-500 font-medium">$</span>
        <input
          type="number"
          className={cn(
            "flex h-10 w-full rounded-md border-0 bg-background px-3 py-2 text-base focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
