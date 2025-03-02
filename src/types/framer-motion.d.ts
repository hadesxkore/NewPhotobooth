declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    [key: string]: any;
  }

  type MotionComponent = {
    (props: MotionProps & { children?: React.ReactNode }): JSX.Element;
  };

  export const motion: {
    div: MotionComponent;
    span: MotionComponent;
    img: MotionComponent;
    button: MotionComponent;
    a: MotionComponent;
    [key: string]: MotionComponent;
  };

  export const AnimatePresence: (props: AnimatePresenceProps) => JSX.Element;
} 