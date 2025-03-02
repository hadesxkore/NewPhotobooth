"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface DraggableStickerProps {
  imageUrl: string;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onRemove?: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  id: string;
  size?: number;
}

export function DraggableSticker({
  imageUrl,
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  onRemove,
  containerRef,
  id,
  size = 80
}: DraggableStickerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const stickerRef = useRef<HTMLDivElement>(null);
  
  // Constrain the sticker to the container bounds
  const constrainToBounds = (pos: { x: number; y: number }) => {
    if (!containerRef.current || !stickerRef.current) return pos;
    
    const container = containerRef.current.getBoundingClientRect();
    const sticker = stickerRef.current.getBoundingClientRect();
    
    const maxX = container.width - sticker.width / 2;
    const maxY = container.height - sticker.height / 2;
    
    return {
      x: Math.min(Math.max(0, pos.x), maxX),
      y: Math.min(Math.max(0, pos.y), maxY)
    };
  };
  
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleDragEnd = () => {
    // Don't immediately clear dragging state to allow controls to be clicked
    setTimeout(() => {
      if (!isHovered) {
        setIsDragging(false);
      }
    }, 100);
  };
  
  const handleDrag = (_: any, info: { offset: { x: number; y: number } }) => {
    const newPosition = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y
    };
    
    const constrainedPosition = constrainToBounds(newPosition);
    setPosition(constrainedPosition);
    
    if (onPositionChange) {
      onPositionChange(constrainedPosition);
    }
  };
  
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev + 15);
  };
  
  const handleResize = (increase: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => {
      const newScale = increase ? prev + 0.1 : prev - 0.1;
      return Math.max(0.5, Math.min(newScale, 2)); // Limit scale between 0.5 and 2
    });
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    // Only clear hover if not dragging
    if (!isDragging) {
      setIsHovered(false);
    }
  };
  
  return (
    <motion.div
      ref={stickerRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 1000)}
      initial={{ x: position.x, y: position.y }}
      animate={{ 
        x: position.x, 
        y: position.y,
        rotate: rotation,
        scale: scale,
        zIndex: isDragging || isHovered ? 10 : 1
      }}
      whileTap={{ scale: scale * 1.05 }}
      className="absolute cursor-move touch-none select-none photobooth-sticker"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img 
        src={imageUrl} 
        alt="Sticker" 
        className="w-full h-full object-contain pointer-events-none sticker-img"
        crossOrigin="anonymous"
      />
      
      {/* Controls that appear when dragging or hovering */}
      {(isDragging || isHovered) && (
        <div 
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={(e) => handleResize(false, e)}
            className="bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md text-gray-700 text-xs hover:bg-gray-100"
          >
            -
          </button>
          <button 
            onClick={(e) => handleRotate(e)}
            className="bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md text-gray-700 text-xs hover:bg-gray-100"
          >
            ↻
          </button>
          <button 
            onClick={(e) => handleResize(true, e)}
            className="bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md text-gray-700 text-xs hover:bg-gray-100"
          >
            +
          </button>
          <button 
            onClick={(e) => handleRemove(e)}
            className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md text-white text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}
    </motion.div>
  );
} 