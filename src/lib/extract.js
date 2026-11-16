import { createWorker } from 'tesseract.js'
import {
  MultiFormatReader,
  BinaryBitmap,
  HybridBinarizer,
  HTMLCanvasElementLuminanceSource,
  DecodeHintType,
  BarcodeFormat,
} from '@zxing/library'
import { parseCouponText } from './parse'

/*
  Image → coupon fields, fully on-device:
  1. Barcode / QR decode with ZXing (exact code when there is one).
  2. OCR with Tesseract (Hebrew + English). Language files download once (~10MB),
     then they're cached by the browser and it works offline.
  3. Heuristic parsing of the text (parse.js).
*/

let workerPromise = null
let progressListener = null

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker(['heb', 'eng'], 1, { logger: (m) => progressListener?.(m) })
      .then(async (w) => {
        await w.setParameters({ preserve_interword_spaces: '1' })
        return w
      })
      .catch((err) => {
        workerPromise = null // allow a retry (e.g. first run without internet)
        throw err
      })
  }
  return workerPromise
}

export async function loadImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

// Draws the image scaled so its long side is ≤ maxSide (and ≥ minSide, upscaling small images).
function drawToCanvas(img, maxSide, minSide = 0) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  const long = Math.max(w, h)
  const scale = long > maxSide ? maxSide / long : minSide && long < minSide ? minSide / long : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#fff' // transparent PNGs → white background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

// Grayscale + contrast stretch (2%–98% percentiles). Helps OCR on colourful coupon designs.
function enhanceForOcr(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = img.data
  const hist = new Uint32Array(256)
  for (let i = 0; i < px.length; i += 4) {
    const y = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000
    px[i] = y
    hist[y | 0]++
  }
  const total = px.length / 4
  let lo = 0
  let hi = 255
  for (let acc = 0; lo < 255 && (acc += hist[lo]) < total * 0.02; lo++);
  for (let acc = 0; hi > 0 && (acc += hist[hi]) < total * 0.02; hi--);
  const range = Math.max(1, hi - lo)
  for (let i = 0; i < px.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((px[i] - lo) * 255) / range))
    px[i] = px[i + 1] = px[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

function readBarcode(canvas) {
  const reader = new MultiFormatReader()
  reader.setHints(new Map([[DecodeHintType.TRY_HARDER, true]]))
  try {
    const result = reader.decode(new BinaryBitmap(new HybridBinarizer(new HTMLCanvasElementLuminanceSource(canvas))))
    return { text: result.getText(), format: BarcodeFormat[result.getBarcodeFormat()] }
  } catch {
    return null // no barcode found
  }
}

// Smaller JPEG copy of the screenshot to keep with the coupon (shown at the checkout).
export async function compressImage(file, maxSide = 1400, quality = 0.85) {
  const canvas = drawToCanvas(await loadImage(file), maxSide)
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', quality))
}

/**
 * @param {File|Blob} file   coupon screenshot
 * @param {(p:{stage:'barcode'|'loading'|'ocr', progress:number})=>void} onProgress
 */
export async function extractCoupon(file, onProgress) {
  const img = await loadImage(file)

  onProgress?.({ stage: 'barcode', progress: 0 })
  const barcode = readBarcode(drawToCanvas(img, 2400))

  const ocrCanvas = enhanceForOcr(drawToCanvas(img, 2000, 1400))
  progressListener = (m) => {
    if (m.status === 'recognizing text') onProgress?.({ stage: 'ocr', progress: m.progress })
    else onProgress?.({ stage: 'loading', progress: m.progress ?? 0 })
  }
  try {
    const worker = await getWorker()
    const { data } = await worker.recognize(ocrCanvas)
    return parseCouponText(data.text, barcode)
  } finally {
    progressListener = null
  }
}
