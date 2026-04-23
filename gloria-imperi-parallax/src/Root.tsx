import React from "react";
import { Composition } from "remotion";
import { GloriaImperiParallax } from "./compositions/GloriaImperiParallax";

export const Root: React.FC = () => {
  return (
    <Composition
      id="GloriaImperi"
      component={GloriaImperiParallax}
      durationInFrames={480}
      fps={24}
      width={1080}
      height={1920}
    />
  );
};
