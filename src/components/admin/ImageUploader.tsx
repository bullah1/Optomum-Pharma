import { useState, useRef } from "react";
import { Upload, X, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { processImage, detectWatermarkRisk, getProcessedExtension } from "@/lib/imageProcessor";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ADMIN_CODE = "990990";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

const ImageUploader = ({ value, onChange }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [watermarkWarning, setWatermarkWarning] = useState<string>("");
  const [mode, setMode] = useState<"url" | "upload">(value && !value.includes("product-images") ? "url" : "upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Failed to read processed image"));
          return;
        }
        const base64 = reader.result.split(",")[1];
        if (!base64) {
          reject(new Error("Failed to prepare image for upload"));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read processed image"));
      reader.readAsDataURL(blob);
    });

  const handleUpload = async (file: File) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024; // 10MB raw (will be compressed)
    if (file.size > maxSize) { toast.error("File must be less than 10MB"); return; }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { toast.error("Only JPG, PNG, WebP, GIF allowed"); return; }

    setUploading(true);
    setWatermarkWarning("");

    try {
      // Step 1: Watermark detection
      setProcessingStatus("Checking for watermarks...");
      const { hasRisk, reason } = await detectWatermarkRisk(file);
      if (hasRisk) {
        setWatermarkWarning(reason);
        toast.warning(`Warning: ${reason}. Please use clean, watermark-free images.`);
      }

      // Step 2: Process image (resize + compress to WebP)
      setProcessingStatus("Optimizing image...");
      const result = await processImage(file);
      const savings = Math.round((1 - result.processedSize / result.originalSize) * 100);

      // Step 3: Upload processed image via admin backend
      setProcessingStatus("Uploading...");
      const ext = getProcessedExtension();
      const contentType = ext === "webp" ? "image/webp" : "image/jpeg";
      const fileData = await blobToBase64(result.blob);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({
          admin_code: ADMIN_CODE,
          fileData,
          extension: ext,
          contentType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (!data?.publicUrl) {
        throw new Error("Upload failed");
      }

      onChange(data.publicUrl);

      const sizeKB = Math.round(result.processedSize / 1024);
      toast.success(`Uploaded ${result.width}x${result.height} • ${sizeKB}KB${savings > 0 ? ` (${savings}% smaller)` : ""}`);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      setProcessingStatus("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setMode("upload")} className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "upload" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Upload
        </button>
        <button type="button" onClick={() => setMode("url")} className={`text-xs px-3 py-1 rounded-full transition-colors ${mode === "url" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          URL
        </button>
      </div>

      {mode === "url" ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... image URL"
          className="w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
        />
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-2xl border-2 border-dashed border-border bg-secondary/20 cursor-pointer hover:border-primary/40 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">{processingStatus}</span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload (auto-optimized to WebP)</span>
              <span className="text-[10px] text-muted-foreground/60">Max 1000x1000 • Watermark check • HD quality</span>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => { e.target.files?.[0] && handleUpload(e.target.files[0]); e.target.value = ""; }} />
        </div>
      )}

      {/* Watermark warning */}
      {watermarkWarning && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-destructive">{watermarkWarning}</p>
            <p className="text-[10px] text-destructive/70 mt-0.5">Use original brand images only. No scraped/watermarked images.</p>
          </div>
        </div>
      )}

      {/* Image quality info */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
        <Info size={10} />
        <span>Auto: resize to 1000px max, WebP compress, watermark check</span>
      </div>

      {value && (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="h-20 rounded-xl object-cover bg-muted" />
          <button type="button" onClick={() => { onChange(""); setWatermarkWarning(""); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm">
            <X size={10} />
          </button>
          {!watermarkWarning && value && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
