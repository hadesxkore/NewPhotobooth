"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FILTERS } from "./FilterSelector";

interface FilteredImageProps {
  src: string;
  filterId: string;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  crossOrigin?: "anonymous" | "use-credentials" | "";
}

const FilteredImage: React.FC<FilteredImageProps> = ({
  src,
  filterId,
  className,
  alt = "Filtered image",
  width,
  height,
  crossOrigin,
}) => {
  // Find the selected filter from our filters list
  const selectedFilter = FILTERS.find((filter) => filter.id === filterId) || FILTERS[0];

  return (
    <div className={cn("overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        crossOrigin={crossOrigin}
        className={cn("w-full h-full object-cover filter-transition", selectedFilter.class)}
      />
    </div>
  );
};

export default FilteredImage; 