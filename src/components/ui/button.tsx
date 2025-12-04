import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 border-2 border-foreground rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
        destructive: "bg-foreground text-background hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
        outline: "bg-background text-foreground hover:bg-secondary hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
        secondary: "bg-secondary text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
        ghost: "border-transparent shadow-none hover:bg-secondary hover:border-foreground hover:shadow-sketch-sm",
        link: "border-transparent shadow-none text-foreground underline-offset-4 hover:underline",
        accent: "bg-foreground text-background hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
        success: "bg-foreground text-background hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
        pink: "bg-foreground text-background hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
        orange: "bg-foreground text-background hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-sketch hover:shadow-sketch-hover",
      },
      size: {
        default: "h-11 px-6 py-2 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };