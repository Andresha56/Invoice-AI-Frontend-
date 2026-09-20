import type { Area } from "react-easy-crop";

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  image.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL("image/png");
};
