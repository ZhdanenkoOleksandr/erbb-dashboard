"use client";
import { HTMLAttributes } from "react";
interface CardProps extends HTMLAttributes<HTMLDivElement> { glowColor?: string; }
export default function Card({ children, className="", glowColor, style, ...props }: CardProps) {
  return (
    <div className={`bg-[#131920] border border-white/10 rounded-lg backdrop-blur-sm ${className}`}
      style={{ boxShadow: glowColor ? `0 0 20px ${glowColor}22` : undefined, ...style }} {...props}>
      {children}
    </div>
  );
}