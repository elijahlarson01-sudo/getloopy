import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold uppercase tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 border-4 border-foreground active:translate-x-1 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
        destructive: "bg-destructive text-destructive-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
        outline: "bg-background hover:bg-secondary hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
        secondary: "bg-secondary text-secondary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
        ghost: "border-transparent shadow-none hover:bg-secondary hover:border-foreground hover:shadow-pop-sm",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
        success: "bg-success text-success-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
        pink: "bg-pink text-pink-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
        orange: "bg-orange text-orange-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-pop hover:shadow-pop-hover",
      },
      size: {
        default: "h-12 px-6 py-2 text-sm",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        xl: "h-16 px-12 text-lg",
        icon: "h-12 w-12",
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
