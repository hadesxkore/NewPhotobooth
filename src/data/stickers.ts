export interface Sticker {
  id: string;
  name: string;
  url: string;
  category: 'emoji' | 'decoration' | 'text' | 'frame';
}

export const stickers: Sticker[] = [
  // Emoji stickers
  {
    id: 'emoji-1',
    name: 'Smiling Face',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/grinning-face-with-big-eyes_1f603.png',
    category: 'emoji'
  },
  {
    id: 'emoji-2',
    name: 'Heart Eyes',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/smiling-face-with-heart-eyes_1f60d.png',
    category: 'emoji'
  },
  {
    id: 'emoji-3',
    name: 'Laughing',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/face-with-tears-of-joy_1f602.png',
    category: 'emoji'
  },
  {
    id: 'emoji-4',
    name: 'Cool',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/smiling-face-with-sunglasses_1f60e.png',
    category: 'emoji'
  },
  {
    id: 'emoji-5',
    name: 'Party',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/partying-face_1f973.png',
    category: 'emoji'
  },
  {
    id: 'emoji-6',
    name: 'Love',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/red-heart_2764-fe0f.png',
    category: 'emoji'
  },
  
  // Decoration stickers
  {
    id: 'deco-1',
    name: 'Star',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/star_2b50.png',
    category: 'decoration'
  },
  {
    id: 'deco-2',
    name: 'Rainbow',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/rainbow_1f308.png',
    category: 'decoration'
  },
  {
    id: 'deco-3',
    name: 'Sparkles',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/sparkles_2728.png',
    category: 'decoration'
  },
  {
    id: 'deco-4',
    name: 'Crown',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/crown_1f451.png',
    category: 'decoration'
  },
  {
    id: 'deco-5',
    name: 'Balloon',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/balloon_1f388.png',
    category: 'decoration'
  },
  {
    id: 'deco-6',
    name: 'Gift',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/wrapped-gift_1f381.png',
    category: 'decoration'
  },
  
  // Text stickers
  {
    id: 'text-1',
    name: 'LOL',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/rolling-on-the-floor-laughing_1f923.png',
    category: 'text'
  },
  {
    id: 'text-2',
    name: 'OMG',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/face-screaming-in-fear_1f631.png',
    category: 'text'
  },
  {
    id: 'text-3',
    name: 'WOW',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/astonished-face_1f632.png',
    category: 'text'
  },
  
  // Frame stickers
  {
    id: 'frame-1',
    name: 'Camera',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/camera_1f4f7.png',
    category: 'frame'
  },
  {
    id: 'frame-2',
    name: 'Picture Frame',
    url: 'https://em-content.zobj.net/thumbs/120/apple/354/framed-picture_1f5bc-fe0f.png',
    category: 'frame'
  }
]; 