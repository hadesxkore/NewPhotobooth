"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type FrameConfig } from "./Photobooth";
import { Check } from "lucide-react";

export interface FrameSelectorProps {
  frameOptions: FrameConfig[];
  onSelect: (frame: FrameConfig) => void;
}

export function FrameSelector({ frameOptions, onSelect }: FrameSelectorProps) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  
  const handleSelect = (index: number) => {
    setSelectedFrameIndex(index);
  };
  
  const handleConfirm = () => {
    if (selectedFrameIndex !== null) {
      onSelect(frameOptions[selectedFrameIndex]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Choose Your Layout</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a frame layout for your photobooth experience
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {frameOptions.map((frame, index) => (
          <div 
            key={index}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-md bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm ${
              selectedFrameIndex === index 
                ? "ring-2 ring-blue-600 border-blue-600" 
                : "hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => handleSelect(index)}
          >
            <CardContent className="p-4">
              <div className="relative">
                <div 
                  className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md mb-3 overflow-hidden"
                >
                  <div 
                    className="w-full h-full grid gap-1 p-2"
                    style={{
                      gridTemplateColumns: `repeat(${frame.columns}, 1fr)`,
                      gridTemplateRows: `repeat(${frame.rows}, 1fr)`,
                    }}
                  >
                    {Array.from({ length: frame.rows * frame.columns }).map((_, i) => (
                      <div 
                        key={i} 
                        className="bg-gray-200 dark:bg-gray-700 rounded-sm"
                      />
                    ))}
                  </div>
                </div>
                
                {selectedFrameIndex === index && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="font-medium">{frame.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {frame.rows * frame.columns} {frame.rows * frame.columns === 1 ? "photo" : "photos"}
                </p>
              </div>
            </CardContent>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-8">
        <Button
          onClick={handleConfirm}
          disabled={selectedFrameIndex === null}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg"
          size="lg"
        >
          {selectedFrameIndex === null ? "Select a Layout" : "Continue to Camera"}
        </Button>
      </div>
    </div>
  );
} 