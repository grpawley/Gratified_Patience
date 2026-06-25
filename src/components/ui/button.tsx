import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9A82] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#7C9A82] text-white hover:bg-[#6b8870]": variant === "primary",
            "border border-[#7C9A82] text-[#7C9A82] hover:bg-[#7C9A82]/10": variant === "secondary",
            "text-[#3D3D3D] hover:bg-[#3D3D3D]/10": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600": variant === "danger",
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
