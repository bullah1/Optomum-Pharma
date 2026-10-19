/**
 * Image Processing Pipeline
 * - Auto resize to max 1000x1000 (square-friendly)
 * - WebP compression (quality 85%)
 * - Basic watermark/overlay detection
 * - File size optimization
 */

const MAX_SIZE = 1000;
const WEBP_QUALITY = 0.85;

/** Resize + convert to WebP canvas blob */
export async function processImage(file: File): Promise<{ blob: Blob; width: number; height: number; originalSize: number; processedSize: number }> {
  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight, MAX_SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // High-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fallback to JPEG
  let blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
  if (!blob || blob.size === 0) {
    blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  }

  return {
    blob: blob!,
    width,
    height,
    originalSize: file.size,
    processedSize: blob!.size,
  };
}

/** Detect potential watermark/overlay patterns */
export function detectWatermarkRisk(file: File): Promise<{ hasRisk: boolean; reason: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 200; // Sample size
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Check corners for semi-transparent overlays (common watermark placement)
      const corners = [
        getRegionAvgAlpha(data, size, 0, 0, 40, 40),
        getRegionAvgAlpha(data, size, size - 40, 0, 40, 40),
        getRegionAvgAlpha(data, size, 0, size - 40, 40, 40),
        getRegionAvgAlpha(data, size, size - 40, size - 40, 40, 40),
      ];

      // Check for repeating diagonal pattern (tiled watermark)
      const hasDiagonalPattern = checkDiagonalRepeat(data, size);

      // Check for text-like thin lines in center area
      const centerContrast = getCenterContrast(data, size);

      if (hasDiagonalPattern) {
        resolve({ hasRisk: true, reason: "Possible tiled watermark pattern detected" });
      } else if (centerContrast > 0.6) {
        resolve({ hasRisk: true, reason: "Possible text overlay detected in center" });
      } else {
        resolve({ hasRisk: false, reason: "" });
      }

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve({ hasRisk: false, reason: "" });
    img.src = URL.createObjectURL(file);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function getRegionAvgAlpha(data: Uint8ClampedArray, stride: number, x: number, y: number, w: number, h: number): number {
  let sum = 0, count = 0;
  for (let row = y; row < y + h && row < stride; row++) {
    for (let col = x; col < x + w && col < stride; col++) {
      sum += data[(row * stride + col) * 4 + 3];
      count++;
    }
  }
  return count ? sum / count / 255 : 1;
}

function checkDiagonalRepeat(data: Uint8ClampedArray, size: number): boolean {
  // Sample diagonal pixels and check for repeating brightness pattern
  const samples: number[] = [];
  for (let i = 0; i < size; i += 4) {
    const idx = (i * size + i) * 4;
    if (idx < data.length - 3) {
      samples.push((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
    }
  }
  if (samples.length < 10) return false;

  // Check for periodicity
  let matchCount = 0;
  const period = Math.floor(samples.length / 3);
  if (period < 3) return false;
  for (let i = 0; i < samples.length - period; i++) {
    if (Math.abs(samples[i] - samples[i + period]) < 10) matchCount++;
  }
  return matchCount / (samples.length - period) > 0.85;
}

function getCenterContrast(data: Uint8ClampedArray, size: number): number {
  // Check center strip for high-contrast thin features (text)
  const cy = Math.floor(size / 2);
  const strip: number[] = [];
  for (let x = Math.floor(size * 0.2); x < Math.floor(size * 0.8); x++) {
    const idx = (cy * size + x) * 4;
    strip.push((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
  }
  if (strip.length < 10) return 0;

  let transitions = 0;
  for (let i = 1; i < strip.length; i++) {
    if (Math.abs(strip[i] - strip[i - 1]) > 80) transitions++;
  }
  return transitions / strip.length;
}

/** Get file extension for processed image */
export function getProcessedExtension(): string {
  // Check WebP support
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp") ? "webp" : "jpg";
}
