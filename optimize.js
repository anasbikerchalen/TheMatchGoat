const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const IMAGE_SOURCE_DIR = path.join(__dirname, 'articles', 'img');
const MAX_WIDTH = 800; // Max width for resized images, optimal for mobile LCP.
const WEBP_QUALITY = 80; // Quality setting for WebP conversion (1-100).
// ---------------------

let totalBytesSaved = 0;

/**
 * Recursively scans a directory for images and processes them.
 * @param {string} directory The directory to scan.
 */
async function processDirectory(directory) {
  const files = await fs.promises.readdir(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = await fs.promises.stat(fullPath);

    if (stat.isDirectory()) {
      await processDirectory(fullPath); // Recurse into subdirectories
    } else if (/\.(jpe?g|png)$/i.test(file)) {
      await optimizeImage(fullPath);
    }
  }
}

/**
 * Converts an image to WebP, resizes it, and logs the file size savings.
 * @param {string} imagePath The full path to the image file.
 */
async function optimizeImage(imagePath) {
  const originalSize = (await fs.promises.stat(imagePath)).size;
  const parsedPath = path.parse(imagePath);
  const newFileName = `${parsedPath.name}.webp`;
  const outputPath = path.join(parsedPath.dir, newFileName);

  try {
    const info = await sharp(imagePath)
      .resize({
        width: MAX_WIDTH,
        fit: 'inside', // Maintain aspect ratio, don't upscale if smaller
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);

    const newSize = info.size;
    const savings = originalSize - newSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    totalBytesSaved += savings;

    console.log(`✅ Optimized: ${path.basename(imagePath)} -> ${newFileName}`);
    console.log(`   Savings: ${(savings / 1024).toFixed(2)} KB (${savingsPercent}%) | New size: ${(newSize / 1024).toFixed(2)} KB\n`);

  } catch (error) {
    console.error(`❌ Failed to optimize ${path.basename(imagePath)}:`, error);
  }
}

/**
 * Main function to run the optimization process.
 */
async function run() {
  console.log('--- Starting Image Optimization ---');
  console.log(`Scanning: ${IMAGE_SOURCE_DIR}\n`);

  await processDirectory(IMAGE_SOURCE_DIR);

  console.log('--- Optimization Complete ---');
  console.log(`Total savings: ${(totalBytesSaved / 1024 / 1024).toFixed(2)} MB`);
}

run().catch(console.error);