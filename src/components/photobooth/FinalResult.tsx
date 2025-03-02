"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { type FrameConfig, PhotoData } from "./Photobooth";
import { Download, RotateCcw, Palette, Maximize, Share2, Sticker as StickerIcon, Edit } from "lucide-react";
import { StickerSelector } from "./StickerSelector";
import { DraggableSticker } from "./DraggableSticker";
import { Sticker } from "@/data/stickers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilteredImage from "./FilteredImage";
import { FILTERS } from "./FilterSelector";

interface FinalResultProps {
  frameConfig: FrameConfig;
  photos: PhotoData[];
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
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [updatedPhotos, setUpdatedPhotos] = useState<PhotoData[]>(photos);
  
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
            // Get the filter for this specific photo
            const photoFilter = updatedPhotos[index]?.filter || "none";
            
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
                // Draw the image to the canvas
                ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                
                // Apply filter to just this photo area using the photo's specific filter
                if (photoFilter && photoFilter !== 'none') {
                  // Apply filter only to this photo's area by getting just that region's image data
                  applyFilterToContext(ctx, photoFilter, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                }
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
                  // Draw the image to the canvas
                  ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                  
                  // Apply filter to just this photo area using the photo's specific filter
                  if (photoFilter && photoFilter !== 'none') {
                    // Apply filter only to this photo's area by getting just that region's image data
                    applyFilterToContext(ctx, photoFilter, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                  }
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
        
        // Draw stickers
        const stickerPromises = placedStickers.map(placedSticker => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = placedSticker.sticker.url;
            
            img.onload = () => {
              try {
                const stickerRect = document.getElementById(placedSticker.id)?.getBoundingClientRect();
                if (stickerRect) {
                  const relativeRect = {
                    left: stickerRect.left - rect.left,
                    top: stickerRect.top - rect.top,
                    width: stickerRect.width,
                    height: stickerRect.height
                  };
                  
                  // Draw sticker to canvas
                  ctx.drawImage(img, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                }
              } catch (e) {
                console.error("Error drawing sticker to canvas:", e);
              }
              resolve();
            };
            img.onerror = () => resolve(); // Continue even if sticker fails
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
      
      // Note: For the html-to-image approach, filters are already applied in the DOM
      // through the FilteredImage component, so we don't need to apply them manually
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
        const photoPromises = Array.from(photoElements).map((img, index) => {
          return new Promise<void>((resolve) => {
            const imgEl = img as HTMLImageElement;
            // Get the filter for this specific photo
            const photoFilter = updatedPhotos[index]?.filter || "none";
            
            if (imgEl.complete) {
              const imgRect = imgEl.getBoundingClientRect();
              const relativeRect = {
                left: imgRect.left - rect.left,
                top: imgRect.top - rect.top,
                width: imgRect.width,
                height: imgRect.height
              };
              
              try {
                // Draw the image to the canvas
                ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                
                // Apply filter to just this photo area using the photo's specific filter
                if (photoFilter && photoFilter !== 'none') {
                  // Apply filter only to this photo's area by getting just that region's image data
                  applyFilterToContext(ctx, photoFilter, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                }
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
                  // Draw the image to the canvas
                  ctx.drawImage(imgEl, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                  
                  // Apply filter to just this photo area using the photo's specific filter
                  if (photoFilter && photoFilter !== 'none') {
                    // Apply filter only to this photo's area by getting just that region's image data
                    applyFilterToContext(ctx, photoFilter, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                  }
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
        
        // Draw stickers
        const stickerPromises = placedStickers.map(placedSticker => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = placedSticker.sticker.url;
            
            img.onload = () => {
              try {
                const stickerRect = document.getElementById(placedSticker.id)?.getBoundingClientRect();
                if (stickerRect) {
                  const relativeRect = {
                    left: stickerRect.left - rect.left,
                    top: stickerRect.top - rect.top,
                    width: stickerRect.width,
                    height: stickerRect.height
                  };
                  
                  // Draw sticker to canvas
                  ctx.drawImage(img, relativeRect.left, relativeRect.top, relativeRect.width, relativeRect.height);
                }
              } catch (e) {
                console.error("Error drawing sticker to canvas:", e);
              }
              resolve();
            };
            img.onerror = () => resolve(); // Continue even if sticker fails
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

  // Find the function that applies filters to the canvas
  // Add a new function to apply filters to the canvas context

  // Update the applyFilterToContext function to work with specific regions
  const applyFilterToContext = (
    ctx: CanvasRenderingContext2D, 
    filterId: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ) => {
    if (!filterId || filterId === 'none') return;
    
    // Get image data only from the specific photo area
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    switch(filterId) {
      case "grayscale":
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg; // red
          data[i + 1] = avg; // green
          data[i + 2] = avg; // blue
        }
        break;
      case "sepia":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
      case "vintage":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Sepia effect (lighter than full sepia)
          data[i] = Math.min(255, (r * 0.35) + (g * 0.75) + (b * 0.18));
          data[i + 1] = Math.min(255, (r * 0.31) + (g * 0.65) + (b * 0.15));
          data[i + 2] = Math.min(255, (r * 0.27) + (g * 0.53) + (b * 0.13));
          
          // Increase contrast
          data[i] = Math.min(255, data[i] * 1.2);
          data[i + 1] = Math.min(255, data[i + 1] * 1.2);
          data[i + 2] = Math.min(255, data[i + 2] * 1.2);
        }
        break;
      case "contrast":
        const factor = 1.5; // Contrast factor
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
        }
        break;
      case "brightness":
        const brightnessValue = 50; // Brightness increase
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] + brightnessValue);
          data[i + 1] = Math.min(255, data[i + 1] + brightnessValue);
          data[i + 2] = Math.min(255, data[i + 2] + brightnessValue);
        }
        break;
      case "invert":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        break;
      case "blur":
        // For blur, we'll use a simpler box blur algorithm that's more efficient
        const blurRadius = 3;
        const blurredData = new Uint8ClampedArray(data.length);
        
        // Copy original data to blurredData
        for (let i = 0; i < data.length; i++) {
          blurredData[i] = data[i];
        }
        
        // Apply a simple box blur
        for (let y = blurRadius; y < height - blurRadius; y++) {
          for (let x = blurRadius; x < width - blurRadius; x++) {
            let r = 0, g = 0, b = 0;
            let count = 0;
            
            // Sample the surrounding pixels
            for (let ky = -blurRadius; ky <= blurRadius; ky++) {
              for (let kx = -blurRadius; kx <= blurRadius; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4;
                if (idx >= 0 && idx < data.length - 3) {
                  r += data[idx];
                  g += data[idx + 1];
                  b += data[idx + 2];
                  count++;
                }
              }
            }
            
            // Calculate average and set the pixel
            const idx = (y * width + x) * 4;
            if (count > 0 && idx >= 0 && idx < blurredData.length - 3) {
              blurredData[idx] = r / count;
              blurredData[idx + 1] = g / count;
              blurredData[idx + 2] = b / count;
            }
          }
        }
        
        // Copy blurred data back to original
        for (let i = 0; i < data.length; i++) {
          data[i] = blurredData[i];
        }
        break;
    }
    
    // Put the modified image data back to the canvas, but only for the specific region
    ctx.putImageData(imageData, x, y);
  };

  // Function to update a photo's filter
  const handleUpdatePhotoFilter = (index: number, filterId: string) => {
    const newPhotos = [...updatedPhotos];
    newPhotos[index] = { ...newPhotos[index], filter: filterId };
    setUpdatedPhotos(newPhotos);
  };

  // Simple filter selector component
  const FilterSelector = ({ selectedFilter, onSelectFilter }: { selectedFilter: string, onSelectFilter: (filterId: string) => void }) => {
    return (
      <div className="grid grid-cols-4 gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onSelectFilter(filter.id)}
            className={`p-2 rounded-md transition-all ${
              selectedFilter === filter.id 
                ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500' 
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={`Apply ${filter.name} filter`}
          >
            <div className="text-xs font-medium text-center">{filter.name}</div>
          </button>
        ))}
      </div>
    );
  };

  // Update photos when props change
  useEffect(() => {
    setUpdatedPhotos(photos);
  }, [photos]);

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
                    {updatedPhotos.map((photo, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative rounded-sm overflow-hidden group"
                      >
                        <FilteredImage
                          src={photo.dataUrl}
                          filterId={photo.filter}
                          className="w-full h-full object-cover"
                          alt={`Photo ${index + 1}`}
                        />
                        
                        {/* Edit filter button */}
                        <button
                          onClick={() => setEditingPhotoIndex(index)}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Edit filter"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
          
          {/* Filter editor modal */}
          {editingPhotoIndex !== null && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-medium mb-4">Edit Filter</h3>
                
                <div className="mb-6">
                  <FilteredImage
                    src={updatedPhotos[editingPhotoIndex].dataUrl}
                    filterId={updatedPhotos[editingPhotoIndex].filter}
                    className="w-full h-64 object-cover rounded-lg"
                    alt={`Photo ${editingPhotoIndex + 1}`}
                  />
                </div>
                
                <FilterSelector
                  selectedFilter={updatedPhotos[editingPhotoIndex].filter}
                  onSelectFilter={(filterId) => handleUpdatePhotoFilter(editingPhotoIndex, filterId)}
                />
                
                <div className="flex justify-end mt-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditingPhotoIndex(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                {updatedPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative rounded-sm overflow-hidden"
                  >
                    <FilteredImage
                      src={photo.dataUrl}
                      filterId={photo.filter}
                      className="w-full h-full object-cover"
                      alt={`Photo ${index + 1}`}
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
                    <FilteredImage
                      src={placedSticker.sticker.url}
                      filterId="none"
                      className="w-20 h-20 object-contain"
                      alt="Sticker"
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