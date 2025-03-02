"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define the available filters
export type FilterType = {
  id: string;
  name: string;
  class: string;
  preview?: string;
  icon?: React.ReactNode;
};

// List of available filters with their CSS classes
export const FILTERS: FilterType[] = [
  {
    id: "none",
    name: "Normal",
    class: "",
  },
  {
    id: "grayscale",
    name: "Grayscale",
    class: "filter-grayscale",
  },
  {
    id: "sepia",
    name: "Sepia",
    class: "filter-sepia",
  },
  {
    id: "vintage",
    name: "Vintage",
    class: "filter-vintage",
  },
  {
    id: "blur",
    name: "Blur",
    class: "filter-blur",
  },
  {
    id: "contrast",
    name: "Contrast",
    class: "filter-contrast",
  },
  {
    id: "brightness",
    name: "Bright",
    class: "filter-brightness",
  },
  {
    id: "invert",
    name: "Invert",
    class: "filter-invert",
  },
];

interface FilterSelectorProps {
  selectedFilter: string;
  onSelectFilter: (filterId: string) => void;
  className?: string;
}

const FilterSelector: React.FC<FilterSelectorProps> = ({
  selectedFilter,
  onSelectFilter,
  className,
}) => {
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {FILTERS.map((filter) => (
        <Button
          key={filter.id}
          variant={selectedFilter === filter.id ? "default" : "outline"}
          className={cn(
            "flex flex-col items-center justify-center p-2 h-auto transition-all duration-200",
            selectedFilter === filter.id 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md scale-105" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          onClick={() => onSelectFilter(filter.id)}
        >
          <div
            className={cn(
              "w-full aspect-square rounded-md mb-2 overflow-hidden border border-gray-200 dark:border-gray-700",
              filter.class
            )}
          >
            {filter.preview ? (
              <img
                src={filter.preview}
                alt={filter.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
            )}
          </div>
          <span className="text-xs font-medium">{filter.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default FilterSelector; 