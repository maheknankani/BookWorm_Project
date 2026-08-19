import React from "react";
import { Image as RNImage } from "react-native";

export const Image = ({ source, style, contentFit, ...props }) => {
  const resizeMode =
    contentFit === "cover" ? "cover" : contentFit === "contain" ? "contain" : "cover";
  return <RNImage source={source} style={style} resizeMode={resizeMode} {...props} />;
};

export default Image;
