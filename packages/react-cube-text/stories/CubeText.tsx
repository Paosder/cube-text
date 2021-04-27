import React, { useEffect, useRef } from "react";
import { CubeText as Renderer } from "@paosder/cube-text";

export interface CubeTextProps {
  /**
   * text to render.
   */
  text: string;
  /**
   * font size.
   */
  size: number;
  /**
   * Camera callback function when cubeText renders before.
   * We may modify its reference value and if return true, renderer will refresh its camera matrix.
   * Do not modify reference itself, just modify value via array assignment statement.
   */
}

export const CubeText = React.forwardRef<Renderer, CubeTextProps>(
  ({ text, ...props }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<Renderer>();
    useEffect(() => {
      if (wrapperRef.current) {
        rendererRef.current = new Renderer(wrapperRef.current);
        rendererRef.current.run();
      }
      return () => {
        rendererRef.current?.stop();
        rendererRef.current?.destroy();
      };
    }, []);

    useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.drawText(text);
      }
    }, [text]);
    return (
      <div
        ref={wrapperRef}
        style={{ position: "relative", height: "200px" }}
        {...props}
      />
    );
  }
);
