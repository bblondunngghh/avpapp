import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputNumberProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ className, error, ...props }, ref) => {
    // Create a custom input layout with # symbol
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white font-medium z-10">#</span>
        <input
          type="number"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pr-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className,
            error && "border-destructive"
          )}
          style={{ paddingLeft: '1.75rem' }}
          ref={ref}
          min="0"
          onWheel={(e) => e.currentTarget.blur()}
          {...props}
        />
      </div>
    );
  }
);

InputNumber.displayName = "InputNumber";

export { InputNumber };