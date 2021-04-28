import React, { useEffect, useRef } from "react";
import {
  CubeText as Renderer,
  generateFullscreen,
  generateGradientColor,
  generateRotateCameraUp,
  generateRotateTo,
  generateRotateZAxis,
  randomRotate,
} from "@paosder/cube-text";

export interface CubeTextProps {
  /**
   * text to render.
   */
  text: string;
  /**
   * font size.
   */
  size: number;

  onInit?: string;

  onRender?: string;

  onRenderCamera?: string;

  height: number;
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
        rendererRef.current.register("renderCamera", generateFullscreen());
        rendererRef.current.register(
          "initCube",
          generateGradientColor([1, 0, 0, 1], [0, 1, 1, 1])
        );
        rendererRef.current.register("initCube", randomRotate);
      }
    }, []);

    useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.drawText(text);
      }
    }, [text]);
    return <div ref={wrapperRef} style={{ position: "relative" }} {...props} />;
  }
);
