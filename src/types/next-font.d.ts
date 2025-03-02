// Type definitions for Next.js fonts
declare module 'next/font/google' {
  interface FontOptions {
    weight?: string | string[];
    style?: string;
    subsets?: string[];
    display?: string;
  }

  interface Font {
    className: string;
    style: {
      fontFamily: string;
    };
  }

  export function Inter(options: FontOptions): Font;
  export function Roboto(options: FontOptions): Font;
  export function Open_Sans(options: FontOptions): Font;
}

// Fix for JSX elements
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 