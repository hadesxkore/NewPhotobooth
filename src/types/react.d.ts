// Type definitions for React
declare module 'react' {
  export type ReactNode = 
    | React.ReactElement
    | string
    | number
    | boolean
    | null
    | undefined
    | React.ReactNodeArray;
  
  export interface ReactNodeArray extends Array<ReactNode> {}
  export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: string | null;
  }
  
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  
  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }
  
  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P): JSX.Element | null;
  }
  
  export default React;
}

// HTML Element types
interface HTMLElement {
  [key: string]: any;
}

interface HTMLDivElement extends HTMLElement {}
interface HTMLImageElement extends HTMLElement {}
interface HTMLCanvasElement extends HTMLElement {}
interface HTMLVideoElement extends HTMLElement {} 