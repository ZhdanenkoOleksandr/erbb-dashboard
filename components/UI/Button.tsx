"use client";
import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost"; loading?: boolean;
}
export default function Button({ children, variant="primary", loading=false, className="", disabled, ...props }: ButtonProps) {
  const base = "relative px-4 py-2 rounded text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2";
  const variants = {
    primary: "bg-primary/10 border border-primary text-primary hover:bg-primary/20 shadow-neon",
    danger: "bg-danger/10 border border-danger text-danger hover:bg-danger/20",
    ghost: "bg-transparent border border-white/10 text-white/60 hover:border-white/30 hover:text-white/90",
  };
  return (
    <motion.button whileTap={{ scale: 0.97 }} className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...(props as any)}>
      {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </motion.button>
  );
}