"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CameraCapture } from "./CameraCapture";
import { FrameSelector } from "./FrameSelector";
import { FinalResult } from "./FinalResult";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles } from "lucide-react";

export interface FrameConfig {
  rows: number;
  columns: number;
  name: string;
}

const FRAME_OPTIONS: FrameConfig[] = [
  { rows: 1, columns: 1, name: "Single" },
  { rows: 2, columns: 2, name: "Grid (2×2)" },
  { rows: 2, columns: 1, name: "Vertical (2×1)" },
  { rows: 1, columns: 2, name: "Horizontal (1×2)" },
  { rows: 3, columns: 1, name: "Vertical (3×1)" },
  { rows: 1, columns: 3, name: "Horizontal (1×3)" },
  { rows: 3, columns: 3, name: "Grid (3×3)" },
  { rows: 4, columns: 1, name: "Vertical (4×1)" },
];

type PhotoboothStep = "frame-selection" | "photo-capture" | "final-result";

export function Photobooth() {
  const [currentStep, setCurrentStep] = useState<PhotoboothStep>("frame-selection");
  const [selectedFrame, setSelectedFrame] = useState<FrameConfig>(FRAME_OPTIONS[0]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [isMirrored, setIsMirrored] = useState(true);

  const totalPhotosNeeded = selectedFrame.rows * selectedFrame.columns;
  const photosRemaining = totalPhotosNeeded - photos.length;

  const handleFrameSelect = (frame: FrameConfig) => {
    setSelectedFrame(frame);
    setCurrentStep("photo-capture");
  };

  const handlePhotoCapture = (photoDataUrl: string) => {
    const updatedPhotos = [...photos, photoDataUrl];
    setPhotos(updatedPhotos);

    if (updatedPhotos.length >= totalPhotosNeeded) {
      setCurrentStep("final-result");
    }
  };

  const handleReset = () => {
    setPhotos([]);
    setCurrentStep("frame-selection");
  };

  const handleToggleMirror = () => {
    setIsMirrored(!isMirrored);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Online Photobooth
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Create beautiful photo collages with our virtual photobooth. Take photos, customize your layout, add stickers, and share your creation!
        </p>
      </header>

      <AnimatePresence mode="wait">
        {currentStep === "frame-selection" && (
          <motion.div
            key="frame-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FrameSelector 
              frameOptions={FRAME_OPTIONS} 
              onSelect={handleFrameSelect} 
            />
          </motion.div>
        )}

        {currentStep === "photo-capture" && (
          <motion.div
            key="photo-capture"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Camera className="h-6 w-6 text-blue-600" />
                <span>Take Your Photos</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {photosRemaining} {photosRemaining === 1 ? "photo" : "photos"} remaining
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPhotosNeeded }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < photos.length
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <CameraCapture 
              onCapture={handlePhotoCapture} 
              isMirrored={isMirrored}
              onToggleMirror={handleToggleMirror}
            />

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleReset}
              >
                Back to Frame Selection
              </Button>
              
              {photos.length > 0 && (
                <Button
                  onClick={() => setCurrentStep("final-result")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Skip to Results
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {currentStep === "final-result" && (
          <motion.div
            key="final-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span>Your Photobooth Creation</span>
            </h2>
            
            <FinalResult
              frameConfig={selectedFrame}
              photos={photos}
              frameColor={frameColor}
              onColorChange={setFrameColor}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 