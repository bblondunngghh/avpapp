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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-medium z-10">$</span>
        <input
          type="number"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pr-3 py-2 text-base focus-visible:outline-none focus-visible:border-white/40 focus-visible:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className,
            error && "border-destructive"
          )}
          style={{ paddingLeft: '1.75rem' }}
          ref={ref}
          step="0.01"
          min="0"
          onWheel={(e) => e.currentTarget.blur()}
          {...props}
        />
      </div>
    );
  }
);

InputMoney.displayName = "InputMoney";

export { InputMoney };
