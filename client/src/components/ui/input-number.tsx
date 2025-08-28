import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputNumberProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ className, error, ...props }, ref) => {
    // Create a custom number input layout
    return (
      <div className="relative">
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pr-3 py-2 text-base focus-visible:outline-none focus-visible:border-white/40 focus-visible:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className,
            error && "border-destructive"
          )}
          style={{ paddingLeft: '0.75rem' }}
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