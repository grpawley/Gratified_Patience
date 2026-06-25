import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#3D3D3D]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] placeholder:text-[#B8C4B8] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82] disabled:opacity-50",
            error && "border-red-400 focus:border-red-400 focus:ring-red-400",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
