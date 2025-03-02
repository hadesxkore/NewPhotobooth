"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { type FrameConfig } from "./Photobooth";
import { Download, RotateCcw, Palette, Maximize, Share2, Sticker as StickerIcon } from "lucide-react";
import { StickerSelector } from "./StickerSelector";
import { DraggableSticker } from "./DraggableSticker";
import { Sticker } from "@/data/stickers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinalResultProps {
  frameConfig: FrameConfig;
  photos: string[];
  frameColor: string;
  onColorChange: (color: string) => void;
  onReset: () => void;
}

interface PlacedSticker {
  id: string;
  sticker: Sticker;
  position: { x: number; y: number };
}

const COLOR_OPTIONS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Slate", value: "#64748b" },
];

export function FinalResult({
  frameConfig,
  photos,
  frameColor,
  onColorChange,
  onReset,
}: FinalResultProps) {
  const resultRef = useRef<HTMLDivElement>(null);
  const stickerContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [borderWidth, setBorderWidth] = useState(20);
  const [spacing, setSpacing] = useState(10);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [activeTab, setActiveTab] = useState<string>("style");
  const [showDate, setShowDate] = useState(false);
  const [dateFormat, setDateFormat] = useState<'short' | 'long'>('short');
  const [imageWidth, setImageWidth] = useState(100); // Default width percentage
  const currentDate = new Date();
  
  // Preload stickers with CORS when they're added
  useEffect(() => {
    placedStickers.forEach(placedSticker => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = placedSticker.sticker.url;
    });
  }, [placedStickers]);

  // Function to preload all stickers with CORS
  const preloadStickersForDownload = async () => {
    const preloadPromises = placedStickers.map(placedSticker => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to preload sticker: ${placedSticker.sticker.url}`);
          resolve(); // Resolve anyway to continue with other stickers
        };
        img.src = placedSticker.sticker.url;
      });
    });
    
    await Promise.all(preloadPromises);
  };

  // Calculate optimal aspect ratio based on frame configuration
  const getOptimalAspectRatio = () => {
    // For horizontal layouts (more columns than rows), make it wider
    if (frameConfig.columns > frameConfig.rows) {
      return (frameConfig.columns / frameConfig.rows) * (imageWidth / 100);
    }
    // For vertical or square layouts, use the original aspect ratio
    return frameConfig.columns / frameConfig.rows;
  };

  const handleDownload = async () => {
    if (!resultRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Preload all stickers with CORS
      await preloadStickersForDownload();
      
      // Try the canvas approach first
      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error("Could not create canvas context");
        }
        
        // Get dimensions of the result container
        const rect = resultRef.current.getBoundingClientRect();
        
        // For horizontal layouts, make the canvas wider based on the imageWidth setting
        let canvasWidth = rect.width;
        let canvasHeight = rect.height;
        
        if (frameConfig.columns > frameConfig.rows) {
          // Calculate the width adjustment factor
          const widthFactor = imageWidth / 100;
          canvasWidth = rect.width * widthFactor;
          // Keep the same height to maintain proper proportions of photos
          canvasHeight = rect.height;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Draw background
        ctx.fillStyle = frameColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Wait longer to ensure everything is rendered and CORS requests complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Draw the photos with adjusted positions for wider canvas
        const photoElements = resultRef.current.querySelectorAll('.rounded-sm img');
        const photoPromises = Array.from(photoElements).map((img, index) => {
          return new Promise<void>((resolve) => {
            const imgEl = img as HTMLImageElement;
            
            if (imgEl.complete) {
              const imgRect = imgEl.getBoundingClientRect();
              
              // Calculate position adjustments for wider canvas
              let relativeRect;
              if (frameConfig.columns > frameConfig.rows) {
                // For horizontal layouts, scale the positions
                const widthFactor = imageWidth / 100;
                const colWidth = canvasWidth / frameConfig.columns;
                const rowHeight = canvasHeight / frameConfig.rows;
                
                // Calculate which column and row this photo is in
                const col = index % frameConfig.columns;
                const row = Math.floor(index / frameConfig.columns);
                
                relativeRect = {
                  left: col * colWidth,
                  top: row * rowHeight,
                  width: colWidth - spacing,
                  height: rowHeight - spacing
                };
              } else {
                // For vertical or square layouts, use the original positioning
                relativeRect = {
                  left: imgRect.left - rect.left,
                  top: imgRect.top - rect.top,
                  width: imgRect.width,
                  height: imgRect.height
                };
              }
              
              try {
                ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
              } catch (e) {
                console.error("Error drawing photo to canvas:", e);
              }
              resolve();
            } else {
              imgEl.onload = () => {
                const imgRect = imgEl.getBoundingClientRect();
                
                // Calculate position adjustments for wider canvas
                let relativeRect;
                if (frameConfig.columns > frameConfig.rows) {
                  // For horizontal layouts, scale the positions
                  const widthFactor = imageWidth / 100;
                  const colWidth = canvasWidth / frameConfig.columns;
                  const rowHeight = canvasHeight / frameConfig.rows;
                  
                  // Calculate which column and row this photo is in
                  const col = index % frameConfig.columns;
                  const row = Math.floor(index / frameConfig.columns);
                  
                  relativeRect = {
                    left: col * colWidth,
                    top: row * rowHeight,
                    width: colWidth - spacing,
                    height: rowHeight - spacing
                  };
                } else {
                  // For vertical or square layouts, use the original positioning
                  relativeRect = {
                    left: imgRect.left - rect.left,
                    top: imgRect.top - rect.top,
                    width: imgRect.width,
                    height: imgRect.height
                  };
                }
                
                try {
                  ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                } catch (e) {
                  console.error("Error drawing photo to canvas:", e);
                }
                resolve();
              };
              imgEl.onerror = () => resolve(); // Continue even if image fails
            }
          });
        });
        
        await Promise.all(photoPromises);
        
        // Draw stickers separately to ensure they're included
        const stickerElements = resultRef.current.querySelectorAll('.photobooth-sticker');
        const stickerPromises = Array.from(stickerElements).map(stickerEl => {
          return new Promise<void>((resolve) => {
            const img = stickerEl.querySelector('.sticker-img') as HTMLImageElement;
            if (!img) {
              resolve();
              return;
            }
            
            // Ensure crossOrigin is set
            if (img.crossOrigin !== 'anonymous') {
              img.crossOrigin = 'anonymous';
              // Force reload if needed
              const originalSrc = img.src;
              img.src = '';
              img.src = originalSrc;
            }
            
            if (img.complete) {
              try {
                // For horizontal layouts, adjust sticker positions
                if (frameConfig.columns > frameConfig.rows) {
                  const widthFactor = imageWidth / 100;
                  drawStickerToCanvasWithWidthAdjustment(stickerEl as HTMLElement, img, ctx, rect, widthFactor);
                } else {
                  drawStickerToCanvas(stickerEl as HTMLElement, img, ctx, rect);
                }
              } catch (e) {
                console.error("Error drawing sticker to canvas:", e);
                // Continue even if sticker fails
              }
              resolve();
            } else {
              img.onload = () => {
                try {
                  // For horizontal layouts, adjust sticker positions
                  if (frameConfig.columns > frameConfig.rows) {
                    const widthFactor = imageWidth / 100;
                    drawStickerToCanvasWithWidthAdjustment(stickerEl as HTMLElement, img, ctx, rect, widthFactor);
                  } else {
                    drawStickerToCanvas(stickerEl as HTMLElement, img, ctx, rect);
                  }
                } catch (e) {
                  console.error("Error drawing sticker to canvas:", e);
                  // Continue even if sticker fails
                }
                resolve();
              };
              img.onerror = () => resolve(); // Continue even if image fails
            }
          });
        });
        
        await Promise.all(stickerPromises);
        
        // Add date if shown
        if (showDate) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(canvas.width - 150, canvas.height - 40, 140, 30);
          ctx.fillStyle = 'white';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(getFormattedDate(), canvas.width - 80, canvas.height - 20);
        }
        
        // Convert canvas to data URL
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/png');
        } catch (e) {
          // Check specifically for SecurityError which indicates CORS issues
          if (e instanceof DOMException && e.name === 'SecurityError') {
            console.error("SecurityError: Canvas has been tainted by cross-origin data. Falling back to html-to-image.");
            throw e; // Rethrow to trigger fallback
          }
          throw e;
        }
        
        // Create a download link and trigger it
        const link = document.createElement("a");
        link.download = `photobooth-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        
        // If we got here, the canvas approach worked
        return;
      } catch (canvasErr) {
        console.error("Canvas approach failed:", canvasErr);
        console.log("Falling back to html-to-image approach");
      }
      
      // Fallback to html-to-image if canvas approach fails
      // Use a longer delay to ensure all stickers are rendered properly
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const dataUrl = await toPng(resultRef.current, { 
        quality: 0.95,
        // Skip nodes that have failed to load (like images with CORS issues)
        filter: (node) => {
          if (node instanceof HTMLImageElement && !node.complete) {
            return false;
          }
          return true;
        }
      });
      
      // Create a download link and trigger it
      const link = document.createElement("a");
      link.download = `photobooth-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Sorry, we couldn't generate your image. Please try again or use a screenshot instead.");
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Helper function to draw a sticker to the canvas with its transformations
  const drawStickerToCanvas = (
    stickerEl: HTMLElement, 
    img: HTMLImageElement, 
    ctx: CanvasRenderingContext2D, 
    containerRect: DOMRect
  ) => {
    const stickerRect = stickerEl.getBoundingClientRect();
    const relativeRect = {
      left: stickerRect.left - containerRect.left,
      top: stickerRect.top - containerRect.top,
      width: stickerRect.width,
      height: stickerRect.height
    };
    
    // Get transform properties
    const style = window.getComputedStyle(stickerEl);
    const transform = style.transform || style.webkitTransform;
    
    try {
      ctx.save();
      
      // Apply transform center point
      ctx.translate(
        relativeRect.left + relativeRect.width / 2,
        relativeRect.top + relativeRect.height / 2
      );
      
      // Extract rotation from transform if possible
      let rotation = 0;
      if (transform && transform !== 'none') {
        const match = transform.match(/rotate\(([^)]+)deg\)/);
        if (match && match[1]) {
          rotation = parseFloat(match[1]);
        }
      }
      
      // Apply rotation
      ctx.rotate(rotation * Math.PI / 180);
      
      // Extract scale from transform if possible
      let scale = 1;
      if (transform && transform !== 'none') {
        const match = transform.match(/scale\(([^)]+)\)/);
        if (match && match[1]) {
          scale = parseFloat(match[1]);
        }
      }
      
      // Apply scale
      ctx.scale(scale, scale);
      
      // Draw the image centered
      ctx.drawImage(
        img, 
        -relativeRect.width / 2, 
        -relativeRect.height / 2, 
        relativeRect.width, 
        relativeRect.height
      );
      
      ctx.restore();
    } catch (e) {
      console.error("Error drawing sticker to canvas:", e);
    }
  };

  // Helper function to draw a sticker with width adjustment for horizontal layouts
  const drawStickerToCanvasWithWidthAdjustment = (
    stickerEl: HTMLElement, 
    img: HTMLImageElement, 
    ctx: CanvasRenderingContext2D, 
    containerRect: DOMRect,
    widthFactor: number
  ) => {
    const stickerRect = stickerEl.getBoundingClientRect();
    
    // Calculate the adjusted position based on the width factor
    const relativeRect = {
      left: (stickerRect.left - containerRect.left) * widthFactor,
      top: stickerRect.top - containerRect.top,
      width: stickerRect.width * widthFactor,
      height: stickerRect.height
    };
    
    // Get transform properties
    const style = window.getComputedStyle(stickerEl);
    const transform = style.transform || style.webkitTransform;
    
    try {
      ctx.save();
      
      // Apply transform center point with width adjustment
      ctx.translate(
        relativeRect.left + relativeRect.width / 2,
        relativeRect.top + relativeRect.height / 2
      );
      
      // Extract rotation from transform if possible
      let rotation = 0;
      if (transform && transform !== 'none') {
        const match = transform.match(/rotate\(([^)]+)deg\)/);
        if (match && match[1]) {
          rotation = parseFloat(match[1]);
        }
      }
      
      // Apply rotation
      ctx.rotate(rotation * Math.PI / 180);
      
      // Extract scale from transform if possible
      let scale = 1;
      if (transform && transform !== 'none') {
        const match = transform.match(/scale\(([^)]+)\)/);
        if (match && match[1]) {
          scale = parseFloat(match[1]);
        }
      }
      
      // Apply scale
      ctx.scale(scale, scale);
      
      // Draw the image centered
      ctx.drawImage(
        img, 
        -relativeRect.width / 2, 
        -relativeRect.height / 2, 
        relativeRect.width, 
        relativeRect.height
      );
      
      ctx.restore();
    } catch (e) {
      console.error("Error drawing sticker to canvas:", e);
    }
  };

  const handleShare = async () => {
    if (!resultRef.current) return;
    
    try {
      // Preload all stickers with CORS
      await preloadStickersForDownload();
      
      // Try the canvas approach first
      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error("Could not create canvas context");
        }
        
        // Get dimensions of the result container
        const rect = resultRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Draw background
        ctx.fillStyle = frameColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Wait longer to ensure everything is rendered and CORS requests complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Draw the photos
        const photoElements = resultRef.current.querySelectorAll('.rounded-sm img');
        const photoPromises = Array.from(photoElements).map(img => {
          return new Promise<void>((resolve) => {
            const imgEl = img as HTMLImageElement;
            
            if (imgEl.complete) {
              const imgRect = imgEl.getBoundingClientRect();
              const relativeRect = {
                left: imgRect.left - rect.left,
                top: imgRect.top - rect.top,
                width: imgRect.width,
                height: imgRect.height
              };
              
              try {
                ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
              } catch (e) {
                console.error("Error drawing photo to canvas:", e);
              }
              resolve();
            } else {
              imgEl.onload = () => {
                const imgRect = imgEl.getBoundingClientRect();
                const relativeRect = {
                  left: imgRect.left - rect.left,
                  top: imgRect.top - rect.top,
                  width: imgRect.width,
                  height: imgRect.height
                };
                
                try {
                  ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                } catch (e) {
                  console.error("Error drawing photo to canvas:", e);
                }
                resolve();
              };
              imgEl.onerror = () => resolve(); // Continue even if image fails
            }
          });
        });
        
        await Promise.all(photoPromises);
        
        // Draw stickers separately to ensure they're included
        const stickerElements = resultRef.current.querySelectorAll('.photobooth-sticker');
        const stickerPromises = Array.from(stickerElements).map(stickerEl => {
          return new Promise<void>((resolve) => {
            const img = stickerEl.querySelector('.sticker-img') as HTMLImageElement;
            if (!img) {
              resolve();
              return;
            }
            
            // Ensure crossOrigin is set
            if (img.crossOrigin !== 'anonymous') {
              img.crossOrigin = 'anonymous';
              // Force reload if needed
              const originalSrc = img.src;
              img.src = '';
              img.src = originalSrc;
            }
            
            if (img.complete) {
              try {
                // For horizontal layouts, adjust sticker positions
                if (frameConfig.columns > frameConfig.rows) {
                  const widthFactor = imageWidth / 100;
                  drawStickerToCanvasWithWidthAdjustment(stickerEl as HTMLElement, img, ctx, rect, widthFactor);
                } else {
                  drawStickerToCanvas(stickerEl as HTMLElement, img, ctx, rect);
                }
              } catch (e) {
                console.error("Error drawing sticker to canvas:", e);
                // Continue even if sticker fails
              }
              resolve();
            } else {
              img.onload = () => {
                try {
                  // For horizontal layouts, adjust sticker positions
                  if (frameConfig.columns > frameConfig.rows) {
                    const widthFactor = imageWidth / 100;
                    drawStickerToCanvasWithWidthAdjustment(stickerEl as HTMLElement, img, ctx, rect, widthFactor);
                  } else {
                    drawStickerToCanvas(stickerEl as HTMLElement, img, ctx, rect);
                  }
                } catch (e) {
                  console.error("Error drawing sticker to canvas:", e);
                  // Continue even if sticker fails
                }
                resolve();
              };
              img.onerror = () => resolve(); // Continue even if image fails
            }
          });
        });
        
        await Promise.all(stickerPromises);
        
        // Add date if shown
        if (showDate) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(canvas.width - 150, canvas.height - 40, 140, 30);
          ctx.fillStyle = 'white';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(getFormattedDate(), canvas.width - 80, canvas.height - 20);
        }
        
        // Convert canvas to data URL
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/png');
        } catch (e) {
          // Check specifically for SecurityError which indicates CORS issues
          if (e instanceof DOMException && e.name === 'SecurityError') {
            console.error("SecurityError: Canvas has been tainted by cross-origin data. Falling back to html-to-image.");
            throw e; // Rethrow to trigger fallback
          }
          throw e;
        }
        
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Check if Web Share API is available
        if (navigator.share) {
          const file = new File([blob], "photobooth.png", { type: "image/png" });
          await navigator.share({
            title: "My Photobooth Creation",
            text: "Check out my photobooth creation!",
            files: [file]
          });
          return;
        }
      } catch (canvasErr) {
        console.error("Canvas approach failed for sharing:", canvasErr);
        console.log("Falling back to html-to-image approach for sharing");
      }
      
      // Fallback to html-to-image if canvas approach fails
      // Use a longer delay to ensure all stickers are rendered properly
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const dataUrl = await toPng(resultRef.current, { 
        quality: 0.95,
        filter: (node) => {
          if (node instanceof HTMLImageElement && !node.complete) {
            return false;
          }
          return true;
        }
      });
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Check if Web Share API is available
      if (navigator.share) {
        const file = new File([blob], "photobooth.png", { type: "image/png" });
        await navigator.share({
          title: "My Photobooth Creation",
          text: "Check out my photobooth creation!",
          files: [file]
        });
      } else {
        // Fallback to download if sharing is not available
        handleDownload();
      }
    } catch (err) {
      console.error("Error sharing image:", err);
      // Fallback to download if sharing fails
      handleDownload();
    }
  };

  const toggleFullscreen = () => {
    setShowFullscreen(!showFullscreen);
  };
  
  const handleAddSticker = (sticker: Sticker) => {
    // Calculate initial position (center of container)
    const containerRect = stickerContainerRef.current?.getBoundingClientRect();
    const initialPosition = containerRect 
      ? { 
          x: containerRect.width / 2 - 40, 
          y: containerRect.height / 2 - 40 
        }
      : { x: 0, y: 0 };
    
    const newSticker: PlacedSticker = {
      id: `${sticker.id}-${Date.now()}`,
      sticker,
      position: initialPosition
    };
    
    setPlacedStickers([...placedStickers, newSticker]);
  };
  
  const handleUpdateStickerPosition = (id: string, position: { x: number; y: number }) => {
    setPlacedStickers(prev => 
      prev.map(sticker => 
        sticker.id === id ? { ...sticker, position } : sticker
      )
    );
  };
  
  const handleRemoveSticker = (id: string) => {
    setPlacedStickers(prev => prev.filter(sticker => sticker.id !== id));
  };

  const toggleDateDisplay = () => {
    setShowDate(!showDate);
  };
  
  const toggleDateFormat = () => {
    setDateFormat(prev => prev === 'short' ? 'long' : 'short');
  };
  
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = dateFormat === 'short' 
      ? { month: 'numeric', day: 'numeric', year: 'numeric' }
      : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    
    return currentDate.toLocaleDateString(undefined, options);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="relative">
                <div 
                  ref={resultRef}
                  className="relative rounded-lg overflow-hidden shadow-lg"
                  style={{ 
                    backgroundColor: frameColor,
                    padding: `${borderWidth}px`,
                  }}
                >
                  <div 
                    ref={stickerContainerRef}
                    className="grid w-full h-full relative"
                    style={{
                      gridTemplateColumns: `repeat(${frameConfig.columns}, 1fr)`,
                      gridTemplateRows: `repeat(${frameConfig.rows}, 1fr)`,
                      gap: `${spacing}px`,
                      aspectRatio: getOptimalAspectRatio(),
                    }}
                  >
                    {photos.map((photo, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative rounded-sm overflow-hidden"
                      >
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                    
                    {/* Date display */}
                    {showDate && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg backdrop-blur-sm z-20">
                        {getFormattedDate()}
                      </div>
                    )}
                    
                    {/* Stickers layer */}
                    {placedStickers.map(placedSticker => (
                      <DraggableSticker
                        key={placedSticker.id}
                        id={placedSticker.id}
                        imageUrl={placedSticker.sticker.url}
                        initialPosition={placedSticker.position}
                        onPositionChange={(position) => handleUpdateStickerPosition(placedSticker.id, position)}
                        onRemove={() => handleRemoveSticker(placedSticker.id)}
                        containerRef={stickerContainerRef}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="absolute top-2 right-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Action buttons */}
          <div className="flex justify-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={toggleDateDisplay}
              className={`${showDate ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : ''}`}
            >
              {showDate ? 'Hide Date' : 'Add Date'}
            </Button>
            
            {showDate && (
              <Button
                variant="outline"
                onClick={toggleDateFormat}
              >
                {dateFormat === 'short' ? 'Long Format' : 'Short Format'}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="style" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Style</span>
              </TabsTrigger>
              <TabsTrigger value="stickers" className="flex items-center gap-2">
                <StickerIcon className="h-4 w-4" />
                <span>Stickers</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="style" className="space-y-6 mt-0">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-medium mb-4 flex items-center">
                  <Palette className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Frame Color</span>
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      className={`
                        w-full h-10 rounded-md border-2 transition-all
                        ${frameColor === color.value ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}
                      `}
                      style={{ backgroundColor: color.value }}
                      onClick={() => onColorChange(color.value)}
                      aria-label={`Select ${color.name} color`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-medium mb-4">Border Width</h3>
                <Slider
                  value={[borderWidth]}
                  min={0}
                  max={50}
                  step={1}
                  onValueChange={(value: number[]) => setBorderWidth(value[0])}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>None</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-medium mb-4">Photo Spacing</h3>
                <Slider
                  value={[spacing]}
                  min={0}
                  max={30}
                  step={1}
                  onValueChange={(value: number[]) => setSpacing(value[0])}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>None</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
              </div>
              
              {/* Width adjustment slider - only show for horizontal layouts */}
              {frameConfig.columns > frameConfig.rows && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800 mt-6">
                  <h3 className="text-xl font-medium mb-4">Image Width</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Adjust the width to make your horizontal photos look better
                  </p>
                  <Slider
                    value={[imageWidth]}
                    min={100}
                    max={200}
                    step={5}
                    onValueChange={(value: number[]) => setImageWidth(value[0])}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Normal</span>
                    <span>Wide</span>
                    <span>Extra Wide</span>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stickers" className="mt-0">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-medium mb-4 flex items-center">
                  <StickerIcon className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Add Stickers</span>
                </h3>
                <StickerSelector onSelectSticker={handleAddSticker} />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Generating..." : "Download Creation"}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              
              <Button
                variant="outline"
                onClick={onReset}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fullscreen preview */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={toggleFullscreen}
        >
          <div 
            className="max-w-3xl w-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="relative rounded-lg overflow-hidden shadow-2xl"
              style={{ 
                backgroundColor: frameColor,
                padding: `${borderWidth}px`,
              }}
            >
              <div 
                className="grid w-full h-full relative"
                style={{
                  gridTemplateColumns: `repeat(${frameConfig.columns}, 1fr)`,
                  gridTemplateRows: `repeat(${frameConfig.rows}, 1fr)`,
                  gap: `${spacing}px`,
                  aspectRatio: getOptimalAspectRatio(),
                }}
              >
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative rounded-sm overflow-hidden"
                  >
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                
                {/* Date display in fullscreen */}
                {showDate && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg backdrop-blur-sm z-20">
                    {getFormattedDate()}
                  </div>
                )}
                
                {/* Stickers in fullscreen */}
                {placedStickers.map(placedSticker => (
                  <div
                    key={placedSticker.id}
                    className="absolute"
                    style={{
                      left: `${placedSticker.position.x}px`,
                      top: `${placedSticker.position.y}px`,
                    }}
                  >
                    <img 
                      src={placedSticker.sticker.url} 
                      alt="Sticker"
                      className="w-20 h-20 object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="absolute -top-12 right-0 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}