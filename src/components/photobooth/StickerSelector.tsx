"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stickers, Sticker } from "@/data/stickers";
import { Smile, Sparkles, MessageSquare, Square } from "lucide-react";

interface StickerSelectorProps {
  onSelectSticker: (sticker: Sticker) => void;
}

type StickerCategory = 'emoji' | 'decoration' | 'text' | 'frame';

export function StickerSelector({ onSelectSticker }: StickerSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('emoji');
  
  const filteredStickers = stickers.filter(sticker => sticker.category === activeCategory);
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
      <h3 className="text-xl font-medium mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Add Stickers
      </h3>
      
      <Tabs defaultValue="emoji" onValueChange={(value: string) => setActiveCategory(value as StickerCategory)}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="emoji" className="flex flex-col items-center gap-1 py-2">
            <Smile className="h-5 w-5" />
            <span className="text-xs">Emoji</span>
          </TabsTrigger>
          <TabsTrigger value="decoration" className="flex flex-col items-center gap-1 py-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs">Decor</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="flex flex-col items-center gap-1 py-2">
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Text</span>
          </TabsTrigger>
          <TabsTrigger value="frame" className="flex flex-col items-center gap-1 py-2">
            <Square className="h-5 w-5" />
            <span className="text-xs">Frames</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="emoji" className="mt-0">
          <div className="grid grid-cols-4 gap-2">
            {filteredStickers.map(sticker => (
              <button
                key={sticker.id}
                className="aspect-square p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => onSelectSticker(sticker)}
                title={sticker.name}
              >
                <img 
                  src={sticker.url} 
                  alt={sticker.name} 
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="decoration" className="mt-0">
          <div className="grid grid-cols-4 gap-2">
            {filteredStickers.map(sticker => (
              <button
                key={sticker.id}
                className="aspect-square p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => onSelectSticker(sticker)}
                title={sticker.name}
              >
                <img 
                  src={sticker.url} 
                  alt={sticker.name} 
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="text" className="mt-0">
          <div className="grid grid-cols-4 gap-2">
            {filteredStickers.map(sticker => (
              <button
                key={sticker.id}
                className="aspect-square p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => onSelectSticker(sticker)}
                title={sticker.name}
              >
                <img 
                  src={sticker.url} 
                  alt={sticker.name} 
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="frame" className="mt-0">
          <div className="grid grid-cols-4 gap-2">
            {filteredStickers.map(sticker => (
              <button
                key={sticker.id}
                className="aspect-square p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                onClick={() => onSelectSticker(sticker)}
                title={sticker.name}
              >
                <img 
                  src={sticker.url} 
                  alt={sticker.name} 
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 