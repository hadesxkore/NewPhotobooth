declare module 'html-to-image' {
  export interface Options {
    quality?: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    style?: object;
    filter?: (node: HTMLElement) => boolean;
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;
} 