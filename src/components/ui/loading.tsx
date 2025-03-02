"use client";

import { motion } from "framer-motion";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Loading({ size = "medium", className = "" }: LoadingProps) {
  const sizeMap = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`rounded-full border-2 border-primary border-t-transparent ${sizeMap[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
} 