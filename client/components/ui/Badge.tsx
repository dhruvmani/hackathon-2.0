import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  size?: "sm" | "md";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", size = "sm", className }) => {
  const variantMap: Record<string, string> = {
    Action: "bg-red-600/20 text-red-500 border-red-500/50",
    Drama: "bg-blue-600/20 text-blue-500 border-blue-500/50",
    Comedy: "bg-yellow-600/20 text-yellow-500 border-yellow-500/50",
    Thriller: "bg-purple-600/20 text-purple-500 border-purple-500/50",
    "Sci-Fi": "bg-cyan-600/20 text-cyan-500 border-cyan-500/50",
    Horror: "bg-orange-600/20 text-orange-500 border-orange-500/50",
    Romance: "bg-pink-600/20 text-pink-500 border-pink-500/50",
    default: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };

  const badgeClass = variantMap[variant] || variantMap.default;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider",
        badgeClass,
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
