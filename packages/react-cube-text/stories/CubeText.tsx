import React from "react";

export interface CubeTextProps {
  /**
   * 임시 리음.
   */
  text?: string;
}

export const CubeText: React.FC<CubeTextProps> = ({ text }) => {
  const t = 4;
  return <div>Hello world!{text}</div>;
};
