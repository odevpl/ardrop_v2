const { Jimp } = require("jimp");

const DEFAULT_BACKGROUND_COLOR = 0xffffffff;

const renderSquareImage = async ({
  sourceImage,
  size,
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
}) => {
  const fitted = sourceImage.clone();
  fitted.scaleToFit({ w: size, h: size });

  const canvas = new Jimp({
    width: size,
    height: size,
    color: backgroundColor,
  });

  const x = Math.round((size - fitted.bitmap.width) / 2);
  const y = Math.round((size - fitted.bitmap.height) / 2);
  canvas.composite(fitted, x, y);

  return canvas;
};

const processSquareImageVariants = async ({
  sourcePath,
  mainOutputPath,
  thumbOutputPath,
  mainSize,
  thumbSize,
  quality = 75,
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
}) => {
  const sourceImage = await Jimp.read(sourcePath);
  const mainImage = await renderSquareImage({
    sourceImage,
    size: mainSize,
    backgroundColor,
  });

  await mainImage.write(mainOutputPath, { quality });

  const thumbImage = await renderSquareImage({
    sourceImage,
    size: thumbSize,
    backgroundColor,
  });

  await thumbImage.write(thumbOutputPath, { quality });
};

module.exports = {
  processSquareImageVariants,
};
