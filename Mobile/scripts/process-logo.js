const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

const inputPath = path.join(__dirname, '../assets/images/ChatGPT Image Aug 15, 2026, 12_30_14 PM.png');
const bookwormLogoPath = path.join(__dirname, '../assets/images/bookworm_logo.png');
const splashIconPath = path.join(__dirname, '../assets/images/splash-icon.png');
const adaptiveIconPath = path.join(__dirname, '../assets/images/adaptive-icon.png');
const iconPath = path.join(__dirname, '../assets/images/icon.png');

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function () {
    const src = this;

    // 1. Find bounding box of non-transparent pixels
    let minX = src.width, maxX = 0, minY = src.height, maxY = 0;
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const idx = (src.width * y + x) << 2;
        const alpha = src.data[idx + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const artWidth = maxX - minX + 1;
    const artHeight = maxY - minY + 1;
    console.log(`Artwork dimensions: ${artWidth}x${artHeight}`);

    // Create a 800x800 square canvas
    const size = 800;
    // Scale factor to fit artwork in canvas with padding (~85% of canvas width)
    const targetWidth = Math.round(size * 0.85);
    const scale = targetWidth / artWidth;
    const targetHeight = Math.round(artHeight * scale);

    const offsetX = Math.round((size - targetWidth) / 2);
    const offsetY = Math.round((size - targetHeight) / 2);

    // Helper to build a PNG image
    function createSquareImage(opaqueBackground = false) {
      const out = new PNG({ width: size, height: size });

      // Fill background
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (size * y + x) << 2;
          if (opaqueBackground) {
            // White background for solid app icon
            out.data[idx] = 255;     // R
            out.data[idx + 1] = 255; // G
            out.data[idx + 2] = 255; // B
            out.data[idx + 3] = 255; // Alpha
          } else {
            // Transparent
            out.data[idx] = 0;
            out.data[idx + 1] = 0;
            out.data[idx + 2] = 0;
            out.data[idx + 3] = 0;
          }
        }
      }

      // Resampling onto target canvas
      for (let ty = 0; ty < targetHeight; ty++) {
        for (let tx = 0; tx < targetWidth; tx++) {
          const destX = offsetX + tx;
          const destY = offsetY + ty;

          const srcX = minX + (tx / scale);
          const srcY = minY + (ty / scale);

          const x0 = Math.floor(srcX);
          const y0 = Math.floor(srcY);
          const x1 = Math.min(x0 + 1, src.width - 1);
          const y1 = Math.min(y0 + 1, src.height - 1);

          const dx = srcX - x0;
          const dy = srcY - y0;

          const idx00 = (src.width * y0 + x0) << 2;
          const idx10 = (src.width * y0 + x1) << 2;
          const idx01 = (src.width * y1 + x0) << 2;
          const idx11 = (src.width * y1 + x1) << 2;

          const destIdx = (size * destY + destX) << 2;

          for (let c = 0; c < 4; c++) {
            const val = (1 - dx) * (1 - dy) * src.data[idx00 + c] +
                        dx * (1 - dy) * src.data[idx10 + c] +
                        (1 - dx) * dy * src.data[idx01 + c] +
                        dx * dy * src.data[idx11 + c];
            
            if (opaqueBackground && c < 3) {
              const alpha = src.data[idx00 + 3] / 255;
              const blended = Math.round(val * alpha + 255 * (1 - alpha));
              out.data[destIdx + c] = blended;
            } else if (opaqueBackground && c === 3) {
              out.data[destIdx + 3] = 255;
            } else {
              out.data[destIdx + c] = Math.round(val);
            }
          }
        }
      }

      return out;
    }

    const transparentPng = createSquareImage(false);
    const opaquePng = createSquareImage(true);

    // Save transparent variants
    fs.writeFileSync(bookwormLogoPath, PNG.sync.write(transparentPng));
    fs.writeFileSync(splashIconPath, PNG.sync.write(transparentPng));
    fs.writeFileSync(adaptiveIconPath, PNG.sync.write(transparentPng));

    // Save opaque variant for app icon
    fs.writeFileSync(iconPath, PNG.sync.write(opaquePng));

    console.log('Successfully generated clean logo assets!');
  });
